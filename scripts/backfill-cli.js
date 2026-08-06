#!/usr/bin/env node
// CLI-Backfill fuer die Genre-Statistik-Seiten: analysiert alle Audiodateien in einem Ordner mit
// der ECHTEN, unveraenderten Website-Analyse (steuert einen echten Browser gegen die Live-Seite,
// statt die Analyse ein zweites Mal in Node nachzubauen - so gibt es nur eine Wahrheit, keine
// Chance auf Abweichung zwischen "was der Kunde sieht" und "was hier gemessen wird"). Meldet die
// Rohmesswerte als "Seed"-Daten (isSeed=true) an den Worker - zeigt nichts an, verbraucht keine
// Credits, speichert keine Audiodatei.
//
// Voraussetzung: `npm install playwright && npx playwright install chromium` (einmalig).
//
// Nutzung:
//   node scripts/backfill-cli.js <Ordner> <Genre-Slug> [--url=https://overhertz.app/index.html] [--worker-url=...]
//
// Beispiel:
//   node scripts/backfill-cli.js ~/Musik/trap-tracks trap
//
// --worker-url ueberschreibt die vom Worker aus der Seite ausgelesene Adresse - nur fuer's Testen
// gegen einen lokalen/Staging-Worker gedacht, im Normalfall nicht noetig.
//
// Gueltige Genre-Slugs: siehe GENRE_PAGE_DEFS in worker/songtext-worker.js (z.B. deutschrap,
// hiphop, trap, drill, rnb, techno, house, phonk, country, pop, rock - neues Genre = neuer
// Eintrag dort, dieses Skript braucht keine Anpassung).

const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const AUDIO_EXTENSIONS = new Set([".mp3", ".wav", ".m4a", ".aac", ".flac", ".ogg", ".opus", ".wma"]);
const DEFAULT_URL = "https://overhertz.app/index.html";

async function main() {
  const [, , folder, genreSlug, ...rest] = process.argv;
  if (!folder || !genreSlug) {
    console.error("Nutzung: node scripts/backfill-cli.js <Ordner> <Genre-Slug> [--url=https://overhertz.app/index.html]");
    process.exit(1);
  }
  if (!fs.existsSync(folder) || !fs.statSync(folder).isDirectory()) {
    console.error(`Ordner nicht gefunden: ${folder}`);
    process.exit(1);
  }
  const urlArg = rest.find((a) => a.startsWith("--url="));
  const siteUrl = urlArg ? urlArg.slice("--url=".length) : DEFAULT_URL;
  const workerUrlArg = rest.find((a) => a.startsWith("--worker-url="));
  const workerUrlOverride = workerUrlArg ? workerUrlArg.slice("--worker-url=".length) : null;

  const entries = fs.readdirSync(folder).filter((f) => AUDIO_EXTENSIONS.has(path.extname(f).toLowerCase()));
  if (entries.length === 0) {
    console.error(`Keine Audiodateien in ${folder} gefunden (unterstuetzt: ${[...AUDIO_EXTENSIONS].join(", ")}).`);
    process.exit(1);
  }
  console.log(`${entries.length} Datei(en) gefunden, Genre: "${genreSlug}", Seite: ${siteUrl}\n`);

  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on("pageerror", (e) => console.error("Seiten-Fehler:", e.message));
  await page.goto(siteUrl, { waitUntil: "networkidle" });

  const workerBase = workerUrlOverride || (await page.evaluate(() => WORKER_BASE));

  let ok = 0;
  let failed = 0;

  for (const fileName of entries) {
    const filePath = path.join(folder, fileName);
    try {
      const fileBuffer = fs.readFileSync(filePath);
      const base64 = fileBuffer.toString("base64");
      const ext = path.extname(fileName).slice(1).toLowerCase();

      // Laeuft komplett im Browser-Kontext, ruft dieselben Funktionen auf, die auch beim echten
      // Upload im Browser laufen (analyzeAudioBuffer, parseWavBitDepth) - keine zweite Implementierung.
      const metrics = await page.evaluate(
        async ({ base64, ext }) => {
          const bin = atob(base64);
          const bytes = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
          const ctx = new (window.AudioContext || window.webkitAudioContext)();
          const audioBuffer = await ctx.decodeAudioData(bytes.buffer.slice(0));
          const audioMetrics = analyzeAudioBuffer(audioBuffer);
          const bitDepth = ext === "wav" ? parseWavBitDepth(bytes.buffer) : null;
          ctx.close();
          return {
            bandPercents: audioMetrics.bandPercents,
            loudnessDb: audioMetrics.loudnessDb,
            truePeakDb: audioMetrics.truePeakDb,
            crestFactorDb: audioMetrics.crestFactorDb,
            phaseCorrelation: audioMetrics.phaseCorrelation,
            introSilenceMs: audioMetrics.introSilenceMs,
            outroEndsAbruptly: audioMetrics.outroEndsAbruptly,
            duration: audioMetrics.duration,
            sampleRate: audioMetrics.sampleRate,
            bitDepth,
          };
        },
        { base64, ext }
      );

      const res = await fetch(workerBase + "track-metrics", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ genreSlug, isSeed: true, metrics }),
      });
      if (!res.ok) throw new Error(`Worker antwortete ${res.status}`);
      ok++;
      console.log(`OK      ${fileName}`);
    } catch (err) {
      failed++;
      console.error(`FEHLER  ${fileName}: ${err.message}`);
    }
  }

  await browser.close();
  console.log(`\nFertig: ${ok} erfolgreich, ${failed} fehlgeschlagen.`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error("Unerwarteter Fehler:", err);
  process.exit(1);
});
