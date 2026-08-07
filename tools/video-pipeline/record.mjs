#!/usr/bin/env node
// Nimmt einen gefuehrten Rundgang durch eine Website als Bildschirmvideo auf (Playwright
// Chromium, kein echter Bildschirm noetig - funktioniert auch headless in der Cloud-Session).
// Steuerung ueber eine Storyboard-JSON-Datei statt Hardcoding, damit sich neue Demos ohne
// Codeaenderung bauen lassen (siehe storyboard.example.json).
//
// Nutzung:
//   node record.mjs --storyboard storyboard.example.json --out out/raw
//   node record.mjs --storyboard mein-flow.json --base-url https://overhertz.app
//
// Ohne --base-url wird website/ aus dem Repo lokal per einfachem Static-Server ausgeliefert -
// so kostet eine Testaufnahme keine echten Anthropic-/Stripe-Aufrufe an die Live-Worker-URL,
// solange das Storyboard keinen echten KI-Check ausloest.

import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createReadStream, existsSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../..");
const WEBSITE_DIR = path.join(REPO_ROOT, "website");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
};

function parseArgs(argv) {
  const args = { out: "out/raw", width: 1280, height: 800 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--storyboard") args.storyboard = argv[++i];
    else if (a === "--out") args.out = argv[++i];
    else if (a === "--base-url") args.baseUrl = argv[++i];
    else if (a === "--width") args.width = Number(argv[++i]);
    else if (a === "--height") args.height = Number(argv[++i]);
  }
  if (!args.storyboard) {
    console.error("Fehlt: --storyboard <datei.json>");
    process.exit(1);
  }
  return args;
}

// Minimaler Static-Server nur fuer die lokale Testaufnahme - website/ hat keinen Build-Step,
// die Dateien koennen direkt ausgeliefert werden.
function serveWebsite(port) {
  return new Promise((resolve) => {
    const server = createServer((req, res) => {
      let reqPath = decodeURIComponent(req.url.split("?")[0]);
      if (reqPath === "/") reqPath = "/index.html";
      const filePath = path.join(WEBSITE_DIR, reqPath);
      if (!filePath.startsWith(WEBSITE_DIR) || !existsSync(filePath) || statSync(filePath).isDirectory()) {
        res.writeHead(404);
        res.end("not found");
        return;
      }
      const ext = path.extname(filePath);
      res.writeHead(200, { "content-type": MIME[ext] || "application/octet-stream" });
      createReadStream(filePath).pipe(res);
    });
    server.listen(port, "127.0.0.1", () => resolve(server));
  });
}

// Zeichnet kurz einen pulsierenden Rahmen um ein Element - fuer Produktvideos hilfreich, um
// im Rohmaterial sichtbar zu markieren, worauf die Voiceover-Zeile im naechsten Schnitt zeigt.
async function highlight(page, selector) {
  await page.evaluate((sel) => {
    // Vorherige Hervorhebung(en) zuerst wieder entfernen - sonst bleiben bei mehreren
    // highlight-Schritten hintereinander (z.B. Badge 1 dann Badge 2) beide gleichzeitig
    // markiert, weil das Outline nie zurueckgesetzt wurde.
    document.querySelectorAll("[data-overhertz-highlighted]").forEach((prevEl) => {
      prevEl.style.outline = prevEl.dataset._prevOutline || "";
      prevEl.style.outlineOffset = "";
      delete prevEl.dataset.overhertzHighlighted;
      delete prevEl.dataset._prevOutline;
    });
    const el = document.querySelector(sel);
    if (!el) return;
    el.dataset._prevOutline = el.style.outline;
    el.style.outline = "4px solid #ff5a36";
    el.style.outlineOffset = "3px";
    el.dataset.overhertzHighlighted = "1";
  }, selector);
}

async function runStep(page, step) {
  switch (step.action) {
    case "goto":
      // "networkidle" statt "domcontentloaded" wartet auf echte Ruhe im Netzwerk - auf dieser
      // Seite (Tracking-/CDN-Aufrufe, Service-Worker-Registrierung) nie zuverlaessig der Fall,
      // das erzeugte hier konstant ~13s Totzeit direkt nach dem Laden. Das brachte nicht nur die
      // Aufnahme unnoetig in die Laenge, sondern hat mehrfach Playwrights interne
      // Video-Zeitstempel durcheinandergebracht (aufgezeichnetes Video z.T. nur noch halb so
      // lang wie die echte Sitzung, siehe cut.py-Fix). Einzelne Elemente warten ohnehin explizit
      // per waitFor, das reicht.
      await page.goto(step.url, { waitUntil: "domcontentloaded" });
      break;
    case "click":
      if (step.highlight !== false) await highlight(page, step.selector);
      await page.click(step.selector);
      break;
    case "fill":
      await page.fill(step.selector, step.value);
      break;
    case "upload":
      await page.setInputFiles(step.selector, step.files);
      break;
    case "waitFor":
      await page.waitForSelector(step.selector, { state: step.state || "visible", timeout: step.timeout || 15000 });
      break;
    case "waitMs":
      await page.waitForTimeout(step.ms);
      break;
    case "scrollTo":
      await page.locator(step.selector).scrollIntoViewIfNeeded();
      break;
    case "highlight":
      await highlight(page, step.selector);
      break;
    default:
      throw new Error(`Unbekannte Storyboard-Aktion: ${step.action}`);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const storyboard = JSON.parse(await readFile(args.storyboard, "utf8"));
  await mkdir(args.out, { recursive: true });

  let server;
  let baseUrl = args.baseUrl;
  if (!baseUrl) {
    server = await serveWebsite(4173);
    baseUrl = "http://127.0.0.1:4173";
  }

  // In dieser Sandbox liegt der vorinstallierte Chromium unter einem anderen Pfad/Version als
  // die lokal installierte Playwright-Version erwartet ("playwright install" ist hier geblockt) -
  // deshalb den vorhandenen Browser explizit adressieren, falls vorhanden.
  const bundledChromium = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
  const browser = await chromium.launch(existsSync(bundledChromium) ? { executablePath: bundledChromium } : {});
  const context = await browser.newContext({
    viewport: { width: args.width, height: args.height },
    recordVideo: { dir: args.out, size: { width: args.width, height: args.height } },
  });
  const page = await context.newPage();

  const recordingStart = Date.now();
  const stepLog = [];

  for (const step of storyboard.steps) {
    const url = step.action === "goto" && !step.url.startsWith("http") ? baseUrl + step.url : step.url;
    await runStep(page, { ...step, url });
    stepLog.push({
      id: step.id,
      label: step.label,
      voiceover: step.voiceover || null,
      atMs: Date.now() - recordingStart,
    });
    console.log(`[record] ${step.id}: ${step.label} (${Date.now() - recordingStart}ms)`);
  }

  const video = page.video();
  await context.close();
  await browser.close();
  if (server) server.close();

  const videoPath = video ? await video.path() : null;
  await writeFile(path.join(args.out, "steps.json"), JSON.stringify({ videoPath, steps: stepLog }, null, 2));

  console.log(`\nFertig. Rohvideo: ${videoPath}`);
  console.log(`Schritt-Zeitstempel: ${path.join(args.out, "steps.json")}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
