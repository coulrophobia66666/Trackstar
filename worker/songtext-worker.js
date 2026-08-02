// Cloudflare Worker: nimmt Songtitel + Songtext entgegen, lässt Claude den Text
// verbessern und gibt ihn zurück. Hält den Anthropic API-Key serverseitig -
// er darf nie im Frontend-Code der statischen Website landen.
//
// Deploy: `npx wrangler deploy` (siehe wrangler.toml), danach den Secret setzen:
// `npx wrangler secret put ANTHROPIC_API_KEY`

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function jsonResponse(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json", ...CORS_HEADERS },
  });
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }
    if (request.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: "Ungültiger Request-Body." }, 400);
    }

    const title = typeof body.title === "string" ? body.title.slice(0, 200) : "";
    const lyrics = typeof body.lyrics === "string" ? body.lyrics : "";

    if (lyrics.trim().length < 10) {
      return jsonResponse({ error: "Songtext fehlt oder ist zu kurz." }, 400);
    }
    if (lyrics.length > 6000) {
      return jsonResponse({ error: "Songtext ist zu lang (max. 6000 Zeichen)." }, 400);
    }

    const promptLines = [
      "Du bist ein erfahrener deutscher Songtexter und Ghostwriter fuer Deutschrap/Strassenmusik.",
      "Ueberarbeite den folgenden Songtext: mach Reime runder, Zeilen praegnanter und die Hook einpraegsamer,",
      "ohne Sprache, Stil, Silbenzahl pro Zeile oder Grundaussage grundlegend zu veraendern.",
      "Vermeide generische Floskeln und Fuellzeilen.",
    ];
    if (title) {
      promptLines.push('Der Songtitel ist "' + title + '" - lass ihn, falls sinnvoll, in der Hook anklingen.');
    }
    promptLines.push("Gib NUR den ueberarbeiteten Songtext zurueck, ohne Erklaerung, ohne Anfuehrungszeichen, ohne Ueberschrift.");
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
          max_tokens: 1200,
          messages: [{ role: "user", content: prompt }],
        }),
      });
    } catch (err) {
      return jsonResponse({ error: "KI-Dienst nicht erreichbar." }, 502);
    }

    if (!apiRes.ok) {
      return jsonResponse({ error: "KI-Anfrage fehlgeschlagen." }, 502);
    }

    const data = await apiRes.json();
    const improved = data?.content?.[0]?.text?.trim() || "";
    if (!improved) {
      return jsonResponse({ error: "Keine Antwort von der KI erhalten." }, 502);
    }

    return jsonResponse({ improved });
  },
};
