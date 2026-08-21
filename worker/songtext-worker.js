// Cloudflare Worker fuer Overhertz: Konten/Login, Credits & Pro-Abo (D1 + Stripe),
// sowie die KI-Einschaetzung (Anthropic). Haelt alle Secrets serverseitig - sie duerfen
// nie im Frontend-Code der statischen Website landen.
//
// Benoetigte Bindings/Variablen im Worker (Cloudflare-Dashboard -> Settings):
//   Secrets:  ANTHROPIC_API_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, RESEND_API_KEY,
//             ADMIN_SECRET (beliebiger langer Zufallsstring, schuetzt POST /admin/aggregate-genres
//             vor fremdem Zugriff - Header "x-admin-secret" muss ihn enthalten)
//   Klartext: STRIPE_PRICE_CREDITS, STRIPE_PRICE_PRO_MONTHLY, STRIPE_PRICE_PRO_ANNUAL
//             (Stripe Price-IDs, z.B. "price_...", sind nicht geheim), RESEND_FROM_EMAIL
//             (Absenderadresse fuer Passwort-Reset-Mails, z.B. "Overhertz <noreply@overhertz.app>")
//   D1-Binding: DB (siehe wrangler.toml + schema.sql)
//   R2-Binding: BATTLE_MEDIA (Track+Bild-Uploads fuer den Battle-Rap-Contest, Bucket muss einmalig
//               manuell im Cloudflare-Dashboard angelegt werden, siehe wrangler.toml)
//   Rate-Limit-Binding RATE_LIMITER wird beim Deploy automatisch angelegt.
//   Cron Trigger (siehe wrangler.toml [triggers]): laeuft nachts automatisch, kein Setup noetig.

const ALLOWED_ORIGINS = new Set([
  "https://trackstar-web.coulrophobia66666.workers.dev",
  "https://overhertz.app",
  "https://www.overhertz.app",
]);

const PRO_MONTHLY_QUOTA = 50;
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 Tage

/* ---------- Kleine Helfer ---------- */

function corsHeadersFor(request) {
  const origin = request.headers.get("Origin") || "";
  const allowOrigin = ALLOWED_ORIGINS.has(origin) ? origin : [...ALLOWED_ORIGINS][0];
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    Vary: "Origin",
  };
}

function jsonResponse(obj, status, corsHeaders) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json", ...corsHeaders },
  });
}

async function safeJson(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

function normalizeEmail(raw) {
  return typeof raw === "string" ? raw.trim().toLowerCase() : "";
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function toHex(bytes) {
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function fromHex(hex) {
  const arr = new Uint8Array(hex.length / 2);
  for (let i = 0; i < arr.length; i++) arr[i] = parseInt(hex.substr(i * 2, 2), 16);
  return arr;
}

async function withRateLimit(env, key, cors, handler) {
  if (env.RATE_LIMITER) {
    const { success } = await env.RATE_LIMITER.limit({ key });
    if (!success) {
      return jsonResponse({ error: "Zu viele Anfragen. Bitte in einer Minute nochmal versuchen." }, 429, cors);
    }
  }
  return handler();
}

function requireDb(env, cors) {
  if (!env.DB) {
    return jsonResponse({ error: "Konten-System ist noch nicht eingerichtet (D1-Datenbank fehlt)." }, 501, cors);
  }
  return null;
}

/* ---------- E-Mail (Resend, fuer Passwort-Reset & E-Mail-Verifizierung) ---------- */

// Einheitliches HTML-Geruest fuer alle Transaktions-Mails - bewusst Tabellen-Layout und
// Inline-Styles statt <style>-Block/Flexbox/Grid, weil viele Mail-Clients (allen voran Outlook)
// modernes CSS und externe/interne Stylesheets ignorieren oder falsch darstellen. Das war bisher
// nackter <p>-Text ohne jedes Branding - sah in vielen Postfaechern nach Spam aus.
function buildEmailHtml(bodyHtml) {
  return `<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Overhertz</title></head>
<body style="margin:0; padding:0; background-color:#f4f1ea;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f1ea; padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px; background-color:#ffffff; border-radius:16px; overflow:hidden; border:1px solid #e5ddc9;">
        <tr>
          <td style="padding:28px 32px; text-align:center; border-bottom:1px solid #eee6d2;">
            <span style="font-family:Georgia, 'Times New Roman', serif; font-size:22px; font-weight:700; letter-spacing:0.03em; color:#8a6a35;">Overhertz</span>
          </td>
        </tr>
        <tr>
          <td style="padding:32px; font-family:Helvetica, Arial, sans-serif; color:#241d10;">
            ${bodyHtml}
          </td>
        </tr>
        <tr>
          <td style="padding:18px 32px; background-color:#faf8f2; text-align:center;">
            <p style="margin:0; font-size:12px; line-height:1.5; color:#9a9484; font-family:Helvetica, Arial, sans-serif;">Overhertz &middot; KI-Songcheck</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function emailButtonHtml(url, label) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
    <tr><td style="border-radius:999px; background-color:#cda86b;">
      <a href="${url}" style="display:inline-block; padding:14px 32px; font-family:Helvetica, Arial, sans-serif; font-size:15px; font-weight:700; color:#241d10; text-decoration:none; border-radius:999px;">${label}</a>
    </td></tr>
  </table>`;
}

async function sendEmail(env, { to, subject, html, text }) {
  if (!env.RESEND_API_KEY || !env.RESEND_FROM_EMAIL) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer " + env.RESEND_API_KEY,
      },
      body: JSON.stringify({ from: env.RESEND_FROM_EMAIL, to: [to], subject, html, text }),
    });
    if (!res.ok) {
      console.error("Resend-Fehler", res.status, (await res.text().catch(() => "")).slice(0, 300));
      return false;
    }
    return true;
  } catch (err) {
    console.error("Resend nicht erreichbar", err);
    return false;
  }
}

/* ---------- Passwoerter (PBKDF2 via Web Crypto, kein externes Paket noetig) ---------- */

async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" }, key, 256);
  return toHex(salt) + ":" + toHex(new Uint8Array(bits));
}

async function verifyPassword(password, stored) {
  const [saltHex, hashHex] = (stored || "").split(":");
  if (!saltHex || !hashHex) return false;
  const salt = fromHex(saltHex);
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" }, key, 256);
  return toHex(new Uint8Array(bits)) === hashHex;
}

/* ---------- Sessions & Konten ---------- */

async function createSession(env, userId) {
  const token = toHex(crypto.getRandomValues(new Uint8Array(32)));
  const now = Date.now();
  await env.DB.prepare("INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)")
    .bind(token, userId, now, now + SESSION_TTL_MS)
    .run();
  return token;
}

async function getUserFromRequest(request, env) {
  const auth = request.headers.get("Authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!token) return null;
  const row = await env.DB.prepare(
    "SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ? AND s.expires_at > ?"
  )
    .bind(token, Date.now())
    .first();
  return row || null;
}

function publicUser(u) {
  return {
    email: u.email,
    plan: u.plan,
    credits: u.credits,
    checksUsedPeriod: u.checks_used_period,
    planRenewsAt: u.plan_renews_at,
    proQuota: PRO_MONTHLY_QUOTA,
    emailVerified: !!u.email_verified_at,
  };
}

const EMAIL_VERIFICATION_TTL_MS = 48 * 60 * 60 * 1000; // 48 Stunden - grosszuegiger als der Passwort-Reset,
// da rein informativ (blockiert nichts) und niemand ausgesperrt werden soll, der die Mail erst spaeter liest.

// Erzeugt einen Verifizierungs-Token und verschickt die Bestaetigungsmail - von Registrierung und
// "Erneut senden" gemeinsam genutzt. Bewusst best-effort: ein fehlgeschlagener Mailversand soll nie
// die Registrierung selbst scheitern lassen (Verifizierung ist informativ, nicht blockierend).
async function sendVerificationEmail(env, request, user) {
  await env.DB.prepare("DELETE FROM email_verifications WHERE user_id = ?").bind(user.id).run();
  const token = toHex(crypto.getRandomValues(new Uint8Array(32)));
  const now = Date.now();
  await env.DB.prepare("INSERT INTO email_verifications (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)")
    .bind(token, user.id, now, now + EMAIL_VERIFICATION_TTL_MS)
    .run();

  const origin = ALLOWED_ORIGINS.has(request.headers.get("Origin") || "")
    ? request.headers.get("Origin")
    : [...ALLOWED_ORIGINS][0];
  const verifyUrl = origin + "/index.html?verify=" + token;

  const sent = await sendEmail(env, {
    to: user.email,
    subject: "Overhertz - Bitte E-Mail bestaetigen",
    text:
      "Hallo,\n\nbitte bestaetige deine E-Mail-Adresse fuer dein Overhertz-Konto (Link 48 Stunden gueltig):\n" +
      verifyUrl +
      "\n\nHast du dich nicht bei Overhertz registriert, kannst du diese E-Mail ignorieren.",
    html: buildEmailHtml(
      '<p style="margin:0 0 16px; font-size:16px; line-height:1.6;">Hallo,</p>' +
        '<p style="margin:0 0 24px; font-size:16px; line-height:1.6;">bitte bestätige deine E-Mail-Adresse, um dein Overhertz-Konto vollständig zu nutzen. Der Link ist 48 Stunden gültig.</p>' +
        emailButtonHtml(verifyUrl, "E-Mail bestätigen") +
        '<p style="margin:0 0 8px; font-size:13px; line-height:1.5; color:#7d7869;">Falls der Button nicht funktioniert, kopiere diesen Link in deinen Browser:</p>' +
        '<p style="margin:0 0 24px; font-size:13px; line-height:1.5; word-break:break-all;"><a href="' +
        verifyUrl +
        '" style="color:#8a6a35;">' +
        verifyUrl +
        "</a></p>" +
        '<p style="margin:0; font-size:13px; line-height:1.5; color:#9a9484;">Hast du dich nicht bei Overhertz registriert, kannst du diese E-Mail ignorieren.</p>'
    ),
  });
  if (!sent) {
    console.error("E-Mail-Verifizierung: Mailversand fehlgeschlagen oder RESEND_API_KEY/RESEND_FROM_EMAIL nicht gesetzt.");
  }
  return sent;
}

async function handleRegister(request, env, cors) {
  const dbErr = requireDb(env, cors);
  if (dbErr) return dbErr;

  const body = await safeJson(request);
  const email = normalizeEmail(body.email);
  const password = typeof body.password === "string" ? body.password : "";
  if (!isValidEmail(email)) return jsonResponse({ error: "Ungueltige E-Mail-Adresse." }, 400, cors);
  if (password.length < 8) return jsonResponse({ error: "Passwort muss mindestens 8 Zeichen haben." }, 400, cors);

  const existing = await env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(email).first();
  if (existing) return jsonResponse({ error: "Diese E-Mail ist bereits registriert." }, 409, cors);

  const id = crypto.randomUUID();
  const passwordHash = await hashPassword(password);
  await env.DB.prepare(
    "INSERT INTO users (id, email, password_hash, created_at, plan, credits, checks_used_period) VALUES (?, ?, ?, ?, 'free', 0, 0)"
  )
    .bind(id, email, passwordHash, Date.now())
    .run();

  // Best-effort: ein fehlgeschlagener Mailversand soll die Registrierung nie scheitern lassen -
  // die Verifizierung ist informativ, nicht blockierend (siehe Banner im Frontend).
  try {
    await sendVerificationEmail(env, request, { id, email });
  } catch (err) {
    console.error("E-Mail-Verifizierung bei Registrierung fehlgeschlagen", err);
  }

  const token = await createSession(env, id);
  return jsonResponse(
    { token, user: publicUser({ id, email, plan: "free", credits: 0, checks_used_period: 0, plan_renews_at: null, email_verified_at: null }) },
    200,
    cors
  );
}

async function handleLogin(request, env, cors) {
  const dbErr = requireDb(env, cors);
  if (dbErr) return dbErr;

  const body = await safeJson(request);
  const email = normalizeEmail(body.email);
  const password = typeof body.password === "string" ? body.password : "";

  const user = await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(email).first();
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return jsonResponse({ error: "E-Mail oder Passwort falsch." }, 401, cors);
  }

  const token = await createSession(env, user.id);
  return jsonResponse({ token, user: publicUser(user) }, 200, cors);
}

