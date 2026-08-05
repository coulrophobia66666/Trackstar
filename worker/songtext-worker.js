// Cloudflare Worker fuer Overhertz: Konten/Login, Credits & Pro-Abo (D1 + Stripe),
// sowie die KI-Einschaetzung (Anthropic). Haelt alle Secrets serverseitig - sie duerfen
// nie im Frontend-Code der statischen Website landen.
//
// Benoetigte Bindings/Variablen im Worker (Cloudflare-Dashboard -> Settings):
//   Secrets:  ANTHROPIC_API_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, RESEND_API_KEY
//   Klartext: STRIPE_PRICE_CREDITS, STRIPE_PRICE_PRO_MONTHLY, STRIPE_PRICE_PRO_ANNUAL
//             (Stripe Price-IDs, z.B. "price_...", sind nicht geheim), RESEND_FROM_EMAIL
//             (Absenderadresse fuer Passwort-Reset-Mails, z.B. "Overhertz <noreply@overhertz.app>")
//   D1-Binding: DB (siehe wrangler.toml + schema.sql)
//   Rate-Limit-Binding RATE_LIMITER wird beim Deploy automatisch angelegt.

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

/* ---------- E-Mail (Resend, fuer Passwort-Reset) ---------- */

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
  };
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

  const token = await createSession(env, id);
  return jsonResponse(
    { token, user: publicUser({ id, email, plan: "free", credits: 0, checks_used_period: 0, plan_renews_at: null }) },
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
      html:
        '<p>Hallo,</p><p>hier ist dein Link zum Zurücksetzen deines Overhertz-Passworts (1 Stunde gültig):</p>' +
        '<p><a href="' + resetUrl + '">' + resetUrl + "</a></p>" +
        "<p>Hast du das nicht angefordert, kannst du diese E-Mail ignorieren.</p>",
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

async function handleConsumeCredit(request, env, cors) {
  const dbErr = requireDb(env, cors);
  if (dbErr) return dbErr;

  const user = await getUserFromRequest(request, env);
  if (!user) return jsonResponse({ error: "Bitte zuerst einloggen." }, 401, cors);

  if ((user.plan === "pro" || user.plan === "pro_annual") && user.checks_used_period < PRO_MONTHLY_QUOTA) {
    await env.DB.prepare("UPDATE users SET checks_used_period = checks_used_period + 1 WHERE id = ?").bind(user.id).run();
    await env.DB.prepare("INSERT INTO checks (id, user_id, created_at) VALUES (?, ?, ?)")
      .bind(crypto.randomUUID(), user.id, Date.now())
      .run();
    return jsonResponse(
      { ok: true, plan: user.plan, credits: user.credits, quotaLeft: PRO_MONTHLY_QUOTA - user.checks_used_period - 1 },
      200,
      cors
    );
  }

  if (user.credits > 0) {
    await env.DB.prepare("UPDATE users SET credits = credits - 1 WHERE id = ?").bind(user.id).run();
    await env.DB.prepare("INSERT INTO checks (id, user_id, created_at) VALUES (?, ?, ?)")
      .bind(crypto.randomUUID(), user.id, Date.now())
      .run();
    return jsonResponse({ ok: true, plan: user.plan, credits: user.credits - 1, quotaLeft: null }, 200, cors);
  }

  return jsonResponse({ ok: false, error: "Keine Credits mehr uebrig und kein aktives Pro-Abo." }, 402, cors);
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
  if (!res.ok) throw new Error(data?.error?.message || "Stripe-Fehler");
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
    };

    // Wer schon mal Credits gekauft hat und jetzt erstmals auf Pro upgraden will, bekommt einen
    // pauschalen Rabatt (Coupon-ID in Stripe hinterlegt, z.B. "einmalig 5 EUR ab") - kein
    // individuelles Verrechnen von Rest-Credits, bewusst simpel gehalten.
    const isFirstProUpgrade = (planType === "pro" || planType === "pro_annual") && !user.stripe_subscription_id;
    if (user.has_bought_credits && isFirstProUpgrade && env.STRIPE_COUPON_CREDITS_UPGRADE) {
      sessionParams.discounts = [{ coupon: env.STRIPE_COUPON_CREDITS_UPGRADE }];
    }

    const session = await stripeRequest(env, "checkout/sessions", sessionParams);

    return jsonResponse({ url: session.url }, 200, cors);
  } catch (err) {
    return jsonResponse({ error: err.message || "Zahlung konnte nicht gestartet werden." }, 502, cors);
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
  const genre = typeof body.genre === "string" ? body.genre.slice(0, 60) : "";
  const metrics = body.metrics && typeof body.metrics === "object" ? body.metrics : {};

  if (lyrics.trim().length < 10) {
    return jsonResponse({ error: "Songtext fehlt oder ist zu kurz." }, 400, cors);
  }
  if (lyrics.length > 6000) {
    return jsonResponse({ error: "Songtext ist zu lang (max. 6000 Zeichen)." }, 400, cors);
  }

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
    "Du bekommst einen Songtext sowie automatisch gemessene technische Kennzahlen zum Track, ggf. zusaetzlich das Genre.",
    "Passe Ton, Vokabular und Empfehlungen IMMER an das jeweilige Genre an - was bei Hip-Hop als Hook funktioniert, ist bei Volksmusik oder Akustik-Balladen falsch, und umgekehrt. Wenn kein Genre angegeben ist, leite den passenden Stil aus Songtext und Kennzahlen ab, statt eine bestimmte Szene als Standard anzunehmen.",
    "Antworte AUSSCHLIESSLICH in genau diesem Format, ohne Markdown-Codebloecke, ohne zusaetzliche Ueberschriften oder Kommentare davor/danach:",
    "###EINORDNUNG###",
    "2-4 Saetze, die den Track fuer den Kuenstler einordnen (Genre/Vibe/Zielgruppe), die technischen Kennzahlen sinnvoll einbeziehen (z.B. ob er radio-/playlisttauglich klingt) und kurz benennen, welches Setup/welche Produktion fuer dieses Genre typischerweise passt.",
    "###TITEL###",
    "Genau 3 alternative Songtitel-Ideen, die zum Text, zur Hook und zum Genre passen, kurz und einpraegsam - jede Idee auf einer eigenen Zeile, ohne Nummerierung oder Aufzaehlungszeichen.",
    "###TEXT###",
    "Der ueberarbeitete Songtext - Reime runder, Zeilen praegnanter, Hook einpraegsamer, ohne Sprache, Stil, Silbenzahl pro Zeile, Grundaussage oder Genre-Konventionen grundlegend zu veraendern, keine generischen Floskeln oder Fuellzeilen.",
    "",
  ];
  if (title) promptLines.push('Aktueller Songtitel: "' + title + '"');
  if (genre) promptLines.push("Genre (vom Nutzer angegeben/erkannt): " + genre);
  if (metricLines.length > 0) {
    promptLines.push("Technische Kennzahlen:");
    promptLines.push(...metricLines.map((l) => "- " + l));
  }
  promptLines.push("");
  promptLines.push("Songtext:");
  promptLines.push(lyrics);
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
    if (url.pathname === "/auth/request-password-reset" && request.method === "POST") {
      return withRateLimit(env, "pwreset:" + clientIp, cors, () => handleRequestPasswordReset(request, env, cors));
    }
    if (url.pathname === "/auth/reset-password" && request.method === "POST") {
      return withRateLimit(env, "pwreset:" + clientIp, cors, () => handleResetPassword(request, env, cors));
    }
    if (url.pathname === "/consume-credit" && request.method === "POST") {
      return withRateLimit(env, "credit:" + clientIp, cors, () => handleConsumeCredit(request, env, cors));
    }
    if (url.pathname === "/create-checkout-session" && request.method === "POST") {
      return handleCreateCheckoutSession(request, env, cors);
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
};
