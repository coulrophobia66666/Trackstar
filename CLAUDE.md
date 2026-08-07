# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Über das Projekt
KI-Songcheck-Tool (Markenname **Overhertz**, Repo/Ordnername noch "Trackstar" –
Umbenennung folgt): Nutzer laden einen Track hoch, bekommen einen kostenlosen
Kurzcheck (Ampel-Urteil, größtes Problem – ohne Lösung) und schalten mit
Credits (5 Checks/7€) oder Pro-Abo (9,50€/Monat bzw. 79€/Jahr) die
Tiefenanalyse frei (Frequenzen, Tipps, KI-Einordnung, Titel-Ideen,
Songtext-Verbesserung, Album-Upload).
Bewusst **eigenständig** von Nachtfahrt Records/EZY, bis explizit anders
entschieden – kein Cross-Branding, keine gemeinsamen Inhalte.

## Das Team
| Name | Rolle |
|---|---|
| Finn | Technik & Deploys – Website, Worker, Cloudflare, Bugfixing |
| Carla | Recht & Datenschutz – Impressum, DSGVO, AGB |
| Malik | Finanzen & Zahlungen – Stripe, Preisgestaltung, Kosten |
| Pia | Wachstum & Markt – Positionierung, Konkurrenz, Sprachen/Expansion |
| Timo | Qualität & Nutzererfahrung – Testing, Feedback-Kriterien, UX |