async function handleLogout(request, env, cors) {
  const dbErr = requireDb(env, cors);
  if (dbErr) return dbErr;

  const auth = request.headers.get("Authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (token) await env.DB.prepare("DELETE FROM sessions WHERE token = ?").bind(token).run();
  return jsonResponse({ ok: true }, 200, cors);
}

async function handleMe(request, env, cors) {
  const dbErr = requireDb(env, cors);
  if (dbErr) return dbErr;

  const user = await getUserFromRequest(request, env);
  if (!user) return jsonResponse({ error: "Nicht eingeloggt." }, 401, cors);
  return jsonResponse({ user: publicUser(user) }, 200, cors);
}

// DSGVO Art. 17 (Recht auf Loeschung): Konto samt aller zugehoerigen Daten unwiderruflich
// entfernen. Ein evtl. aktives Stripe-Abo wird zuerst gekuendigt, damit niemand nach dem
// Loeschen des Kontos weiter belastet wird, ohne noch Zugriff zu haben.
async function handleDeleteAccount(request, env, cors) {
  const dbErr = requireDb(env, cors);
  if (dbErr) return dbErr;

  const user = await getUserFromRequest(request, env);
  if (!user) return jsonResponse({ error: "Bitte zuerst einloggen." }, 401, cors);

  if (user.stripe_subscription_id && env.STRIPE_SECRET_KEY) {
    try {
      await fetch("https://api.stripe.com/v1/subscriptions/" + user.stripe_subscription_id, {
        method: "DELETE",
        headers: { Authorization: "Bearer " + env.STRIPE_SECRET_KEY },
      });
    } catch (err) {
      console.error("Konto-Loeschung: Stripe-Abo konnte nicht gekuendigt werden", err);
    }
  }

  await env.DB.prepare("DELETE FROM sessions WHERE user_id = ?").bind(user.id).run();
  await env.DB.prepare("DELETE FROM password_resets WHERE user_id = ?").bind(user.id).run();
  await env.DB.prepare("DELETE FROM email_verifications WHERE user_id = ?").bind(user.id).run();
  await env.DB.prepare("DELETE FROM ratings WHERE user_id = ?").bind(user.id).run();
  await env.DB.prepare("DELETE FROM checks WHERE user_id = ?").bind(user.id).run();
  await env.DB.prepare("DELETE FROM users WHERE id = ?").bind(user.id).run();

  return jsonResponse({ ok: true }, 200, cors);
}

const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000; // 1 Stunde

async function handleRequestPasswordReset(request, env, cors) {
  const dbErr = requireDb(env, cors);
  if (dbErr) return dbErr;

  const body = await safeJson(request);
  const email = normalizeEmail(body.email);
  if (!isValidEmail(email)) return jsonResponse({ error: "Ungueltige E-Mail-Adresse." }, 400, cors);

  // Bewusst immer dieselbe Antwort, egal ob die E-Mail existiert - sonst liesse sich damit
  // durchprobieren, welche E-Mails bei Overhertz registriert sind (User-Enumeration).
  const genericMsg = { ok: true, message: "Falls ein Konto mit dieser E-Mail existiert, wurde ein Link zum Zuruecksetzen verschickt." };

  const user = await env.DB.prepare("SELECT id, email FROM users WHERE email = ?").bind(email).first();
  if (user) {
    const token = toHex(crypto.getRandomValues(new Uint8Array(32)));
    const now = Date.now();
    await env.DB.prepare("INSERT INTO password_resets (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)")
      .bind(token, user.id, now, now + PASSWORD_RESET_TTL_MS)
      .run();

    const origin = ALLOWED_ORIGINS.has(request.headers.get("Origin") || "")
      ? request.headers.get("Origin")
      : [...ALLOWED_ORIGINS][0];
    const resetUrl = origin + "/index.html?reset=" + token;

    const sent = await sendEmail(env, {
      to: user.email,
      subject: "Overhertz - Passwort zuruecksetzen",
      text:
        "Hallo,\n\nhier ist dein Link zum Zuruecksetzen deines Overhertz-Passworts (1 Stunde gueltig):\n" +
        resetUrl +
        "\n\nHast du das nicht angefordert, kannst du diese E-Mail ignorieren.",
      html: buildEmailHtml(
        '<p style="margin:0 0 16px; font-size:16px; line-height:1.6;">Hallo,</p>' +
          '<p style="margin:0 0 24px; font-size:16px; line-height:1.6;">hier ist dein Link zum Zurücksetzen deines Overhertz-Passworts. Der Link ist 1 Stunde gültig.</p>' +
          emailButtonHtml(resetUrl, "Passwort zurücksetzen") +
          '<p style="margin:0 0 8px; font-size:13px; line-height:1.5; color:#7d7869;">Falls der Button nicht funktioniert, kopiere diesen Link in deinen Browser:</p>' +
          '<p style="margin:0 0 24px; font-size:13px; line-height:1.5; word-break:break-all;"><a href="' +
          resetUrl +
          '" style="color:#8a6a35;">' +
          resetUrl +
          "</a></p>" +
          '<p style="margin:0; font-size:13px; line-height:1.5; color:#9a9484;">Hast du das nicht angefordert, kannst du diese E-Mail ignorieren.</p>'
      ),
    });
    if (!sent) {
      console.error("Passwort-Reset: E-Mail-Versand fehlgeschlagen oder RESEND_API_KEY/RESEND_FROM_EMAIL nicht gesetzt.");
    }
  }

  return jsonResponse(genericMsg, 200, cors);
}

async function handleResetPassword(request, env, cors) {
  const dbErr = requireDb(env, cors);
  if (dbErr) return dbErr;

  const body = await safeJson(request);
  const token = typeof body.token === "string" ? body.token.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!token) return jsonResponse({ error: "Reset-Link ist ungueltig." }, 400, cors);
  if (password.length < 8) return jsonResponse({ error: "Passwort muss mindestens 8 Zeichen haben." }, 400, cors);

  const reset = await env.DB.prepare("SELECT user_id, expires_at FROM password_resets WHERE token = ?").bind(token).first();
  if (!reset || reset.expires_at <= Date.now()) {
    return jsonResponse({ error: "Reset-Link ist ungueltig oder abgelaufen." }, 400, cors);
  }

  const passwordHash = await hashPassword(password);
  await env.DB.prepare("UPDATE users SET password_hash = ? WHERE id = ?").bind(passwordHash, reset.user_id).run();
  await env.DB.prepare("DELETE FROM password_resets WHERE token = ?").bind(token).run();
  // Alle bestehenden Sessions invalidieren - nach einem Passwort-Reset soll man sich ueberall neu
  // einloggen muessen (falls das alte Passwort z.B. wegen eines geklauten Geraets kompromittiert war).
  await env.DB.prepare("DELETE FROM sessions WHERE user_id = ?").bind(reset.user_id).run();

  const user = await env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(reset.user_id).first();
  const newToken = await createSession(env, reset.user_id);
  return jsonResponse({ token: newToken, user: publicUser(user) }, 200, cors);
}

// Braucht bewusst KEIN Login - der Link wird per Mail geklickt, moeglicherweise auf einem anderen
// Geraet/Browser ohne bestehende Session. Der Verifizierungsstand liegt serverseitig am Konto, ein
// spaeteres /auth/me (z.B. nach einem Login) zeigt ihn dann korrekt an.
async function handleVerifyEmail(request, env, cors) {
  const dbErr = requireDb(env, cors);
  if (dbErr) return dbErr;

  const body = await safeJson(request);
  const token = typeof body.token === "string" ? body.token.trim() : "";
  if (!token) return jsonResponse({ error: "Bestaetigungslink ist ungueltig." }, 400, cors);

  const verification = await env.DB.prepare("SELECT user_id, expires_at FROM email_verifications WHERE token = ?").bind(token).first();
  if (!verification || verification.expires_at <= Date.now()) {
    return jsonResponse({ error: "Bestaetigungslink ist ungueltig oder abgelaufen." }, 400, cors);
  }

  await env.DB.prepare("UPDATE users SET email_verified_at = ? WHERE id = ?").bind(Date.now(), verification.user_id).run();
  await env.DB.prepare("DELETE FROM email_verifications WHERE user_id = ?").bind(verification.user_id).run();

  return jsonResponse({ ok: true }, 200, cors);
}

async function handleResendVerification(request, env, cors) {
  const dbErr = requireDb(env, cors);
  if (dbErr) return dbErr;

  const user = await getUserFromRequest(request, env);
  if (!user) return jsonResponse({ error: "Bitte zuerst einloggen." }, 401, cors);
  if (user.email_verified_at) return jsonResponse({ ok: true, alreadyVerified: true }, 200, cors);

  const sent = await sendVerificationEmail(env, request, user);
  if (!sent) return jsonResponse({ error: "Mail konnte nicht verschickt werden. Bitte spaeter erneut versuchen." }, 502, cors);
  return jsonResponse({ ok: true }, 200, cors);
}

async function handleConsumeCredit(request, env, cors) {
  const dbErr = requireDb(env, cors);
  if (dbErr) return dbErr;

  const user = await getUserFromRequest(request, env);
  if (!user) return jsonResponse({ error: "Bitte zuerst einloggen." }, 401, cors);
  if (!user.email_verified_at) {
    return jsonResponse(
      { error: "Bitte bestaetige zuerst deine E-Mail-Adresse, bevor du die Tiefenanalyse nutzt.", needsVerification: true },
      403,
      cors
    );
  }

  if ((user.plan === "pro" || user.plan === "pro_annual") && user.checks_used_period < PRO_MONTHLY_QUOTA) {
    const checkId = crypto.randomUUID();
    await env.DB.prepare("UPDATE users SET checks_used_period = checks_used_period + 1 WHERE id = ?").bind(user.id).run();
    await env.DB.prepare("INSERT INTO checks (id, user_id, created_at) VALUES (?, ?, ?)")
      .bind(checkId, user.id, Date.now())
      .run();
    return jsonResponse(
      { ok: true, plan: user.plan, credits: user.credits, quotaLeft: PRO_MONTHLY_QUOTA - user.checks_used_period - 1, checkId },
      200,
      cors
    );
  }

  if (user.credits > 0) {
    const checkId = crypto.randomUUID();
    await env.DB.prepare("UPDATE users SET credits = credits - 1 WHERE id = ?").bind(user.id).run();
    await env.DB.prepare("INSERT INTO checks (id, user_id, created_at) VALUES (?, ?, ?)")
      .bind(checkId, user.id, Date.now())
      .run();
    return jsonResponse({ ok: true, plan: user.plan, credits: user.credits - 1, quotaLeft: null, checkId }, 200, cors);
  }

  return jsonResponse({ ok: false, error: "Keine Credits mehr uebrig und kein aktives Pro-Abo." }, 402, cors);
}

async function handleSubmitRating(request, env, cors) {
  const dbErr = requireDb(env, cors);
  if (dbErr) return dbErr;

  const user = await getUserFromRequest(request, env);
  if (!user) return jsonResponse({ error: "Bitte zuerst einloggen." }, 401, cors);

  const body = await safeJson(request);
  const stars = Number.isInteger(body.stars) ? body.stars : -1;
  if (stars < 1 || stars > 5) return jsonResponse({ error: "Bewertung muss zwischen 1 und 5 Sternen liegen." }, 400, cors);
  const comment = typeof body.comment === "string" ? body.comment.trim().slice(0, 1000) : "";

  await env.DB.prepare("INSERT INTO ratings (id, user_id, stars, comment, created_at) VALUES (?, ?, ?, ?, ?)")
    .bind(crypto.randomUUID(), user.id, stars, comment || null, Date.now())
    .run();

  return jsonResponse({ ok: true }, 200, cors);
}

/* ---------- Ergebnis-Verlauf ("Meine Checks") ----------
   Speichert nur die fertigen Analyseergebnisse (Titel, Tipps, Fazit, ...) kontogebunden - nie
   die Audiodatei selbst, die verlaesst weiterhin nie das Geraet des Nutzers. */

async function handleSaveCheckResult(request, env, cors) {
  const dbErr = requireDb(env, cors);
  if (dbErr) return dbErr;

  const user = await getUserFromRequest(request, env);
  if (!user) return jsonResponse({ error: "Bitte zuerst einloggen." }, 401, cors);

  const body = await safeJson(request);
  const checkId = typeof body.checkId === "string" ? body.checkId : "";
  if (!checkId) return jsonResponse({ error: "checkId fehlt." }, 400, cors);

  const owned = await env.DB.prepare("SELECT id FROM checks WHERE id = ? AND user_id = ?").bind(checkId, user.id).first();
  if (!owned) return jsonResponse({ error: "Check nicht gefunden." }, 404, cors);

  const title = typeof body.title === "string" ? body.title.slice(0, 200) : "";
  const genre = typeof body.genre === "string" ? body.genre.slice(0, 60) : "";
  const overallScore = Number.isFinite(body.overallScore) ? Math.round(body.overallScore) : null;
  const classification = typeof body.classification === "string" ? body.classification.slice(0, 2000) : "";
  const titleIdeas = Array.isArray(body.titleIdeas) ? JSON.stringify(body.titleIdeas.slice(0, 10).map((s) => String(s).slice(0, 200))) : null;
  const improvedLyrics = typeof body.improvedLyrics === "string" ? body.improvedLyrics.slice(0, 6000) : "";
  const tips = Array.isArray(body.tips) ? JSON.stringify(body.tips.slice(0, 20).map((s) => String(s).slice(0, 500))) : null;
  const fazit = typeof body.fazit === "string" ? body.fazit.slice(0, 2000) : "";
  const nextPrompt = typeof body.nextPrompt === "string" ? body.nextPrompt.slice(0, 500) : "";

  await env.DB.prepare(
    "UPDATE checks SET title = ?, genre = ?, overall_score = ?, classification = ?, title_ideas = ?, improved_lyrics = ?, tips = ?, fazit = ?, next_prompt = ? WHERE id = ?"
  )
    .bind(title || null, genre || null, overallScore, classification || null, titleIdeas, improvedLyrics || null, tips, fazit || null, nextPrompt || null, checkId)
    .run();

  return jsonResponse({ ok: true }, 200, cors);
}

