// Cloudflare Worker: nimmt Songtitel, Songtext und die technischen Kennzahlen entgegen
// und laesst Claude daraus einen verbesserten Songtext, eine kurze Einordnung und
// Titel-Ideen erzeugen. Haelt den Anthropic API-Key serverseitig - er darf nie im
// Frontend-Code der statischen Website landen.
//
// Deploy: ueber das an GitHub angebundene Cloudflare-Projekt - Secret ANTHROPIC_API_KEY
// in den Worker-Settings hinterlegen. Rate-Limit-Binding (siehe wrangler.toml) wird
// automatisch beim Deploy mit angelegt, keine manuelle Cloudflare-Einrichtung noetig.

const ALLOWED_ORIGINS = new Set([
  "https://trackstar-web.coulrophobia66666.workers.dev",
]);

function corsHeadersFor(request) {
  const origin = request.headers.get("Origin") || "";
  const allowOrigin = ALLOWED_ORIGINS.has(origin) ? origin : [...ALLOWED_ORIGINS][0];
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}

function jsonResponse(obj, status, corsHeaders) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json", ...corsHeaders },
  });
}

function stripCodeFence(text) {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenceMatch ? fenceMatch[1] : trimmed;
}

export default {
  async fetch(request, env) {
    const cors = corsHeadersFor(request);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors });
    }
    if (request.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405, cors);
    }

    const clientIp = request.headers.get("CF-Connecting-IP") || "unknown";
    if (env.RATE_LIMITER) {
      const { success } = await env.RATE_LIMITER.limit({ key: clientIp });
      if (!success) {
        return jsonResponse({ error: "Zu viele Anfragen. Bitte in einer Minute nochmal versuchen." }, 429, cors);
      }
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: "Ungueltiger Request-Body." }, 400, cors);
    }

    const title = typeof body.title === "string" ? body.title.slice(0, 200) : "";
    const lyrics = typeof body.lyrics === "string" ? body.lyrics : "";
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
      "Du bist ein erfahrener deutscher Songtexter, Ghostwriter und A&R-Berater fuer Deutschrap/Strassenmusik.",
      "Du bekommst einen Songtext sowie automatisch gemessene technische Kennzahlen zum Track.",
      "Antworte AUSSCHLIESSLICH mit einem gueltigen JSON-Objekt (keine Markdown-Codebloecke, kein Fliesstext davor oder danach) mit genau diesen drei Feldern:",
      '"einordnung": 2-4 Saetze, die den Track fuer den Kuenstler einordnen (Genre/Vibe/Zielgruppe) und dabei die technischen Kennzahlen sinnvoll einbeziehen (z.B. ob er radio-/playlisttauglich klingt).',
      '"titelvorschlaege": ein Array mit genau 3 alternativen Songtitel-Ideen, die zum Text und zur Hook passen, kurz und einpraegsam.',
      '"verbesserterText": der ueberarbeitete Songtext - Reime runder, Zeilen praegnanter, Hook einpraegsamer, ohne Sprache, Stil, Silbenzahl pro Zeile oder Grundaussage grundlegend zu veraendern, keine generischen Floskeln oder Fuellzeilen.',
      "",
    ];
    if (title) promptLines.push('Aktueller Songtitel: "' + title + '"');
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
          max_tokens: 1500,
          messages: [{ role: "user", content: prompt }],
        }),
      });
    } catch (err) {
      return jsonResponse({ error: "KI-Dienst nicht erreichbar." }, 502, cors);
    }

    if (!apiRes.ok) {
      return jsonResponse({ error: "KI-Anfrage fehlgeschlagen." }, 502, cors);
    }

    const data = await apiRes.json();
    const rawText = data?.content?.[0]?.text?.trim() || "";
    if (!rawText) {
      return jsonResponse({ error: "Keine Antwort von der KI erhalten." }, 502, cors);
    }

    let parsed;
    try {
      parsed = JSON.parse(stripCodeFence(rawText));
    } catch {
      return jsonResponse({ error: "KI-Antwort konnte nicht gelesen werden." }, 502, cors);
    }

    const improved = typeof parsed.verbesserterText === "string" ? parsed.verbesserterText.trim() : "";
    const classification = typeof parsed.einordnung === "string" ? parsed.einordnung.trim() : "";
    const titleIdeas = Array.isArray(parsed.titelvorschlaege) ? parsed.titelvorschlaege.filter((t) => typeof t === "string").slice(0, 3) : [];

    if (!improved) {
      return jsonResponse({ error: "Keine verwertbare Antwort von der KI erhalten." }, 502, cors);
    }

    return jsonResponse({ improved, classification, titleIdeas }, 200, cors);
  },
};