Bei größeren Aufgaben kurz sagen, wer "dran" ist (z. B. "Finn hier, deploye
den Fix"), sonst normal antworten – kein Zwang, das bei jeder Kleinigkeit
durchzuziehen.

## Architektur (Big Picture)

Zwei getrennte Cloudflare-Projekte, kein Build-Step, kein `package.json` im
Repo-Root (reines HTML/CSS/JS bzw. ein einzelnes Worker-Script, direkt
deploybar):

```
Browser (website/)                         Cloudflare Worker (worker/)
┌───────────────────────────────┐          ┌─────────────────────────────┐
│ index.html + app.js (~4700 LOC)│  fetch   │ songtext-worker.js (~1300)  │
│ - komplette Audioanalyse läuft │ ───────► │ - Konten/Sessions/Credits   │
│   client-seitig (Web Audio API,│          │ - Stripe Checkout/Webhook   │
│   eigene FFT, Genre-Erkennung, │ ◄─────── │ - Anthropic-Call (SSE) für  │
│   Scoring, EQ-Editor)          │  stream  │   KI-Einordnung/Songtext    │
│ - vocals-worker.js: Whisper    │          │ - Genre-Statistik-Seiten    │
│   (transformers.js) in eigenem │          │   (/check/:slug, SSR)       │
│   Web Worker fürs Transkript   │          │ - D1-Anbindung (Binding DB) │
└───────────────────────────────┘          └─────────────────────────────┘
```

- **`website/`** – statische Seite, deployt über ein an dieses Repo
  angebundenes Cloudflare-Projekt (nicht GitHub Pages – das hat sich bei
  privaten Repos als Sackgasse erwiesen). `wrangler.jsonc` dient nur als
  Assets-Deploy-Config (`assets.directory: "./"`), es gibt keinen
  eigenen Build-Schritt.
  - `app.js` ist die eigentliche Anwendung: gesamte Frequenzanalyse
    (eigene iterative Radix-2-FFT), automatische Genre-Schätzung,
    Scoring/Tipps/Fazit, EQ-Editor (bearbeitet Audio direkt im Browser,
    kein serverseitiges Mastering), Formatcheck, Album-Check, Konto-/
    Credit-/Abo-UI, i18n (DE/EN) – über `/* ---------- Abschnitt
    ---------- */`-Kommentare gegliedert, siehe Datei für die Übersicht
    der Abschnitte.
  - `vocals-worker.js` läuft als separater Web Worker und lädt Whisper
    (`Xenova/whisper-base` via `@huggingface/transformers` vom CDN) für
    die Gesangstranskription – bewusst ausgelagert, damit das
    Modell-Laden/Ausführen den UI-Thread nicht blockiert (spürbar vor
    allem auf dem Handy).
  - `sw.js` ist ein minimaler Service Worker nur für PWA-Installierbarkeit
    (network-first für die App-Shell, fängt keine API-Calls/Stripe/CDN ab).
- **`worker/songtext-worker.js`** – ein einzelner Cloudflare Worker, hält
  Anthropic- und Stripe-Secrets serverseitig, macht KI-Einschätzung,
  Konten/Login, Credits/Abo-Logik und Stripe-Checkout/Webhook. In
  `/* ---------- Abschnitt ---------- */`-Blöcke gegliedert (Helfer, E-Mail,
  Passwörter/PBKDF2, Sessions & Konten, Verlauf, Genre-Rohwerte,
  Genre-Aggregation, Genre-Seiten, Stripe, KI-Einschätzung, Routing ganz
  am Ende in `export default { fetch, scheduled }`).
  - Braucht eine D1-Datenbank (Binding `DB`, Schema in `worker/schema.sql`)
    – siehe OFFENE-PUNKTE.md für die einmaligen manuellen
    Einrichtungsschritte.
  - Nächtlicher Cron-Trigger (`scheduled`-Handler, `wrangler.toml
    [triggers]`, 3 Uhr UTC) berechnet Genre-Kennzahlen aus
    `check_results` neu; manuell zusätzlich über
    `POST /admin/aggregate-genres` anstoßbar (braucht Secret
    `ADMIN_SECRET`).
  - Erwartete Env-Bindings/Secrets (in Cloudflare gesetzt, nie im Code):
    `DB` (D1), `RATE_LIMITER` (Rate-Limiting-Binding), `ANTHROPIC_API_KEY`,
    `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
    `STRIPE_COUPON_CREDITS_UPGRADE`, `RESEND_API_KEY`,
    `RESEND_FROM_EMAIL`, `ADMIN_SECRET`.
  - Routing-Überblick (`fetch`-Handler, jeweils `url.pathname`):
    `/stripe-webhook` (Stripe-seitig, kein CORS/Rate-Limit), `/auth/*`
    (register/login/logout/me/delete-account/request-password-reset/
    reset-password), `/consume-credit`, `/rate-download`,
    `/create-checkout-session`, `/create-portal-session`,
    `/save-check-result`, `/my-checks`, `/check-detail`,
    `/track-metrics` (anonyme Rohwerte für Genre-Statistik),
    `/admin/aggregate-genres`, `/check/:slug` (serverseitig gerenderte
    Genre-Statistikseite), `/sitemap-genres.xml`. Alles ohne eigene Route
    landet auf der Default-Route (POST, IP-ratelimitiert) für die
    Kern-KI-Einschätzung.
- **D1-Schema** (`worker/schema.sql`): `users`, `sessions`,
  `password_resets`, `ratings`, `checks` (kontogebundener Ergebnis-Verlauf,
  keine Audiodatei), `check_results` (anonyme Rohmesswerte pro Check –
  bewusst ohne user_id/Titel, Grundlage für die Genre-Statistikseiten,
  getrennt von der eigentlichen Bewertungslogik gehalten, damit sich
  Referenzwerte nicht selbstreferenziell an Nutzer-Uploads kalibrieren),
  `genre_stats` (vorberechnete Kennzahlen je Genre, nur daraus lesen die
  Genre-Seiten – keine Live-Berechnung pro Aufruf). Änderungen an einer
  bestehenden Tabelle brauchen zusätzlich ein manuelles `ALTER TABLE` in
  der D1-Console (siehe Kommentare in `schema.sql`) – `CREATE TABLE IF
  NOT EXISTS` erfasst keine nachträglich hinzugefügten Spalten.
- **`scripts/backfill-cli.js`** – Node-CLI, die reale Audiodateien gegen
  eine echte Browser-Instanz der Website analysieren lässt (Playwright)
  und die Rohmesswerte als Seed-Daten (`isSeed=true`) an den Worker meldet
  – bewusst keine zweite Analyse-Implementierung in Node, um Abweichungen
  zwischen "was der Kunde sieht" und "was hier gemessen wird"
  auszuschließen. Voraussetzung: `npm install playwright && npx
  playwright install chromium` (einmalig, lokal – keine Repo-Abhängigkeit).
  Aufruf: `node scripts/backfill-cli.js <Ordner> <Genre-Slug>`. Gültige
  Genre-Slugs stehen in `GENRE_PAGE_DEFS` in `worker/songtext-worker.js`.
- **`tools/video-pipeline/`** – eigenständiges Werkzeug (kein Teil des
  Produkts/Deploys) für Produktpräsentationsvideos, Shorts und
  Thumbnails: nimmt den Website-Flow per Playwright als Bildschirmvideo
  auf, schneidet Leerlauf automatisch raus, vertont per TTS (ElevenLabs
  wenn `ELEVENLABS_API_KEY` gesetzt ist, sonst Piper offline, sonst
  Fallback `espeak-ng`), brennt Untertitel ein (`voiceover.py
  --from-manifest` oder `caption.py --from-audio` per faster-whisper für
  bereits hochgeladene Videos mit echter Sprachspur), schneidet daraus
  Hochkant-Shorts (`shorts.py`) und erzeugt Thumbnails (`thumbnail.py`).
  Einfachster Weg für reine Musik-Shorts (Zielbild des Werkzeugs):
  `music-short.py` – nur Musik (+ optionales Cover-Bild, sonst
  automatisch generierte Wellenform) + gewählter Ausschnitt ergibt direkt
  einen fertigen Short, ohne Umweg über ein Video. Lokales Web-Dashboard
  unter `web/` (`npm run dashboard`) steuert alle Schritte über eine
  Oberfläche statt einzelner CLI-Aufrufe. Details/Setup in
  `tools/video-pipeline/README.md`.

## Entwicklung

- Kein Build-Step, kein `npm install` nötig, um an `website/` oder
  `worker/` zu arbeiten. Lokal einfach die Dateien direkt im Browser
  öffnen bzw. mit `wrangler dev` gegen den Worker testen.
- Es gibt kein automatisiertes Test-Setup (kein Test-Runner, kein CI) im
  Repo. Vor jedem "fertig" **manuell im Browser mit Playwright testen**,
  nicht nur auf Codeebene behaupten, dass es funktioniert (siehe
  OFFENE-PUNKTE.md, Abschnitte "Getestet (Playwright, lokal gegen die
  Website-Dateien)" für bisheriges Vorgehen/Beispiele).
- Beide Cloudflare-Projekte ziehen sich den Code automatisch bei jedem
  Push auf `main` – nach jedem Feature-Branch-Commit auch nach `main`
  mergen und pushen, sonst passiert auf Cloudflare nichts.
- Offene Aufgaben, manuelle Einrichtungsschritte und der Verlauf
  vergangener Arbeitsdurchgänge stehen in `OFFENE-PUNKTE.md` – dort zuerst
  nachsehen, bevor man von Null anfängt zu planen.

## Harte Regeln
- **Keine Secrets im Code oder Chat.** API-Keys nur als verschlüsselte
  Cloudflare-Variable, nie in Dateien, nie in Commits.
- **Kein Cross-Branding mit Nachtfahrt Records**, bis der Nutzer das
  ausdrücklich freigibt.
- Preis-/Rechtstexte (`impressum.html`, `datenschutz.html`) enthalten echte
  Kontaktdaten – bei Änderungen an der Datenverarbeitung (neue Dienste,
  neue Zahlungsanbieter) den Datenschutztext mit aktualisieren.
- Vor jedem "fertig" kurz selbst im Browser testen (Playwright), nicht nur
  auf Codeebene behaupten, dass es funktioniert.

## Kommunikation
Kurz, deutsch, direkt. Ehrlich sagen, wenn was (noch) nicht sauber lösbar
ist, statt es zu beschönigen.