async function handleMyChecks(request, env, cors) {
  const dbErr = requireDb(env, cors);
  if (dbErr) return dbErr;

  const user = await getUserFromRequest(request, env);
  if (!user) return jsonResponse({ error: "Bitte zuerst einloggen." }, 401, cors);

  const { results } = await env.DB.prepare(
    "SELECT id, title, genre, overall_score, created_at FROM checks WHERE user_id = ? AND title IS NOT NULL ORDER BY created_at DESC LIMIT 50"
  )
    .bind(user.id)
    .all();

  return jsonResponse(
    {
      checks: results.map((r) => ({
        id: r.id,
        title: r.title,
        genre: r.genre,
        overallScore: r.overall_score,
        createdAt: r.created_at,
      })),
    },
    200,
    cors
  );
}

async function handleCheckDetail(request, env, cors, checkId) {
  const dbErr = requireDb(env, cors);
  if (dbErr) return dbErr;

  const user = await getUserFromRequest(request, env);
  if (!user) return jsonResponse({ error: "Bitte zuerst einloggen." }, 401, cors);
  if (!checkId) return jsonResponse({ error: "checkId fehlt." }, 400, cors);

  const row = await env.DB.prepare(
    "SELECT id, title, genre, overall_score, classification, title_ideas, improved_lyrics, tips, fazit, next_prompt, created_at FROM checks WHERE id = ? AND user_id = ?"
  )
    .bind(checkId, user.id)
    .first();
  if (!row || !row.title) return jsonResponse({ error: "Check nicht gefunden." }, 404, cors);

  return jsonResponse(
    {
      id: row.id,
      title: row.title,
      genre: row.genre,
      overallScore: row.overall_score,
      classification: row.classification,
      titleIdeas: row.title_ideas ? JSON.parse(row.title_ideas) : [],
      improvedLyrics: row.improved_lyrics,
      tips: row.tips ? JSON.parse(row.tips) : [],
      fazit: row.fazit,
      nextPrompt: row.next_prompt,
      createdAt: row.created_at,
    },
    200,
    cors
  );
}

/* ---------- Anonyme Rohmesswerte fuer Genre-Statistik-Seiten ----------
   Oeffentlicher, nicht authentifizierter Endpunkt (bewusst anonym: keine user_id, kein
   Songtitel, keine Audiodatei) - nimmt nach jedem Check die reinen Messwerte entgegen und
   schreibt sie in check_results. Wird sowohl vom Frontend (nach jeder Analyse, best-effort,
   blockiert die UI nicht) als auch vom CLI-Backfill-Skript (mit isSeed=true) aufgerufen - beide
   nutzen denselben Endpunkt, damit es nur einen Schreibpfad/eine Wahrheit gibt. */

function numOrNull(v, min, max) {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  if (min !== undefined && n < min) return null;
  if (max !== undefined && n > max) return null;
  return n;
}

function isValidGenreSlug(slug) {
  return typeof slug === "string" && /^[a-z0-9-]{1,40}$/.test(slug);
}

async function handleTrackMetrics(request, env, cors) {
  const dbErr = requireDb(env, cors);
  if (dbErr) return dbErr;

  const body = await safeJson(request);
  const genreSlug = typeof body.genreSlug === "string" ? body.genreSlug.trim().toLowerCase() : "";
  if (!isValidGenreSlug(genreSlug)) {
    return jsonResponse({ error: "Ungueltiger genreSlug." }, 400, cors);
  }

  const m = body.metrics && typeof body.metrics === "object" ? body.metrics : {};
  const bands = Array.isArray(m.bandPercents) ? m.bandPercents : [];

  await env.DB.prepare(
    `INSERT INTO check_results (
      id, genre_slug, created_at, is_seed,
      band_subbass, band_bass, band_lowmid, band_mid, band_highmid, band_presence, band_brilliance,
      loudness_db, true_peak_db, crest_factor_db, phase_correlation,
      intro_silence_ms, outro_ends_abruptly,
      duration_s, sample_rate, bit_depth,
      metadata_violation_count, title_occurrences
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      crypto.randomUUID(),
      genreSlug,
      Date.now(),
      body.isSeed === true ? 1 : 0,
      numOrNull(bands[0], 0, 100),
      numOrNull(bands[1], 0, 100),
      numOrNull(bands[2], 0, 100),
      numOrNull(bands[3], 0, 100),
      numOrNull(bands[4], 0, 100),
      numOrNull(bands[5], 0, 100),
      numOrNull(bands[6], 0, 100),
      numOrNull(m.loudnessDb, -80, 20),
      numOrNull(m.truePeakDb, -80, 20),
      numOrNull(m.crestFactorDb, 0, 60),
      numOrNull(m.phaseCorrelation, -1, 1),
      numOrNull(m.introSilenceMs, 0, 600000),
      m.outroEndsAbruptly === true ? 1 : 0,
      numOrNull(m.duration, 0, 36000),
      numOrNull(m.sampleRate, 1000, 400000),
      Number.isInteger(m.bitDepth) ? m.bitDepth : null,
      numOrNull(m.metadataViolationCount, 0, 50),
      numOrNull(m.titleOccurrences, 0, 1000)
    )
    .run();

  return jsonResponse({ ok: true }, 200, cors);
}

/* ---------- Anonyme Trichter-Ereignisse ----------
   Oeffentlicher, nicht authentifizierter Endpunkt - zaehlt nur, wie oft ein bekanntes Ereignis
   auftritt (Kurzcheck fertig / Vollanalyse angeklickt / Checkout gestartet), OHNE user_id, IP oder
   sonstige Kennung. Zweck: sehen, wo im Trichter Besucher abspringen, um z.B. Preisfragen von
   Trichter-Problemen unterscheiden zu koennen - siehe schema.sql fuer eine Auswerte-Abfrage. */

const FUNNEL_EVENT_NAMES = new Set(["kurzcheck_completed", "unlock_clicked", "checkout_started"]);

async function handleTrackFunnel(request, env, cors) {
  const dbErr = requireDb(env, cors);
  if (dbErr) return dbErr;

  const body = await safeJson(request);
  const eventName = typeof body.event === "string" ? body.event : "";
  if (!FUNNEL_EVENT_NAMES.has(eventName)) {
    return jsonResponse({ error: "Ungueltiges Ereignis." }, 400, cors);
  }

  await env.DB.prepare("INSERT INTO funnel_events (id, event_name, created_at) VALUES (?, ?, ?)")
    .bind(crypto.randomUUID(), eventName, Date.now())
    .run();

  return jsonResponse({ ok: true }, 200, cors);
}

/* ---------- Genre-Kennzahlen-Aggregation ----------
   Trennt Sammeln von Auswerten: check_results wird nur beschrieben, nie live bei einem
   Seitenaufruf ausgewertet. Diese Funktion liest die Rohwerte, berechnet Median/Perzentile und
   einen Anteil "auffälliger" Tracks je Kategorie, und schreibt das Ergebnis in genre_stats -
   die Genre-Seiten lesen nur von dort. Laeuft nachts per Cron Trigger (siehe scheduled-Handler
   unten) und laesst sich zusaetzlich manuell ueber POST /admin/aggregate-genres anstossen.

   Die "auffaellig"-Kategorien sind bewusst genre-unabhaengig formuliert (z.B. Crest-Faktor unter
   6 dB, nicht "unter dem genre-typischen Zielwert") - die genre-spezifischen Zielwerte
   (GENRE_PROFILES) leben nur im Frontend (website/app.js), der Worker hat keinen Zugriff darauf
   und soll sie auch nicht duplizieren muessen, wenn sich dort mal was aendert. */

const GENRE_PROBLEM_DEFS = [
  { key: "overcompressed", check: (r) => r.crest_factor_db != null && r.crest_factor_db < 6, labelDe: "Stark überkomprimiert (Crest-Faktor unter 6 dB)", labelEn: "Heavily over-compressed (crest factor under 6 dB)" },
  { key: "monoIssue", check: (r) => r.phase_correlation != null && r.phase_correlation < 0.3, labelDe: "Eingeschränkte Mono-Kompatibilität", labelEn: "Limited mono compatibility" },
  { key: "tooShort", check: (r) => r.duration_s != null && r.duration_s < 30, labelDe: "Unter 30 Sekunden (zählt laut Spotify nicht als Stream)", labelEn: "Under 30 seconds (doesn't count as a Spotify stream)" },
  { key: "lowBitDepth", check: (r) => r.bit_depth != null && r.bit_depth < 16, labelDe: "Niedrige Bittiefe", labelEn: "Low bit depth" },
  { key: "metadataIssues", check: (r) => r.metadata_violation_count != null && r.metadata_violation_count > 0, labelDe: "Titel-Metadaten-Auffälligkeiten (ALL CAPS, Emojis, „feat.“-Format)", labelEn: "Title metadata issues (ALL CAPS, emojis, \"feat.\" format)" },
  { key: "truePeakHigh", check: (r) => r.true_peak_db != null && r.true_peak_db > -1, labelDe: "True Peak über -1 dBTP (Clipping-Risiko bei Lossy-Encoding)", labelEn: "True peak above -1 dBTP (clipping risk on lossy encoding)" },
];

function percentile(sortedArr, p) {
  if (sortedArr.length === 0) return null;
  const idx = (p / 100) * (sortedArr.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sortedArr[lo];
  return sortedArr[lo] + (sortedArr[hi] - sortedArr[lo]) * (idx - lo);
}

function statFor(rows, field) {
  const vals = rows.map((r) => r[field]).filter((v) => v !== null && v !== undefined).sort((a, b) => a - b);
  return { median: percentile(vals, 50), p25: percentile(vals, 25), p75: percentile(vals, 75) };
}

async function aggregateGenreStats(env) {
  const { results: genreRows } = await env.DB.prepare("SELECT DISTINCT genre_slug FROM check_results").all();
  const now = Date.now();
  const summary = [];

  for (const { genre_slug } of genreRows) {
    const { results: rows } = await env.DB.prepare("SELECT * FROM check_results WHERE genre_slug = ?").bind(genre_slug).all();
    const trackCount = rows.length;

    const problems = GENRE_PROBLEM_DEFS.map((def) => {
      const count = rows.filter(def.check).length;
      return { key: def.key, labelDe: def.labelDe, labelEn: def.labelEn, pct: trackCount ? Math.round((count / trackCount) * 100) : 0 };
    }).sort((a, b) => b.pct - a.pct);

    const statsJson = {
      bands: {
        subbass: statFor(rows, "band_subbass"),
        bass: statFor(rows, "band_bass"),
        lowmid: statFor(rows, "band_lowmid"),
        mid: statFor(rows, "band_mid"),
        highmid: statFor(rows, "band_highmid"),
        presence: statFor(rows, "band_presence"),
        brilliance: statFor(rows, "band_brilliance"),
      },
      loudnessDb: statFor(rows, "loudness_db"),
      truePeakDb: statFor(rows, "true_peak_db"),
      crestFactorDb: statFor(rows, "crest_factor_db"),
      phaseCorrelation: statFor(rows, "phase_correlation"),
      durationS: statFor(rows, "duration_s"),
      problems,
      topProblem: problems.length ? problems[0] : null,
    };

    await env.DB.prepare(
      `INSERT INTO genre_stats (genre_slug, updated_at, track_count, stats_json) VALUES (?, ?, ?, ?)
       ON CONFLICT(genre_slug) DO UPDATE SET updated_at = excluded.updated_at, track_count = excluded.track_count, stats_json = excluded.stats_json`
    )
      .bind(genre_slug, now, trackCount, JSON.stringify(statsJson))
      .run();

    summary.push({ genreSlug: genre_slug, trackCount });
  }

  return { genres: summary };
}

async function handleAggregateGenres(request, env, cors) {
  const dbErr = requireDb(env, cors);
  if (dbErr) return dbErr;
  if (!env.ADMIN_SECRET || request.headers.get("x-admin-secret") !== env.ADMIN_SECRET) {
    return jsonResponse({ error: "Nicht autorisiert." }, 401, cors);
  }
  const result = await aggregateGenreStats(env);
  return jsonResponse({ ok: true, ...result }, 200, cors);
}

// Manuelles Freischalten fuer Kooperationen/Tester (z.B. Creator, die im Austausch fuer Feedback
// einen Pro-Zugang bekommen) - ohne echten Stripe-Kauf, ohne stripe_subscription_id. Deswegen
// laeuft das nicht automatisch ab: plan_renews_at ist hier rein informativ fuer die Konto-Anzeige,
// nichts widerruft die Freischaltung von selbst. Zum Zuruecknehmen denselben Aufruf nochmal mit
// plan: "free" machen. Person muss vorher schon ein normales (kostenloses) Konto angelegt haben.
async function handleAdminGrantPlan(request, env, cors) {
  const dbErr = requireDb(env, cors);
  if (dbErr) return dbErr;
  if (!env.ADMIN_SECRET || request.headers.get("x-admin-secret") !== env.ADMIN_SECRET) {
    return jsonResponse({ error: "Nicht autorisiert." }, 401, cors);
  }
  const body = await safeJson(request);
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const plan = typeof body.plan === "string" ? body.plan : "";
  if (!email || !["pro", "pro_annual", "credits", "free"].includes(plan)) {
    return jsonResponse({ error: "email und plan (pro|pro_annual|credits|free) erforderlich." }, 400, cors);
  }

  const user = await env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(email).first();
  if (!user) {
    return jsonResponse({ error: "Kein Konto mit dieser E-Mail gefunden - Person muss sich erst selbst registrieren." }, 404, cors);
  }

  if (plan === "credits") {
    const amount = Number.isFinite(body.amount) && body.amount > 0 ? Math.floor(body.amount) : 5;
    await env.DB.prepare("UPDATE users SET credits = credits + ? WHERE id = ?").bind(amount, user.id).run();
    return jsonResponse({ ok: true, granted: "credits", amount }, 200, cors);
  }

  if (plan === "free") {
    await env.DB.prepare("UPDATE users SET plan = 'free', plan_renews_at = NULL WHERE id = ?").bind(user.id).run();
    return jsonResponse({ ok: true, granted: "free" }, 200, cors);
  }

  const days = Number.isFinite(body.days) && body.days > 0 ? Math.floor(body.days) : 30;
  const renewsAt = Date.now() + days * 24 * 60 * 60 * 1000;
  await env.DB.prepare("UPDATE users SET plan = ?, checks_used_period = 0, plan_renews_at = ? WHERE id = ?")
    .bind(plan, renewsAt, user.id)
    .run();
  return jsonResponse({ ok: true, granted: plan, renewsAt }, 200, cors);
}

/* ---------- Genre-Statistik-Seiten (/check/:slug) ----------
   Server-seitig gerendert direkt aus genre_stats - kein Build-Step noetig, passt zur bestehenden
   "Website ist statisches HTML ohne Build-Pipeline"-Architektur. Neues Genre = neuer Eintrag in
   GENRE_PAGE_DEFS, sonst nichts. Erscheint erst ab MIN_TRACKS_FOR_PAGE Tracks (siehe
   aggregateGenreStats) - darunter bewusst 404 statt einer duennen/leeren Seite. */

const MIN_TRACKS_FOR_PAGE = 30;

const GENRE_PAGE_DEFS = {
  deutschrap: { labelDe: "Deutschrap", labelEn: "German Rap", related: ["hiphop", "trap", "rnb"] },
  hiphop: { labelDe: "Hip-Hop", labelEn: "Hip-Hop", related: ["deutschrap", "trap", "rnb"] },
  trap: { labelDe: "Trap", labelEn: "Trap", related: ["hiphop", "drill", "phonk"] },
  drill: { labelDe: "Drill", labelEn: "Drill", related: ["trap", "hiphop", "deutschrap"] },
  rnb: { labelDe: "R&B", labelEn: "R&B", related: ["hiphop", "pop", "deutschrap"] },
  techno: { labelDe: "Techno", labelEn: "Techno", related: ["house", "phonk", "pop"] },
  house: { labelDe: "House", labelEn: "House", related: ["techno", "phonk", "pop"] },
  phonk: { labelDe: "Phonk", labelEn: "Phonk", related: ["trap", "house", "techno"] },
  country: { labelDe: "Country", labelEn: "Country", related: ["rock", "pop", "rnb"] },
  pop: { labelDe: "Pop", labelEn: "Pop", related: ["rnb", "rock", "country"] },
  rock: { labelDe: "Rock", labelEn: "Rock", related: ["country", "pop", "rnb"] },
};

const BAND_LABELS = {
  subbass: { de: "Sub-Bass", en: "Sub-bass" },
  bass: { de: "Bass", en: "Bass" },
  lowmid: { de: "Low-Mid", en: "Low-mid" },
  mid: { de: "Mid", en: "Mid" },
  highmid: { de: "High-Mid", en: "High-mid" },
  presence: { de: "Presence", en: "Presence" },
  brilliance: { de: "Brillanz", en: "Air" },
};

function escapeHtmlWorker(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function fmt1(v) {
  return v === null || v === undefined ? "–" : v.toFixed(1);
}

function genrePageHtml(slug, def, stats, trackCount, lang) {
  const isDe = lang !== "en";
  const label = isDe ? def.labelDe : def.labelEn;
  const s = stats;

  let dominantBand = null;
  for (const [key, val] of Object.entries(s.bands)) {
    if (val.median !== null && (!dominantBand || val.median > dominantBand[1].median)) dominantBand = [key, val];
  }
  const dominantBandLabel = dominantBand ? (isDe ? BAND_LABELS[dominantBand[0]].de : BAND_LABELS[dominantBand[0]].en) : "";

  const intro = isDe
    ? `Bei den bisher ${trackCount} auf Overhertz geprüften ${label}-Tracks zeigt sich ein klares Muster.`
    : `Across the ${trackCount} ${label} tracks checked on Overhertz so far, a clear pattern emerges.`;

  const loudnessText = isDe
    ? `Die gemessene Lautheit liegt im Median bei ${fmt1(s.loudnessDb.median)} dB, die mittleren 50% der Tracks bewegen sich zwischen ${fmt1(s.loudnessDb.p25)} und ${fmt1(s.loudnessDb.p75)} dB.`
    : `Measured loudness sits at a median of ${fmt1(s.loudnessDb.median)} dB, with the middle 50% of tracks falling between ${fmt1(s.loudnessDb.p25)} and ${fmt1(s.loudnessDb.p75)} dB.`;

  const dynamicsText = isDe
    ? `Der Dynamikumfang (Crest-Faktor) liegt im Median bei ${fmt1(s.crestFactorDb.median)} dB.`
    : `Dynamic range (crest factor) has a median of ${fmt1(s.crestFactorDb.median)} dB.`;

  const bandText = dominantBand
    ? isDe
      ? `Frequenzmäßig dominiert im Schnitt der ${dominantBandLabel}-Bereich mit ${fmt1(dominantBand[1].median)}% Energieanteil.`
      : `In terms of frequency balance, the ${dominantBandLabel} range dominates on average with ${fmt1(dominantBand[1].median)}% of the energy.`
    : "";

  const monoText = isDe
    ? `Die Phasenkorrelation (Mono-Kompatibilität) liegt im Median bei ${fmt1(s.phaseCorrelation.median)} – Werte nahe +1 bedeuten, der Track bleibt auch auf Handylautsprechern/in Mono-Playern voll hörbar.`
    : `Phase correlation (mono compatibility) has a median of ${fmt1(s.phaseCorrelation.median)} – values near +1 mean the track stays fully audible on phone speakers/mono players.`;

  const problemsHtml = s.problems
    .filter((p) => p.pct > 0)
    .slice(0, 5)
    .map((p) => `<li><strong>${p.pct}%</strong> ${escapeHtmlWorker(isDe ? p.labelDe : p.labelEn)}</li>`)
    .join("");

  const relatedHtml = def.related
    .map((relSlug) => {
      const relDef = GENRE_PAGE_DEFS[relSlug];
      if (!relDef) return "";
      const relLabel = isDe ? relDef.labelDe : relDef.labelEn;
      return `<a href="/check/${relSlug}${isDe ? "" : "?lang=en"}">${escapeHtmlWorker(relLabel)}</a>`;
    })
    .filter(Boolean)
    .join(" · ");

  const pageTitle = isDe
    ? `${label}-Frequenzcheck: Typische Werte & Probleme | Overhertz`
    : `${label} Frequency Check: Typical Values & Issues | Overhertz`;
  const metaDescription = isDe
    ? `Was ${trackCount} geprüfte ${label}-Tracks über Lautheit, Frequenzbalance und typische Probleme verraten – kostenloser KI-Songcheck bei Overhertz.`
    : `What ${trackCount} checked ${label} tracks reveal about loudness, frequency balance, and common issues – free AI song check by Overhertz.`;
  const canonical = `https://overhertz.app/check/${slug}${isDe ? "" : "?lang=en"}`;
  const ctaHtml = isDe
    ? `<a href="/index.html" class="cta-btn">Kostenlosen Check für deinen Track starten</a>`
    : `<a href="/index.html?lang=en" class="cta-btn">Start a free check for your track</a>`;

  return `<!doctype html>
<html lang="${isDe ? "de" : "en"}">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escapeHtmlWorker(pageTitle)}</title>
<meta name="description" content="${escapeHtmlWorker(metaDescription)}" />
<link rel="canonical" href="${canonical}" />
<meta property="og:type" content="website" />
<meta property="og:url" content="${canonical}" />
<meta property="og:site_name" content="Overhertz" />
<meta property="og:title" content="${escapeHtmlWorker(pageTitle)}" />
<meta property="og:description" content="${escapeHtmlWorker(metaDescription)}" />
<meta property="og:image" content="https://overhertz.app/og-image.png" />
<meta name="twitter:card" content="summary_large_image" />
<link rel="stylesheet" href="https://overhertz.app/style.css" />
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
<style>
  body { max-width: 720px; margin: 0 auto; padding: 3rem 1.25rem 4rem; }
  .genre-page h1 { font-family: var(--font-display); font-size: 2rem; margin-bottom: 0.4rem; }
  .genre-page .lede { color: var(--text-secondary); margin-bottom: 2rem; }
  .genre-page h2 { font-family: var(--font-display); font-size: 1.3rem; margin-top: 2.2rem; }
  .genre-page ul { padding-left: 1.2rem; }
  .genre-page .related a { color: var(--gold); text-decoration: none; }
  .genre-page .cta-btn { display: inline-block; margin-top: 1.5rem; padding: 0.9rem 1.75rem; border-radius: 999px; background: linear-gradient(180deg, var(--gold-bright), var(--gold)); color: #241d10; font-weight: 700; text-decoration: none; }
</style>
</head>
<body class="genre-page">
  <p><a href="/index.html${isDe ? "" : "?lang=en"}">← Overhertz</a></p>
  <h1>${escapeHtmlWorker(isDe ? `${label}: Typische Werte & Probleme` : `${label}: Typical Values & Issues`)}</h1>
  <p class="lede">${escapeHtmlWorker(intro)}</p>

  <h2>${isDe ? "Die Zahlen" : "The numbers"}</h2>
  <p>${escapeHtmlWorker(loudnessText)} ${escapeHtmlWorker(dynamicsText)} ${escapeHtmlWorker(bandText)} ${escapeHtmlWorker(monoText)}</p>

  <h2>${isDe ? "Häufigste Probleme in diesem Genre" : "Most common issues in this genre"}</h2>
  <ul>${problemsHtml || `<li>${isDe ? "Keine auffälligen Muster gefunden." : "No notable patterns found."}</li>`}</ul>

  <h2>${isDe ? "Wie steht dein Track da?" : "How does your track compare?"}</h2>
  <p>${isDe ? "Overhertz prüft Lautheit, Frequenzbalance, Mono-Kompatibilität und mehr in Sekunden – kostenlos, ohne Konto." : "Overhertz checks loudness, frequency balance, mono compatibility and more in seconds – free, no account needed."}</p>
  ${ctaHtml}

  <h2>${isDe ? "Verwandte Genres" : "Related genres"}</h2>
  <p class="related">${relatedHtml}</p>
</body>
</html>`;
}

async function handleGenrePage(request, env, slug) {
  const url = new URL(request.url);
  const lang = url.searchParams.get("lang") === "en" ? "en" : "de";
  const def = GENRE_PAGE_DEFS[slug];
  if (!def) return new Response("Not found", { status: 404 });
  if (!env.DB) return new Response("Service unavailable", { status: 503 });

  const row = await env.DB.prepare("SELECT track_count, stats_json FROM genre_stats WHERE genre_slug = ?").bind(slug).first();
  if (!row || row.track_count < MIN_TRACKS_FOR_PAGE) {
    return new Response("Not found", { status: 404 });
  }

  const stats = JSON.parse(row.stats_json);
  const html = genrePageHtml(slug, def, stats, row.track_count, lang);
  return new Response(html, { status: 200, headers: { "content-type": "text/html; charset=utf-8" } });
}

// Fuer den Genre-Vergleich direkt im Check (nicht nur auf den oeffentlichen /check/:slug-Seiten) -
// dieselben genre_stats-Daten, nur als JSON statt als gerenderte Seite. Bewusst ohne
// GENRE_PAGE_DEFS-Einschraenkung: auch Genres ohne eigene Marketing-Seite liefern hier schon einen
// Vergleich, sobald genug Tracks gesammelt sind.
async function handleGenreStatsApi(request, env, cors) {
  const dbErr = requireDb(env, cors);
  if (dbErr) return dbErr;
  const url = new URL(request.url);
  const slug = (url.searchParams.get("slug") || "").trim().toLowerCase();
  if (!slug) return jsonResponse({ trackCount: 0, stats: null }, 200, cors);

  const row = await env.DB.prepare("SELECT track_count, stats_json FROM genre_stats WHERE genre_slug = ?").bind(slug).first();
  if (!row || row.track_count < MIN_TRACKS_FOR_PAGE) {
    return jsonResponse({ trackCount: row ? row.track_count : 0, stats: null }, 200, cors);
  }
  return jsonResponse({ trackCount: row.track_count, stats: JSON.parse(row.stats_json) }, 200, cors);
}

// Nur Genres, die die 30-Tracks-Schwelle bereits erreicht haben, bekommen einen Sitemap-Eintrag -
// kein Eintrag fuer eine Seite, die (noch) 404 zurueckgibt. Referenziert von sitemap.xml (siehe
// website/sitemap.xml, jetzt ein Sitemap-Index statt einer einzelnen urlset-Datei).
async function handleSitemapGenres(env) {
  if (!env.DB) {
    return new Response('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>', {
      status: 200,
      headers: { "content-type": "application/xml; charset=utf-8" },
    });
  }
  const { results } = await env.DB.prepare("SELECT genre_slug, updated_at FROM genre_stats WHERE track_count >= ?").bind(MIN_TRACKS_FOR_PAGE).all();
  const urls = results
    .filter((r) => GENRE_PAGE_DEFS[r.genre_slug])
    .flatMap((r) => {
      const lastmod = new Date(r.updated_at).toISOString().slice(0, 10);
      return [
        `  <url><loc>https://overhertz.app/check/${r.genre_slug}</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>0.6</priority></url>`,
        `  <url><loc>https://overhertz.app/check/${r.genre_slug}?lang=en</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>0.5</priority></url>`,
      ];
    })
    .join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  return new Response(xml, { status: 200, headers: { "content-type": "application/xml; charset=utf-8" } });
}

/* ---------- Stripe: Checkout & Webhook ---------- */

function flattenParams(obj, body, prefix = "") {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}[${k}]` : k;
    if (v === undefined || v === null) continue;
    if (Array.isArray(v)) {
      v.forEach((item, i) => {
        if (item && typeof item === "object") flattenParams(item, body, `${key}[${i}]`);
        else body.append(`${key}[${i}]`, item);
      });
    } else if (typeof v === "object") {
      flattenParams(v, body, key);
    } else {
      body.append(key, v);
    }
  }
}

async function stripeRequest(env, path, params) {
  const body = new URLSearchParams();
  flattenParams(params, body);
  const res = await fetch("https://api.stripe.com/v1/" + path, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + env.STRIPE_SECRET_KEY,
      "content-type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data?.error?.message || "Stripe-Fehler");
    err.stripeError = data?.error || null;
    throw err;
  }
  return data;
}

const PLAN_PRICE_ENV = {
  credits: "STRIPE_PRICE_CREDITS",
  pro: "STRIPE_PRICE_PRO_MONTHLY",
  pro_annual: "STRIPE_PRICE_PRO_ANNUAL",
};

async function handleCreateCheckoutSession(request, env, cors) {
  const dbErr = requireDb(env, cors);
  if (dbErr) return dbErr;
  if (!env.STRIPE_SECRET_KEY) return jsonResponse({ error: "Zahlung ist noch nicht eingerichtet." }, 501, cors);

  const user = await getUserFromRequest(request, env);
  if (!user) return jsonResponse({ error: "Bitte zuerst einloggen." }, 401, cors);

  const body = await safeJson(request);
  const planType = typeof body.plan === "string" ? body.plan : "";
  const priceId = env[PLAN_PRICE_ENV[planType] || ""];
  if (!priceId) return jsonResponse({ error: "Ungueltiger oder noch nicht eingerichteter Plan." }, 400, cors);

  const origin = request.headers.get("Origin") || "";
  const siteOrigin = ALLOWED_ORIGINS.has(origin) ? origin : [...ALLOWED_ORIGINS][0];

  try {
    let customerId = user.stripe_customer_id;
    if (!customerId) {
      const customer = await stripeRequest(env, "customers", { email: user.email, metadata: { user_id: user.id } });
      customerId = customer.id;
      await env.DB.prepare("UPDATE users SET stripe_customer_id = ? WHERE id = ?").bind(customerId, user.id).run();
    }

    const sessionParams = {
      mode: planType === "credits" ? "payment" : "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: siteOrigin + "/?checkout=success",
      cancel_url: siteOrigin + "/?checkout=cancel",
      metadata: { user_id: user.id, plan: planType },
      // Zeigt bei Stripe Checkout ein Feld "Rabattcode hinzufuegen" an - fuer manuell im Stripe-
      // Dashboard erstellte Einmal-Codes (z.B. eigener Testkauf), ohne dass ein serverseitig
      // automatisch angewandter Rabatt (wie die Flash-Sale) noetig ist und ohne dass andere Kunden
      // davon etwas mitbekommen.
      allow_promotion_codes: true,
    };

    // Wer schon mal Credits gekauft hat und jetzt erstmals auf Pro upgraden will, bekommt einen
    // pauschalen Rabatt (Coupon-ID in Stripe hinterlegt, z.B. "einmalig 5 EUR ab") - kein
    // individuelles Verrechnen von Rest-Credits, bewusst simpel gehalten.
    const isFirstProUpgrade = (planType === "pro" || planType === "pro_annual") && !user.stripe_subscription_id;
    if (user.has_bought_credits && isFirstProUpgrade && env.STRIPE_COUPON_CREDITS_UPGRADE) {
      sessionParams.discounts = [{ coupon: env.STRIPE_COUPON_CREDITS_UPGRADE }];
    }

    // Eintages-Rabattaktion auf Credits (13.08.2026, 50%) - bewusst hart einprogrammierter
    // Zeitraum statt eines generischen Rabatt-Systems fuer eine einmalige Aktion. Der eigentliche
    // Preis kommt immer von Stripe (ueber den Coupon), das Frontend zeigt den reduzierten Preis
    // nur zur Info an - siehe applyCreditsFlashSale() in app.js fuer denselben Zeitraum.
    const CREDITS_FLASH_SALE_START = Date.parse("2026-08-13T22:00:00Z"); // 14.08. 00:00 MESZ
    const CREDITS_FLASH_SALE_END = Date.parse("2026-08-14T22:00:00Z"); // 15.08. 00:00 MESZ
    const flashSaleActive = Date.now() >= CREDITS_FLASH_SALE_START && Date.now() < CREDITS_FLASH_SALE_END;
    if (planType === "credits" && flashSaleActive && env.STRIPE_COUPON_FLASH_SALE_CREDITS) {
      sessionParams.discounts = [{ coupon: env.STRIPE_COUPON_FLASH_SALE_CREDITS }];
    }

    // Stripe erlaubt "discounts" und "allow_promotion_codes" nicht gleichzeitig in derselben
    // Checkout Session - falls oben schon ein automatischer Rabatt gesetzt wurde, muss das
    // manuelle Rabattcode-Feld wieder raus.
    if (sessionParams.discounts) delete sessionParams.allow_promotion_codes;

    let session;
    try {
      session = await stripeRequest(env, "checkout/sessions", sessionParams);
    } catch (err) {
      // "resource_missing" auf "customer" heisst: die gespeicherte stripe_customer_id existiert im
      // aktuell aktiven Stripe-Modus nicht (z.B. Test-Kunde uebrig aus der Zeit vor dem Umstieg auf
      // den Live-Key - Kunden-IDs sind zwischen Test und Live nicht kompatibel). Statt den Nutzer mit
      // einem toten Konto haengen zu lassen: einmalig frischen Kunden anlegen und erneut versuchen.
      if (err.stripeError?.code === "resource_missing" && err.stripeError?.param === "customer") {
        const freshCustomer = await stripeRequest(env, "customers", { email: user.email, metadata: { user_id: user.id } });
        customerId = freshCustomer.id;
        await env.DB.prepare("UPDATE users SET stripe_customer_id = ? WHERE id = ?").bind(customerId, user.id).run();
        sessionParams.customer = customerId;
        session = await stripeRequest(env, "checkout/sessions", sessionParams);
      } else {
        throw err;
      }
    }

    return jsonResponse({ url: session.url }, 200, cors);
  } catch (err) {
    console.error("Stripe-Checkout-Fehler", err);
    return jsonResponse({ error: "Zahlung konnte nicht gestartet werden." }, 502, cors);
  }
}

// Stripe Customer Portal: Selbstbedienung fuer Kuendigung/Zahlungsmethode-Update/Rechnungen.
// Deckt die gesetzliche Kuendigungsbutton-Pflicht (§ 312k BGB) ab - Kuendigung ist dort jederzeit
// moeglich, das Abo laeuft bis zum Ende der bezahlten Periode weiter (Stripe-Standardverhalten).
async function handleCreatePortalSession(request, env, cors) {
  const dbErr = requireDb(env, cors);
  if (dbErr) return dbErr;
  if (!env.STRIPE_SECRET_KEY) return jsonResponse({ error: "Zahlung ist noch nicht eingerichtet." }, 501, cors);

  const user = await getUserFromRequest(request, env);
  if (!user) return jsonResponse({ error: "Bitte zuerst einloggen." }, 401, cors);
  if (!user.stripe_customer_id) {
    return jsonResponse({ error: "Noch kein Kauf getaetigt - es gibt noch nichts zu verwalten." }, 400, cors);
  }

  const origin = request.headers.get("Origin") || "";
  const siteOrigin = ALLOWED_ORIGINS.has(origin) ? origin : [...ALLOWED_ORIGINS][0];

  try {
    const session = await stripeRequest(env, "billing_portal/sessions", {
      customer: user.stripe_customer_id,
      return_url: siteOrigin + "/",
    });
    return jsonResponse({ url: session.url }, 200, cors);
  } catch (err) {
    console.error("Stripe-Portal-Fehler", err);
    return jsonResponse({ error: "Konnte nicht geoeffnet werden." }, 502, cors);
  }
}

async function verifyStripeSignature(payload, sigHeader, secret) {
  const parts = {};
  for (const kv of sigHeader.split(",")) {
    const [k, v] = kv.split("=");
    if (k && v) parts[k] = v;
  }
  if (!parts.t || !parts.v1) return false;

  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
  ]);
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${parts.t}.${payload}`));
  const expected = toHex(new Uint8Array(mac));

  if (expected.length !== parts.v1.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ parts.v1.charCodeAt(i);
  return diff === 0;
}

async function handleStripeWebhook(request, env) {
  if (!env.DB) return new Response("Konten-System ist noch nicht eingerichtet.", { status: 501 });
  if (!env.STRIPE_WEBHOOK_SECRET) return new Response("Webhook ist noch nicht eingerichtet.", { status: 501 });

  const sig = request.headers.get("Stripe-Signature") || "";
  const payload = await request.text();
  const valid = await verifyStripeSignature(payload, sig, env.STRIPE_WEBHOOK_SECRET);
  if (!valid) return new Response("Invalid signature", { status: 400 });

  let event;
  try {
    event = JSON.parse(payload);
  } catch {
    return new Response("Invalid payload", { status: 400 });
  }

  // Stripe garantiert nur "mindestens einmal"-Zustellung (Retries bei Timeout/Netzwerkfehlern) -
  // ohne diese Sperre wuerde ein zweites Mal zugestelltes checkout.session.completed Credits/Abo
  // erneut gutschreiben. Der INSERT schlaegt dank PRIMARY KEY fehl, wenn die Event-ID schon
  // verarbeitet wurde, dann hier abbrechen statt die Logik unten nochmal auszufuehren.
  try {
    await env.DB.prepare("INSERT INTO stripe_webhook_events (event_id, processed_at) VALUES (?, ?)")
      .bind(event.id, Date.now())
      .run();
  } catch {
    return new Response("ok (duplicate)", { status: 200 });
  }

  const obj = event.data && event.data.object;

  if (event.type === "checkout.session.completed" && obj) {
    const userId = obj.metadata && obj.metadata.user_id;
    const plan = obj.metadata && obj.metadata.plan;
    if (userId && plan === "credits") {
      await env.DB.prepare(
        "UPDATE users SET credits = credits + 5, has_bought_credits = 1, stripe_customer_id = COALESCE(stripe_customer_id, ?) WHERE id = ?"
      )
        .bind(obj.customer || null, userId)
        .run();
    } else if (userId && (plan === "pro" || plan === "pro_annual")) {
      const days = plan === "pro_annual" ? 365 : 30;
      const renewsAt = Date.now() + days * 24 * 60 * 60 * 1000;
      await env.DB.prepare(
        "UPDATE users SET plan = ?, checks_used_period = 0, plan_renews_at = ?, stripe_customer_id = ?, stripe_subscription_id = ? WHERE id = ?"
      )
        .bind(plan, renewsAt, obj.customer || null, obj.subscription || null, userId)
        .run();
    }
  } else if (event.type === "invoice.paid" && obj && obj.billing_reason === "subscription_cycle" && obj.subscription) {
    const user = await env.DB.prepare("SELECT id, plan FROM users WHERE stripe_subscription_id = ?").bind(obj.subscription).first();
    if (user) {
      const days = user.plan === "pro_annual" ? 365 : 30;
      await env.DB.prepare("UPDATE users SET checks_used_period = 0, plan_renews_at = ? WHERE id = ?")
        .bind(Date.now() + days * 24 * 60 * 60 * 1000, user.id)
        .run();
    }
  } else if (event.type === "customer.subscription.deleted" && obj) {
    await env.DB.prepare("UPDATE users SET plan = 'free', plan_renews_at = NULL, stripe_subscription_id = NULL WHERE stripe_subscription_id = ?")
      .bind(obj.id)
      .run();
  }

  return new Response("ok", { status: 200 });
}

/* ---------- KI-Einschaetzung (Anthropic) ---------- */

async function handleKiEinschaetzung(request, env, cors) {
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Ungueltiger Request-Body." }, 400, cors);
  }

  const title = typeof body.title === "string" ? body.title.slice(0, 200) : "";
  const lyrics = typeof body.lyrics === "string" ? body.lyrics : "";
  const transcript = typeof body.transcript === "string" ? body.transcript.slice(0, 6000) : "";
  const genre = typeof body.genre === "string" ? body.genre.slice(0, 60) : "";
  const metrics = body.metrics && typeof body.metrics === "object" ? body.metrics : {};

  const hasLyrics = lyrics.trim().length >= 10;
  const hasTranscript = transcript.trim().length >= 10;

  if (!hasLyrics && !hasTranscript) {
    return jsonResponse({ error: "Songtext fehlt oder ist zu kurz." }, 400, cors);
  }
  if (lyrics.length > 6000) {
    return jsonResponse({ error: "Songtext ist zu lang (max. 6000 Zeichen)." }, 400, cors);
  }

  // Kein Songtext vom Nutzer, nur ein rohes (fehleranfaelliges) Transkript der Vocals: die KI
  // rekonstruiert zuerst minimal-invasiv den wahrscheinlich gemeinten Text (kein kreatives
  // Umschreiben, nur Transkriptions-Artefakte glaetten), bevor sie darauf aufbauend einordnet/
  // ueberarbeitet - das Frontend zeigt die Rekonstruktion klar als KI-Schaetzung, nicht als Fakt.
  const reconstructMode = !hasLyrics && hasTranscript;
  // Songtext UND Transkript vorhanden: zusaetzlich einschaetzen, ob Abweichungen zwischen beiden
  // eher an Aussprache/Diktion oder an ASR-/KI-Gesangs-Artefakten liegen.
  const assessPronunciation = hasLyrics && hasTranscript;

  const metricLines = [];
  if (typeof metrics.overallScore === "number") metricLines.push("Gesamtscore: " + metrics.overallScore + "/100");
  if (typeof metrics.soundScore === "number") metricLines.push("Sound-Sauberkeit: " + Math.round(metrics.soundScore) + "/100");
  if (typeof metrics.starPotentialScore === "number") metricLines.push("Lautheit/Star-Potential: " + Math.round(metrics.starPotentialScore) + "/100");
  if (typeof metrics.hookScore === "number") metricLines.push("Hook-Staerke: " + Math.round(metrics.hookScore) + "/100");
  if (Array.isArray(metrics.topIssues) && metrics.topIssues.length > 0) {
    metricLines.push("Groesste technische Baustellen: " + metrics.topIssues.slice(0, 3).join(" | "));
  }

  const promptLines = [
    "Du bist ein erfahrener Songtexter, Ghostwriter und A&R-Berater, der Musik aus allen Genres und Stilrichtungen einschaetzt - von Hip-Hop ueber Pop, Rock, elektronische Musik/EDM, Akustik/Singer-Songwriter bis hin zu Volksmusik und allem dazwischen.",
    "Du bekommst " +
      (reconstructMode
        ? "ein automatisch erzeugtes (fehleranfaelliges) Transkript der gesungenen Vocals"
        : "einen Songtext") +
      " sowie automatisch gemessene technische Kennzahlen zum Track, ggf. zusaetzlich das Genre.",
    "Passe Ton, Vokabular und Empfehlungen IMMER an das jeweilige Genre an - was bei Hip-Hop als Hook funktioniert, ist bei Volksmusik oder Akustik-Balladen falsch, und umgekehrt. Wenn kein Genre angegeben ist, leite den passenden Stil aus Songtext und Kennzahlen ab, statt eine bestimmte Szene als Standard anzunehmen.",
    "Antworte AUSSCHLIESSLICH in genau diesem Format, ohne Markdown-Codebloecke, ohne zusaetzliche Ueberschriften oder Kommentare davor/danach:",
  ];
  if (reconstructMode) {
    promptLines.push(
      "###REKONSTRUKTION###",
      "Das Transkript stammt aus automatischer Spracherkennung von Gesang und enthaelt wahrscheinlich Fehler (Autotune, Beat im Hintergrund, Slang, falsch verstandene Woerter). Rekonstruiere MINIMAL-INVASIV den wahrscheinlich tatsaechlich gesungenen Text: nur klare Erkennungsfehler anhand von Kontext/Reimschema/Grammatik korrigieren, NICHT kreativ umschreiben oder verbessern - Zeilenzahl und Grundstruktur des Transkripts moeglichst beibehalten.",
      "###EINORDNUNG###"
    );
  } else {
    promptLines.push("###EINORDNUNG###");
  }
  promptLines.push(
    "2-4 Saetze, die den Track fuer den Kuenstler einordnen (Genre/Vibe/Zielgruppe), die technischen Kennzahlen sinnvoll einbeziehen (z.B. ob er radio-/playlisttauglich klingt) und kurz benennen, welches Setup/welche Produktion fuer dieses Genre typischerweise passt.",
    "###TITEL###",
    "Genau 3 alternative Songtitel-Ideen, die zum Text, zur Hook und zum Genre passen, kurz und einpraegsam - jede Idee auf einer eigenen Zeile, ohne Nummerierung oder Aufzaehlungszeichen.",
    "###TEXT###",
    (reconstructMode
      ? "Der ueberarbeitete Songtext, aufbauend auf deiner Rekonstruktion oben"
      : "Der ueberarbeitete Songtext") +
      " - Reime runder, Zeilen praegnanter, Hook einpraegsamer, ohne Sprache, Stil, Silbenzahl pro Zeile, Grundaussage oder Genre-Konventionen grundlegend zu veraendern, keine generischen Floskeln oder Fuellzeilen."
  );
  if (assessPronunciation) {
    promptLines.push(
      "###AUSSPRACHE###",
      "2-3 Saetze: Vergleiche den echten Songtext mit dem automatischen Vocals-Transkript (unten beigefuegt) und schaetze ein, ob Abweichungen eher auf Aussprache-/Diktionsprobleme beim Gesang, auf typische KI-Gesangs-Artefakte (z.B. Suno/Udio) oder schlicht auf Fehler der automatischen Spracherkennung selbst zurueckgehen. Wenn kaum Abweichungen bestehen, sag das kurz und positiv."
    );
  }
  promptLines.push(
    "###PROMPT###",
    "Ein einziger konkreter Stichwort-Zusatz (KEIN ganzer Satz, sondern kurze kommagetrennte Stil-Deskriptoren, wie in Prompts fuer KI-Musik-Generatoren wie Suno/Udio ueblich, auf Englisch, da diese Tools englische Stil-Begriffe am zuverlaessigsten umsetzen), den der Nutzer beim NAECHSTEN Generierungsversuch zusaetzlich in seinen Prompt einfuegen kann, um gezielt die groessten hier gemessenen technischen Probleme zu vermeiden (z.B. bei duennem/matschigem Bass: \"tight punchy sub-bass, clean low-end\"; bei harschen Zischlauten: \"smooth warm vocals, no sibilance\"; bei zu leise/dynamikarm: \"loud modern mix, punchy dynamics\"). Passe die Deskriptoren an Genre und gemessene Kennzahlen an. Falls die technischen Werte schon gut sind, nenne stattdessen 1-2 Deskriptoren, die die vorhandenen Staerken weiter verstaerken. Antworte NUR mit dem fertigen Stichwort-Zusatz selbst, ohne Einleitung/Erklaerung - direkt copy-paste-fertig fuer ein Prompt-Feld."
  );
  promptLines.push("");
  if (title) promptLines.push('Aktueller Songtitel: "' + title + '"');
  if (genre) promptLines.push("Genre (vom Nutzer angegeben/erkannt): " + genre);
  if (metricLines.length > 0) {
    promptLines.push("Technische Kennzahlen:");
    promptLines.push(...metricLines.map((l) => "- " + l));
  }
  promptLines.push("");
  if (reconstructMode) {
    promptLines.push("Automatisches Transkript der Vocals:");
    promptLines.push(transcript);
  } else {
    promptLines.push("Songtext:");
    promptLines.push(lyrics);
    if (assessPronunciation) {
      promptLines.push("");
      promptLines.push("Automatisches Transkript der Vocals (zum Abgleich fuer die Ausspracheeinschaetzung):");
      promptLines.push(transcript);
    }
  }
  const prompt = promptLines.join("\n");

  let apiRes;
  try {
    apiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 4000,
        stream: true,
        messages: [{ role: "user", content: prompt }],
      }),
    });
  } catch {
    return jsonResponse({ error: "KI-Dienst nicht erreichbar." }, 502, cors);
  }

  if (!apiRes.ok) {
    const errBody = await apiRes.text().catch(() => "");
    console.error("KI-Einschaetzung: Anthropic-Fehler", apiRes.status, errBody.slice(0, 500));
    return jsonResponse({ error: "KI-Anfrage fehlgeschlagen." }, 502, cors);
  }

  // Reicht die Anthropic-SSE-Antwort nicht 1:1 durch, sondern extrahiert nur die reinen
  // Text-Deltas - das Frontend braucht kein SSE-Parsing, sondern liest einfach Klartext, der
  // nach und nach im ###EINORDNUNG###/###TITEL###/###TEXT###-Format hereinkommt.
  const textStream = anthropicTextDeltaStream(apiRes.body);
  return new Response(textStream, {
    status: 200,
    headers: { "content-type": "text/plain; charset=utf-8", ...cors },
  });
}

function anthropicTextDeltaStream(anthropicBody) {
  const reader = anthropicBody.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";

  return new ReadableStream({
    async start(controller) {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6).trim();
            if (!jsonStr) continue;
            let evt;
            try {
              evt = JSON.parse(jsonStr);
            } catch {
              continue;
            }
            if (evt.type === "content_block_delta" && evt.delta && evt.delta.type === "text_delta") {
              controller.enqueue(encoder.encode(evt.delta.text));
            } else if (evt.type === "error") {
              controller.error(new Error((evt.error && evt.error.message) || "Anthropic-Stream-Fehler"));
              return;
            }
          }
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });
}

/* ---------- Battle-Rap-Contest ---------- */
// Turnierbaum mit Publikumsabstimmung. Ablauf pro Runde: Matchup wird per Losverfahren/Sieger-
// Fortschaltung angelegt (Admin) -> Teilnehmer haben bis submission_deadline Zeit, Track+Bild
// hochzuladen -> zwischen submission_deadline und vote_deadline stimmt das Publikum ab -> Admin
// schaltet die naechste Runde frei. Keine automatische Zeitsteuerung (siehe Kommentare unten) -
// der Admin loest jeden Schritt bewusst manuell aus, analog zu /admin/aggregate-genres.

const BATTLE_SUBMISSION_WINDOW_MS = 3 * 24 * 60 * 60 * 1000; // 3 Tage zum Einreichen des Diss-Tracks
const BATTLE_VOTE_WINDOW_MS = 4 * 24 * 60 * 60 * 1000; // danach 4 Tage Abstimmzeit
const MAX_BATTLE_AUDIO_BYTES = 25 * 1024 * 1024; // 25 MB - Diss-Track, kein ganzes Album
const MAX_BATTLE_PHOTO_BYTES = 8 * 1024 * 1024; // 8 MB
const ALLOWED_BATTLE_AUDIO_TYPES = new Set(["audio/mpeg", "audio/mp4", "audio/wav", "audio/x-wav", "audio/ogg", "audio/flac"]);
const ALLOWED_BATTLE_PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function battleAudioExtension(mimeType) {
  if (mimeType === "audio/wav" || mimeType === "audio/x-wav") return "wav";
  if (mimeType === "audio/flac") return "flac";
  if (mimeType === "audio/ogg") return "ogg";
  return "mp3";
}

function battlePhotoExtension(mimeType) {
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  return "jpg";
}

async function handleBattleRegister(request, env, cors) {
  const dbErr = requireDb(env, cors);
  if (dbErr) return dbErr;
  const user = await getUserFromRequest(request, env);
  if (!user) return jsonResponse({ error: "Bitte zuerst einloggen." }, 401, cors);
  if (!user.email_verified_at) {
    return jsonResponse(
      { error: "Bitte bestaetige zuerst deine E-Mail-Adresse, bevor du dich fuer den Battle-Contest anmeldest.", needsVerification: true },
      403,
      cors
    );
  }

  const body = await safeJson(request);
  const battleId = typeof body.battleId === "string" ? body.battleId : "";
  const artistName = typeof body.artistName === "string" ? body.artistName.trim().slice(0, 60) : "";
  if (!battleId || !artistName) {
    return jsonResponse({ error: "battleId und artistName erforderlich." }, 400, cors);
  }

  const battle = await env.DB.prepare("SELECT * FROM battles WHERE id = ?").bind(battleId).first();
  if (!battle) return jsonResponse({ error: "Battle nicht gefunden." }, 404, cors);
  if (battle.status !== "registration") {
    return jsonResponse({ error: "Die Anmeldephase ist bereits vorbei." }, 400, cors);
  }

  const existing = await env.DB.prepare("SELECT id FROM battle_participants WHERE battle_id = ? AND user_id = ?")
    .bind(battleId, user.id)
    .first();
  if (existing) return jsonResponse({ error: "Du bist schon fuer dieses Battle angemeldet." }, 400, cors);

  const countRow = await env.DB.prepare("SELECT COUNT(*) as count FROM battle_participants WHERE battle_id = ?")
    .bind(battleId)
    .first();
  if (countRow.count >= battle.max_participants) {
    return jsonResponse({ error: "Die Teilnehmerplaetze sind schon voll." }, 400, cors);
  }

  const id = crypto.randomUUID();
  await env.DB.prepare("INSERT INTO battle_participants (id, battle_id, user_id, artist_name, registered_at) VALUES (?, ?, ?, ?, ?)")
    .bind(id, battleId, user.id, artistName, Date.now())
    .run();

  return jsonResponse({ ok: true, participantId: id }, 200, cors);
}

async function handleBattleSubmit(request, env, cors) {
  const dbErr = requireDb(env, cors);
  if (dbErr) return dbErr;
  if (!env.BATTLE_MEDIA) {
    return jsonResponse({ error: "Der Media-Speicher ist noch nicht eingerichtet." }, 501, cors);
  }
  const user = await getUserFromRequest(request, env);
  if (!user) return jsonResponse({ error: "Bitte zuerst einloggen." }, 401, cors);

  let formData;
  try {
    formData = await request.formData();
  } catch {
    return jsonResponse({ error: "Ungueltige Anfrage." }, 400, cors);
  }

  const matchupId = formData.get("matchupId");
  const audio = formData.get("audio");
  const photo = formData.get("photo");
  const soundScoreRaw = formData.get("soundScore");
  if (typeof matchupId !== "string" || !matchupId) {
    return jsonResponse({ error: "matchupId erforderlich." }, 400, cors);
  }
  if (!(audio instanceof File) || !(photo instanceof File)) {
    return jsonResponse({ error: "Track und Bild sind beide erforderlich." }, 400, cors);
  }
  if (!ALLOWED_BATTLE_AUDIO_TYPES.has(audio.type)) {
    return jsonResponse({ error: "Nicht unterstuetztes Audioformat." }, 400, cors);
  }
  if (audio.size > MAX_BATTLE_AUDIO_BYTES) {
    return jsonResponse({ error: "Track ist zu gross (max. 25 MB)." }, 400, cors);
  }
  if (!ALLOWED_BATTLE_PHOTO_TYPES.has(photo.type)) {
    return jsonResponse({ error: "Nicht unterstuetztes Bildformat (JPG/PNG/WebP)." }, 400, cors);
  }
  if (photo.size > MAX_BATTLE_PHOTO_BYTES) {
    return jsonResponse({ error: "Bild ist zu gross (max. 8 MB)." }, 400, cors);
  }

  const matchup = await env.DB.prepare("SELECT * FROM battle_matchups WHERE id = ?").bind(matchupId).first();
  if (!matchup) return jsonResponse({ error: "Matchup nicht gefunden." }, 404, cors);
  if (Date.now() > matchup.submission_deadline) {
    return jsonResponse({ error: "Die Einreichungsfrist ist abgelaufen." }, 400, cors);
  }

  const participantA = await env.DB.prepare("SELECT * FROM battle_participants WHERE id = ?")
    .bind(matchup.participant_a_id)
    .first();
  const participantB = matchup.participant_b_id
    ? await env.DB.prepare("SELECT * FROM battle_participants WHERE id = ?").bind(matchup.participant_b_id).first()
    : null;

  let side = null;
  if (participantA && participantA.user_id === user.id) side = "a";
  else if (participantB && participantB.user_id === user.id) side = "b";
  if (!side) return jsonResponse({ error: "Du bist kein Teilnehmer dieses Matchups." }, 403, cors);

  const audioKey = `battles/${matchup.battle_id}/${matchupId}/${side}-track.${battleAudioExtension(audio.type)}`;
  const photoKey = `battles/${matchup.battle_id}/${matchupId}/${side}-photo.${battlePhotoExtension(photo.type)}`;

  await env.BATTLE_MEDIA.put(audioKey, await audio.arrayBuffer(), { httpMetadata: { contentType: audio.type } });
  await env.BATTLE_MEDIA.put(photoKey, await photo.arrayBuffer(), { httpMetadata: { contentType: photo.type } });

  // Sound-Score wird vom Browser der Einreichenden mitgeschickt (die Worker-Runtime kann Audio
  // nicht selbst dekodieren/analysieren) - rein informativ, deshalb bei fehlendem/ungueltigem Wert
  // einfach nicht speichern statt die Einreichung abzulehnen.
  const soundScore = typeof soundScoreRaw === "string" ? Number(soundScoreRaw) : null;
  const validScore = Number.isFinite(soundScore) && soundScore >= 0 && soundScore <= 100 ? soundScore : null;

  const audioColumn = side === "a" ? "submission_a_key" : "submission_b_key";
  const photoColumn = side === "a" ? "photo_a_key" : "photo_b_key";
  const scoreColumn = side === "a" ? "score_a" : "score_b";
  await env.DB.prepare(`UPDATE battle_matchups SET ${audioColumn} = ?, ${photoColumn} = ?, ${scoreColumn} = ? WHERE id = ?`)
    .bind(audioKey, photoKey, validScore, matchupId)
    .run();

  return jsonResponse({ ok: true }, 200, cors);
}

async function handleBattleVote(request, env, cors) {
  const dbErr = requireDb(env, cors);
  if (dbErr) return dbErr;

  const body = await safeJson(request);
  const matchupId = typeof body.matchupId === "string" ? body.matchupId : "";
  const side = body.side === "a" || body.side === "b" ? body.side : "";
  const voterFingerprint = typeof body.voterFingerprint === "string" ? body.voterFingerprint.slice(0, 100) : "";
  if (!matchupId || !side || !voterFingerprint) {
    return jsonResponse({ error: "matchupId, side und voterFingerprint erforderlich." }, 400, cors);
  }

  const matchup = await env.DB.prepare("SELECT * FROM battle_matchups WHERE id = ?").bind(matchupId).first();
  if (!matchup) return jsonResponse({ error: "Matchup nicht gefunden." }, 404, cors);
  if (!matchup.participant_b_id) {
    return jsonResponse({ error: "Bei diesem Matchup gibt es nichts abzustimmen (Freilos)." }, 400, cors);
  }
  if (Date.now() < matchup.submission_deadline) {
    return jsonResponse({ error: "Die Abstimmung hat noch nicht begonnen." }, 400, cors);
  }
  if (Date.now() > matchup.vote_deadline) {
    return jsonResponse({ error: "Die Abstimmung ist schon beendet." }, 400, cors);
  }

  try {
    await env.DB.prepare("INSERT INTO battle_votes (id, matchup_id, voter_fingerprint, voted_for, created_at) VALUES (?, ?, ?, ?, ?)")
      .bind(crypto.randomUUID(), matchupId, voterFingerprint, side, Date.now())
      .run();
  } catch {
    return jsonResponse({ error: "Du hast bei diesem Matchup schon abgestimmt." }, 400, cors);
  }

  const column = side === "a" ? "votes_a" : "votes_b";
  await env.DB.prepare(`UPDATE battle_matchups SET ${column} = ${column} + 1 WHERE id = ?`).bind(matchupId).run();

  return jsonResponse({ ok: true }, 200, cors);
}

async function handleBattleState(request, env, cors, slug) {
  const dbErr = requireDb(env, cors);
  if (dbErr) return dbErr;

  const battle = await env.DB.prepare("SELECT * FROM battles WHERE slug = ?").bind(slug).first();
  if (!battle) return jsonResponse({ error: "Battle nicht gefunden." }, 404, cors);

  // Optionaler Auth-Check: nur um dem eingeloggten Nutzer seine eigene Teilnehmer-ID
  // mitzugeben (fuers Einblenden des Einreichungsformulars) - liefert sonst nichts Zusaetzliches
  // ueber andere Teilnehmer preis.
  let myParticipantId = null;
  let myRegistered = false;
  const user = await getUserFromRequest(request, env);
  if (user) {
    const mine = await env.DB.prepare("SELECT id FROM battle_participants WHERE battle_id = ? AND user_id = ?")
      .bind(battle.id, user.id)
      .first();
    if (mine) {
      myParticipantId = mine.id;
      myRegistered = true;
    }
  }

  const { results: matchups } = await env.DB.prepare("SELECT * FROM battle_matchups WHERE battle_id = ? AND round_number = ?")
    .bind(battle.id, battle.round_number)
    .all();

  const participantIds = new Set();
  for (const m of matchups) {
    participantIds.add(m.participant_a_id);
    if (m.participant_b_id) participantIds.add(m.participant_b_id);
  }
  const participantNames = {};
  if (participantIds.size) {
    const idList = [...participantIds];
    const placeholders = idList.map(() => "?").join(",");
    const { results } = await env.DB.prepare(`SELECT id, artist_name FROM battle_participants WHERE id IN (${placeholders})`)
      .bind(...idList)
      .all();
    for (const p of results) participantNames[p.id] = p.artist_name;
  }

  const now = Date.now();
  const matchupsOut = matchups.map((m) => {
    const votingOpen = Boolean(m.participant_b_id) && now >= m.submission_deadline && now < m.vote_deadline;
    const votingClosed = now >= m.vote_deadline;
    return {
      id: m.id,
      participantA: { id: m.participant_a_id, name: participantNames[m.participant_a_id] || "?" },
      participantB: m.participant_b_id
        ? { id: m.participant_b_id, name: participantNames[m.participant_b_id] || "?" }
        : null,
      audioA: m.submission_a_key ? "/battle-media/" + m.submission_a_key : null,
      audioB: m.submission_b_key ? "/battle-media/" + m.submission_b_key : null,
      photoA: m.photo_a_key ? "/battle-media/" + m.photo_a_key : null,
      photoB: m.photo_b_key ? "/battle-media/" + m.photo_b_key : null,
      // Anders als votesA/votesB bewusst SOFORT sichtbar, nicht erst nach Abstimmungsende - der
      // Sound-Score ist Teil dessen, was Teilnehmer direkt nach dem Einreichen teilen sollen
      // ("Votet fuer mich"-Loop), kein Abstimmungsergebnis, das Bandwagon-Effekte ausloesen koennte.
      scoreA: m.score_a,
      scoreB: m.score_b,
      submissionDeadline: m.submission_deadline,
      voteDeadline: m.vote_deadline,
      votingOpen,
      // Zwischenstand bewusst erst nach Ablauf der Abstimmung sichtbar, gegen Bandwagon-Effekte.
      votesA: votingClosed ? m.votes_a : null,
      votesB: votingClosed ? m.votes_b : null,
      winnerParticipantId: m.winner_participant_id,
    };
  });

  return jsonResponse(
    {
      battle: {
        id: battle.id,
        slug: battle.slug,
        title: battle.title,
        status: battle.status,
        roundNumber: battle.round_number,
        maxParticipants: battle.max_participants,
      },
      matchups: matchupsOut,
      myParticipantId,
      myRegistered,
    },
    200,
    cors
  );
}

// cors-Header noetig, damit die Battle-Seite bereits hochgeladene Tracks per fetch() erneut
// dekodieren kann (z.B. fuer den 15s-Snippet-Video-Export) - <audio src="...">-Tags brauchten das
// bisher nicht, ein fetch()+decodeAudioData() wird ohne Access-Control-Allow-Origin geblockt.
async function handleBattleMedia(env, key, cors) {
  if (!env.BATTLE_MEDIA) return new Response("Media-Speicher ist noch nicht eingerichtet.", { status: 501, headers: cors });
  const object = await env.BATTLE_MEDIA.get(key);
  if (!object) return new Response("Nicht gefunden.", { status: 404, headers: cors });
  const headers = new Headers(cors);
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", "public, max-age=31536000, immutable");
  return new Response(object.body, { headers });
}

// Kontaktliste (E-Mail + Kuenstlername) der Teilnehmer eines Battles - separat vom oeffentlichen
// /battle/:slug/state-Endpunkt gehalten, der bewusst keine E-Mails preisgibt. Fuer z.B. die
// Finale-Ankuendigung oder Rueckfragen an Teilnehmer.
async function handleAdminBattleParticipants(request, env, cors, url) {
  const dbErr = requireDb(env, cors);
  if (dbErr) return dbErr;
  if (!env.ADMIN_SECRET || request.headers.get("x-admin-secret") !== env.ADMIN_SECRET) {
    return jsonResponse({ error: "Nicht autorisiert." }, 401, cors);
  }

  const battleId = url.searchParams.get("battleId") || "";
  if (!battleId) return jsonResponse({ error: "battleId erforderlich." }, 400, cors);

  const { results } = await env.DB.prepare(
    "SELECT u.email AS email, bp.artist_name AS artistName, bp.registered_at AS registeredAt, bp.eliminated_round AS eliminatedRound " +
      "FROM battle_participants bp JOIN users u ON u.id = bp.user_id WHERE bp.battle_id = ? ORDER BY bp.registered_at ASC"
  )
    .bind(battleId)
    .all();

  return jsonResponse({ ok: true, participants: results || [] }, 200, cors);
}

async function handleAdminBattleCreate(request, env, cors) {
  const dbErr = requireDb(env, cors);
  if (dbErr) return dbErr;
  if (!env.ADMIN_SECRET || request.headers.get("x-admin-secret") !== env.ADMIN_SECRET) {
    return jsonResponse({ error: "Nicht autorisiert." }, 401, cors);
  }

  const body = await safeJson(request);
  const slug = typeof body.slug === "string" ? body.slug.trim() : "";
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const maxParticipants =
    Number.isFinite(body.maxParticipants) && body.maxParticipants > 0 ? Math.floor(body.maxParticipants) : 32;
  if (!slug || !title) {
    return jsonResponse({ error: "slug und title erforderlich." }, 400, cors);
  }

  const existing = await env.DB.prepare("SELECT id FROM battles WHERE slug = ?").bind(slug).first();
  if (existing) {
    return jsonResponse({ error: "Ein Battle mit diesem Slug existiert schon.", battleId: existing.id }, 400, cors);
  }

  const id = crypto.randomUUID();
  await env.DB.prepare(
    "INSERT INTO battles (id, slug, title, status, max_participants, round_number, created_at) VALUES (?, ?, ?, 'registration', ?, 0, ?)"
  )
    .bind(id, slug, title, maxParticipants, Date.now())
    .run();

  return jsonResponse({ ok: true, battleId: id, slug }, 200, cors);
}

// Erstellt aus den bestaetigten Teilnehmern per Zufall die Runde-1-Matchups (Fisher-Yates-Shuffle).
// Bei ungerader Teilnehmerzahl bekommt die/der letzte im Shuffle ein Freilos (zieht ohne Abstimmung
// direkt weiter) - bei den geplanten 32 Teilnehmern kommt das nicht vor, macht die Funktion aber
// robust fuer abweichende Anmeldezahlen.
async function handleAdminBattleDraw(request, env, cors) {
  const dbErr = requireDb(env, cors);
  if (dbErr) return dbErr;
  if (!env.ADMIN_SECRET || request.headers.get("x-admin-secret") !== env.ADMIN_SECRET) {
    return jsonResponse({ error: "Nicht autorisiert." }, 401, cors);
  }

  const body = await safeJson(request);
  const battleId = typeof body.battleId === "string" ? body.battleId : "";
  if (!battleId) return jsonResponse({ error: "battleId erforderlich." }, 400, cors);

  const battle = await env.DB.prepare("SELECT * FROM battles WHERE id = ?").bind(battleId).first();
  if (!battle) return jsonResponse({ error: "Battle nicht gefunden." }, 404, cors);
  if (battle.status !== "registration") {
    return jsonResponse({ error: "Das Losverfahren wurde fuer dieses Battle schon durchgefuehrt." }, 400, cors);
  }

  const { results: participants } = await env.DB.prepare("SELECT id FROM battle_participants WHERE battle_id = ?")
    .bind(battleId)
    .all();
  if (participants.length < 2) {
    return jsonResponse({ error: "Mindestens 2 Teilnehmer noetig." }, 400, cors);
  }

  const shuffled = participants.map((p) => p.id);
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const now = Date.now();
  const submissionDeadline = now + BATTLE_SUBMISSION_WINDOW_MS;
  const voteDeadline = submissionDeadline + BATTLE_VOTE_WINDOW_MS;

  let matchupCount = 0;
  for (let i = 0; i < shuffled.length; i += 2) {
    const a = shuffled[i];
    const b = shuffled[i + 1] || null;
    const matchupId = crypto.randomUUID();
    await env.DB.prepare(
      "INSERT INTO battle_matchups (id, battle_id, round_number, participant_a_id, participant_b_id, votes_a, votes_b, submission_deadline, vote_deadline) VALUES (?, ?, 1, ?, ?, 0, 0, ?, ?)"
    )
      .bind(matchupId, battleId, a, b, submissionDeadline, voteDeadline)
      .run();
    if (!b) {
      await env.DB.prepare("UPDATE battle_matchups SET winner_participant_id = ? WHERE id = ?").bind(a, matchupId).run();
    }
    matchupCount++;
  }

  await env.DB.prepare("UPDATE battles SET status = 'active', round_number = 1 WHERE id = ?").bind(battleId).run();

  return jsonResponse({ ok: true, matchupCount }, 200, cors);
}

// Schliesst die aktuelle Runde ab (Sieger = mehr Stimmen, oder manueller Override bei Gleichstand/
// Streitfall ueber overrides: { matchupId: 'a'|'b' }) und legt die naechste Runde an. Bei nur noch
// einem Sieger ist das Finale entschieden, Battle wird auf 'finished' gesetzt.
async function handleAdminBattleAdvance(request, env, cors) {
  const dbErr = requireDb(env, cors);
  if (dbErr) return dbErr;
  if (!env.ADMIN_SECRET || request.headers.get("x-admin-secret") !== env.ADMIN_SECRET) {
    return jsonResponse({ error: "Nicht autorisiert." }, 401, cors);
  }

  const body = await safeJson(request);
  const battleId = typeof body.battleId === "string" ? body.battleId : "";
  const overrides = body.overrides && typeof body.overrides === "object" ? body.overrides : {};
  if (!battleId) return jsonResponse({ error: "battleId erforderlich." }, 400, cors);

  const battle = await env.DB.prepare("SELECT * FROM battles WHERE id = ?").bind(battleId).first();
  if (!battle) return jsonResponse({ error: "Battle nicht gefunden." }, 404, cors);
  if (battle.status !== "active") {
    return jsonResponse({ error: "Battle ist nicht aktiv." }, 400, cors);
  }

  const { results: matchups } = await env.DB.prepare("SELECT * FROM battle_matchups WHERE battle_id = ? AND round_number = ?")
    .bind(battleId, battle.round_number)
    .all();

  const winners = [];
  for (const m of matchups) {
    let winnerId = m.winner_participant_id;
    if (!winnerId) {
      const overrideSide = overrides[m.id];
      if (overrideSide === "a") winnerId = m.participant_a_id;
      else if (overrideSide === "b") winnerId = m.participant_b_id;
      else winnerId = m.votes_b > m.votes_a ? m.participant_b_id : m.participant_a_id;

      await env.DB.prepare("UPDATE battle_matchups SET winner_participant_id = ? WHERE id = ?").bind(winnerId, m.id).run();

      const loserId = winnerId === m.participant_a_id ? m.participant_b_id : m.participant_a_id;
      if (loserId) {
        await env.DB.prepare("UPDATE battle_participants SET eliminated_round = ? WHERE id = ?")
          .bind(battle.round_number, loserId)
          .run();
      }
    }
    winners.push(winnerId);
  }

  if (winners.length <= 1) {
    await env.DB.prepare("UPDATE battles SET status = 'finished' WHERE id = ?").bind(battleId).run();
    return jsonResponse({ ok: true, finished: true, winnerParticipantId: winners[0] || null }, 200, cors);
  }

  const nextRound = battle.round_number + 1;
  const now = Date.now();
  const submissionDeadline = now + BATTLE_SUBMISSION_WINDOW_MS;
  const voteDeadline = submissionDeadline + BATTLE_VOTE_WINDOW_MS;

  let matchupCount = 0;
  for (let i = 0; i < winners.length; i += 2) {
    const a = winners[i];
    const b = winners[i + 1] || null;
    const matchupId = crypto.randomUUID();
    await env.DB.prepare(
      "INSERT INTO battle_matchups (id, battle_id, round_number, participant_a_id, participant_b_id, votes_a, votes_b, submission_deadline, vote_deadline) VALUES (?, ?, ?, ?, ?, 0, 0, ?, ?)"
    )
      .bind(matchupId, battleId, nextRound, a, b, submissionDeadline, voteDeadline)
      .run();
    if (!b) {
      await env.DB.prepare("UPDATE battle_matchups SET winner_participant_id = ? WHERE id = ?").bind(a, matchupId).run();
    }
    matchupCount++;
  }

  await env.DB.prepare("UPDATE battles SET round_number = ? WHERE id = ?").bind(nextRound, battleId).run();

  return jsonResponse({ ok: true, finished: false, nextRound, matchupCount }, 200, cors);
}

/* ---------- Routing ---------- */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Stripe ruft den Webhook server-seitig auf - kein CORS/Origin-Check, kein Rate-Limit per Client-IP.
    if (url.pathname === "/stripe-webhook") {
      if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
      return handleStripeWebhook(request, env);
    }

    const cors = corsHeadersFor(request);
    const clientIp = request.headers.get("CF-Connecting-IP") || "unknown";

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors });
    }

    if (url.pathname === "/auth/register" && request.method === "POST") {
      return withRateLimit(env, "auth:" + clientIp, cors, () => handleRegister(request, env, cors));
    }
    if (url.pathname === "/auth/login" && request.method === "POST") {
      return withRateLimit(env, "auth:" + clientIp, cors, () => handleLogin(request, env, cors));
    }
    if (url.pathname === "/auth/logout" && request.method === "POST") {
      return handleLogout(request, env, cors);
    }
    if (url.pathname === "/auth/me" && request.method === "GET") {
      return handleMe(request, env, cors);
    }
    if (url.pathname === "/auth/delete-account" && request.method === "POST") {
      return withRateLimit(env, "delacc:" + clientIp, cors, () => handleDeleteAccount(request, env, cors));
    }
    if (url.pathname === "/auth/request-password-reset" && request.method === "POST") {
      return withRateLimit(env, "pwreset:" + clientIp, cors, () => handleRequestPasswordReset(request, env, cors));
    }
    if (url.pathname === "/auth/reset-password" && request.method === "POST") {
      return withRateLimit(env, "pwreset:" + clientIp, cors, () => handleResetPassword(request, env, cors));
    }
    if (url.pathname === "/auth/verify-email" && request.method === "POST") {
      return withRateLimit(env, "verifyemail:" + clientIp, cors, () => handleVerifyEmail(request, env, cors));
    }
    if (url.pathname === "/auth/resend-verification" && request.method === "POST") {
      return withRateLimit(env, "verifyemail:" + clientIp, cors, () => handleResendVerification(request, env, cors));
    }
    if (url.pathname === "/consume-credit" && request.method === "POST") {
      return withRateLimit(env, "credit:" + clientIp, cors, () => handleConsumeCredit(request, env, cors));
    }
    if (url.pathname === "/rate-download" && request.method === "POST") {
      return withRateLimit(env, "rate:" + clientIp, cors, () => handleSubmitRating(request, env, cors));
    }
    if (url.pathname === "/create-checkout-session" && request.method === "POST") {
      return handleCreateCheckoutSession(request, env, cors);
    }
    if (url.pathname === "/create-portal-session" && request.method === "POST") {
      return handleCreatePortalSession(request, env, cors);
    }
    if (url.pathname === "/save-check-result" && request.method === "POST") {
      return withRateLimit(env, "savecheck:" + clientIp, cors, () => handleSaveCheckResult(request, env, cors));
    }
    if (url.pathname === "/my-checks" && request.method === "GET") {
      return handleMyChecks(request, env, cors);
    }
    if (url.pathname === "/check-detail" && request.method === "GET") {
      return handleCheckDetail(request, env, cors, url.searchParams.get("id") || "");
    }
    if (url.pathname === "/track-metrics" && request.method === "POST") {
      return withRateLimit(env, "trackmetrics:" + clientIp, cors, () => handleTrackMetrics(request, env, cors));
    }
    if (url.pathname === "/track-funnel" && request.method === "POST") {
      return withRateLimit(env, "trackfunnel:" + clientIp, cors, () => handleTrackFunnel(request, env, cors));
    }
    if (url.pathname === "/admin/grant-plan" && request.method === "POST") {
      return handleAdminGrantPlan(request, env, cors);
    }
    if (url.pathname === "/admin/aggregate-genres" && request.method === "POST") {
      return handleAggregateGenres(request, env, cors);
    }
    if (url.pathname.startsWith("/check/") && request.method === "GET") {
      const slug = url.pathname.slice("/check/".length).replace(/\/+$/, "");
      return handleGenrePage(request, env, slug);
    }
    if (url.pathname === "/genre-stats" && request.method === "GET") {
      return handleGenreStatsApi(request, env, cors);
    }
    if (url.pathname === "/sitemap-genres.xml" && request.method === "GET") {
      return handleSitemapGenres(env);
    }
    if (url.pathname === "/battle/register" && request.method === "POST") {
      return handleBattleRegister(request, env, cors);
    }
    if (url.pathname === "/battle/submit" && request.method === "POST") {
      return withRateLimit(env, "battlesubmit:" + clientIp, cors, () => handleBattleSubmit(request, env, cors));
    }
    if (url.pathname === "/battle/vote" && request.method === "POST") {
      return withRateLimit(env, "battlevote:" + clientIp, cors, () => handleBattleVote(request, env, cors));
    }
    if (url.pathname.startsWith("/battle/") && url.pathname.endsWith("/state") && request.method === "GET") {
      const slug = url.pathname.slice("/battle/".length, -"/state".length);
      return handleBattleState(request, env, cors, slug);
    }
    if (url.pathname.startsWith("/battle-media/") && request.method === "GET") {
      const key = url.pathname.slice("/battle-media/".length);
      return handleBattleMedia(env, key, cors);
    }
    if (url.pathname === "/admin/battle/participants" && request.method === "GET") {
      return handleAdminBattleParticipants(request, env, cors, url);
    }
    if (url.pathname === "/admin/battle/create" && request.method === "POST") {
      return handleAdminBattleCreate(request, env, cors);
    }
    if (url.pathname === "/admin/battle/draw" && request.method === "POST") {
      return handleAdminBattleDraw(request, env, cors);
    }
    if (url.pathname === "/admin/battle/advance" && request.method === "POST") {
      return handleAdminBattleAdvance(request, env, cors);
    }

    if (request.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405, cors);
    }

    // Default-Route (Wurzelpfad): bestehende KI-Einschaetzung, weiterhin per IP rate-limitiert.
    if (env.RATE_LIMITER) {
      const { success } = await env.RATE_LIMITER.limit({ key: clientIp });
      if (!success) {
        return jsonResponse({ error: "Zu viele Anfragen. Bitte in einer Minute nochmal versuchen." }, 429, cors);
      }
    }
    return handleKiEinschaetzung(request, env, cors);
  },

  // Cloudflare Cron Trigger (siehe wrangler.toml [triggers] crons) - laeuft nachts automatisch,
  // berechnet die Genre-Kennzahlen neu. Kein Rueckgabewert noetig, Fehler landen im Worker-Log.
  async scheduled(event, env) {
    if (!env.DB) return;
    await aggregateGenreStats(env);
  },
};
