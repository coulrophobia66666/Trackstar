# Video-Pipeline (eigenes Werkzeug, kein Teil von Overhertz)

Automatisiert alles rund um Produktvideos: nimmt den Overhertz-Screen-Flow per
Browser-Automation auf, schneidet Leerlauf raus, vertont mit einer Stimme (ElevenLabs/Piper/
espeak), brennt Untertitel ein, schneidet Hochkant-Shorts daraus und erzeugt Thumbnails.
Funktioniert genauso mit einem bereits vorhandenen, hochgeladenen Video statt einer eigenen
Aufnahme. Ein lokales Web-Dashboard (`web/`) steuert alle Schritte über eine Oberfläche statt
über einzelne Kommandozeilen-Aufrufe.

Kein Teil des Produkts/Repos-Deploys, deshalb eigenständig hier unter `tools/` und ohne Einfluss
auf `website/`/`worker/`.

Standardmäßig lokal auf dem eigenen Rechner gedacht (`npm run dashboard`). Für dauerhaften
Zugriff über eine echte URL (statt `localhost`) siehe **[DEPLOY.md](./DEPLOY.md)** - eigener
kleiner Server nötig, läuft nicht auf Cloudflare wie der Rest von Overhertz.

## Der einfachste Weg: nur Bild + Musik + Part

Zielbild dieses Werkzeugs: **Bild hochladen (optional), Musik hochladen, gewünschten Ausschnitt
angeben – fertig.** Das übernimmt `music-short.py` (bzw. der erste Abschnitt im Dashboard):

```bash
python3 music-short.py --audio track.mp3 --start 32 --end 47 --out out/shorts/hook.mp4
# mit Cover-Bild (sanfter Ken-Burns-Zoom) statt automatisch generierter Wellenform:
python3 music-short.py --audio track.mp3 --start 32 --end 47 --image cover.jpg --title "Songtitel" --out out/shorts/hook.mp4
```

Kein Bild nötig – ohne `--image` erzeugt das Skript eine animierte Wellenform direkt aus der
Musik als Hintergrund, sodass ein Short immer entsteht, auch ganz ohne Artwork. Alles andere in
diesem Werkzeug (Screen-Aufnahme, Schnitt per Zeitstempel, Untertitel aus einer echten Sprachspur
usw.) bleibt für die aufwendigeren Produktpräsentationsvideos bestehen.

## Dashboard (empfohlener Einstieg)

```bash
cd tools/video-pipeline
npm run dashboard        # http://127.0.0.1:5177 öffnen
```

Ganz oben im Dashboard steht der **Medien-Trimmer**: Datei laden, im eingebauten Player
abspielen/spulen, an der gewünschten Stelle "Start hier setzen"/"Ende hier setzen" klicken (wie
Ein-/Auspunkte in einem Schnittprogramm) – dann per Klick direkt in die Shorts-, Musik-Short-
oder Schneiden-Sektion übernehmen, statt Sekundenzahlen zu schätzen und von Hand einzutippen.
Das ist bewusst manuell/visuell gehalten, als Ergänzung zu den automatischen Schritten.

Seitenleiste mit Schnellstart (Trimmer, Musik-Short, Bild-Generator), den sieben
Pipeline-Schritten (Aufnahme, Schnitt, Voiceover, Untertitel, Zusammensetzen, Shorts, Thumbnail)
und der Dateiverwaltung – jede Sektion eine eigene Seite statt einer langen Scroll-Liste,
Job-Log live im Browser, Dateiliste mit Vorschaubildern (Bilder als echtes Thumbnail,
Videos/Audio/Untertitel als Icon). Läuft nur lokal (127.0.0.1),
kein Deploy. Alle Skripte sind trotzdem einzeln über die Kommandozeile nutzbar (siehe unten) –
das Dashboard ruft im Hintergrund genau dieselben Skripte auf.

## Ablauf

```
record.mjs  --------->  cut.py  --------->  assemble.py  --------->  final.mp4
(Playwright,             (Leerlauf              ^                        |
 Screen-Video)            raus)                 |                        v
                                          voiceover.py -> caption.py   shorts.py / thumbnail.py
                                          (Stimme)       (.srt)        (Shorts / Thumbnails)
```

1. **`record.mjs`** – steuert Chromium automatisiert durch einen Rundgang (definiert in einer
   Storyboard-JSON, siehe `storyboard.example.json`) und nimmt das als Video auf. Alternativ:
   eigenes, bereits vorhandenes Video direkt bei Schritt 2 einsteigen.
2. **`cut.py`** – kürzt Leerlauf raus. `--mode steps` nutzt die von `record.mjs` geloggten
   Zeitstempel (präzise, für eigene Aufnahmen). `--mode silence` erkennt Stille generisch per
   ffmpeg (für fremde/hochgeladene Videos mit Sprachspur). Schreibt bei `--mode steps` zusätzlich
   eine `*.steps-timing.json` neben die Ausgabedatei: darin steht, wo jeder mit `"voiceover"`
   markierte Storyboard-Schritt im geschnittenen Video jetzt tatsächlich liegt (Schnitte
   verschieben ja die Position gegenüber dem Rohvideo). Diese Datei per `--step-timing` an
   `caption.py --from-manifest` und `assemble.py` weiterreichen, sonst laufen Vertonung/Untertitel
   und Bild bei mehreren kurzen Momenten kurz hintereinander (z. B. Listicle-Videos) auseinander –
   die Storyboard- und Voiceover-Timings sind sonst zwei unabhängige Zeitleisten, die nur zufällig
   ungefähr synchron sind.
3. **`voiceover.py`** – vertont ein Sprecherscript (`script.example.json`: Liste von
   `{id, text}`) als Voiceover-Schnipsel + `manifest.json` mit exakten Zeiten. Drei Engines,
   automatisch die beste verfügbare (siehe unten). Bei mehreren kurz getakteten Momenten
   (Listicle-Storyboards) die `waitMs`-Haltezeiten im Storyboard an die tatsächliche Sprechdauer
   je Segment anlehnen (aus dem Voiceover-Manifest ablesen) – sonst überlappen sich die Sätze
   beim Zusammenmischen in `assemble.py`.
4. **`caption.py`** – Untertitel als `.srt`. Entweder exakt aus dem Voiceover-Manifest
   (`--from-manifest`) oder per Spracherkennung aus einer echten Tonspur (`--from-audio`, für
   hochgeladene Videos mit eigener Stimme statt TTS).
5. **`assemble.py`** – setzt alles zu einem MP4 zusammen: Video + Voiceover-Ton + eingebrannte
   Untertitel + optionale Titelkarte. Das ist das fertige Präsentationsvideo.
6. **`shorts.py`** – schneidet aus einem fertigen Video Hochkant-Clips (1080×1920,
   TikTok/Reels/Shorts-Format, mit weichgezeichnetem Hintergrund statt schwarzen Rändern).
   Entweder ein einzelner Ausschnitt (`--start`/`--end`) oder automatisch in N-Sekunden-Häppchen
   zerlegt (`--auto-split`) als schnelle erste Auswahl an Short-Kandidaten.
7. **`thumbnail.py`** – greift einen Frame aus einem Video und legt fetten Titeltext mit
   lesbarem Verlaufsbalken drüber, in 16:9 (YouTube) und optional 9:16 (Shorts-Cover).
8. **`music-short.py`** – eigener, kürzerer Pfad ohne Video als Ausgangspunkt: nur Musik (+
   optionales Bild) + gewählter Ausschnitt → fertiger Hochkant-Short. Siehe Abschnitt oben.
9. **`imagegen.py`** – lokale KI-Bildgenerierung (Cover/Hintergründe/Thumbnail-Motive) aus einem
   Text-Prompt, unabhängig vom restlichen Video-Ablauf. Siehe eigener Abschnitt unten.

`demo.sh` führt Schritte 1–5 einmal am Beispiel-Rundgang aus (guter erster Test).

## Lokale KI-Bildgenerierung (`imagegen.py`)

Erzeugt Bilder aus einem Text-Prompt – lokal, offline, ohne API-Key/Tokens/Kontingent-Grenzen.
Bewusst kein Cloud-Dienst (Midjourney/DALL-E/etc.): kein Secret nötig, keine Kosten pro Bild –
dafür ohne GPU spürbar langsam und mit dem Qualitätsniveau eines kleinen, offline-tauglichen
Modells statt eines State-of-the-Art-Riesen.

```bash
python3 imagegen.py --prompt "warmes Bokeh-Licht, dunkle Bühne, Vinyl-Schallplatte" --out out/images/cover.png
```

Auch im Dashboard nutzbar (Sektion "Bild-Generator").

**Setup** (zusätzlich zum Einmaligen Setup unten, separat weil groß):

```bash
source .venv/bin/activate
pip install --index-url https://download.pytorch.org/whl/cpu torch   # CPU-Variante, keine CUDA-Bloat
pip install -r requirements-imagegen.txt
```

**Modell:** Standardmäßig `OFA-Sys/small-stable-diffusion-v0` (Apache-2.0, kommerziell
unbedenklich nutzbar) – ein auf halbe Größe destilliertes Stable-Diffusion-1.5-Derivat, damit auf
einer CPU überhaupt in vertretbarer Zeit nutzbar. Bewusst *nicht standardmäßig*
`stabilityai/sd-turbo`/`sdxl-turbo`: die wären schneller, stehen aber unter Stability AIs
nicht-kommerzieller Community-Lizenz – ungeeignet, sobald ein generiertes Bild in echtem
Marketing-Material landen könnte. Zum Vergleichen trotzdem nutzbar: `--model
stabilityai/sd-turbo` (CLI) oder im Dashboard über die Modell-Auswahl im Bild-Generator, dort mit
deutlichem Lizenz-Hinweis (nur zum Testen von Geschwindigkeit/Qualität, Ergebnisse nicht
kommerziell verwenden). Auch ein frei eingetragenes anderes Modell ist möglich – Lizenz dann
selbst prüfen.

**Performance-Realität ohne GPU:** grob 1–5 Minuten pro Bild auf einer 2-vCPU-Maschine wie dem in
`DEPLOY.md` beschriebenen Server, stark abhängig von `--steps`/`--width`/`--height`. Attention-
und VAE-Slicing sind fest aktiv, um mit wenig RAM auszukommen (Zielserver hat nur 4GB insgesamt,
geteilt mit Dashboard/ffmpeg/Chromium) – trotzdem lieber ein Bild nach dem anderen erzeugen statt
parallel, sonst OOM-Risiko.

**Nicht getestet in der Sandbox, in der dieses Skript entstanden ist:** `huggingface.co` und
`download.pytorch.org` sind dort per Netzwerk-Policy gesperrt (403) – weder `torch` noch das
Modell selbst ließen sich herunterladen. Geprüft wurde nur, was ohne Download geht: CLI-Argumente
(`--help`), und dass `diffusers` sich importieren lässt und `AutoPipelineForText2Image` wie
erwartet existiert. Der eigentliche Bildgenerierungs-Aufruf ist ungetestet – vor dem ersten
echten Einsatz einmal mit einem einfachen Test-Prompt gegenprüfen.

## Einmaliges Setup

```bash
cd tools/video-pipeline
npm install                                  # Playwright + Dashboard (Express/Multer)
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt              # piper-tts, faster-whisper, requests
```

`ffmpeg` und `espeak-ng` müssen als Systempaket vorhanden sein (`apt install ffmpeg espeak-ng`
bzw. das Äquivalent auf macOS `brew install ffmpeg espeak-ng`).

## Voiceover-Stimme wählen

`voiceover.py --engine auto` (Standard) nimmt automatisch die beste verfügbare Stimme in dieser
Reihenfolge:

1. **ElevenLabs** (`cloud`), falls `ELEVENLABS_API_KEY` gesetzt ist – beste Qualität, kostet
   Zeichen/Minuten je nach ElevenLabs-Tarif.
2. **Piper** (`piper`), falls ein Stimmmodell unter `voices/*.onnx` liegt – kostenlos, offline,
   klingt schon deutlich natürlicher als espeak.
3. **espeak-ng** (`espeak`) – immer verfügbar, kein Download nötig, klingt robotisch. Reiner
   Fallback, damit die Pipeline nie blockiert.

Engine lässt sich auch fest erzwingen: `--engine cloud|piper|espeak`.

### ElevenLabs anbinden

```bash
export ELEVENLABS_API_KEY=dein-key      # NIE in eine Datei, NIE in den Chat schreiben
python3 voiceover.py --script script.example.json --out out/voiceover --engine cloud
```

Der Key wird ausschließlich zur Laufzeit aus der Umgebungsvariable gelesen (`voiceover.py`,
Funktion `synth_cloud`) – landet nirgends im Code oder Git. Stimme per
`ELEVENLABS_VOICE_ID=<id>` wechseln (Standard: "Rachel"), Modell ist `eleven_multilingual_v2`
(gutes Deutsch). Beim Dashboard-Start (`npm run dashboard`) muss die Variable in derselben Shell
gesetzt sein, bevor der Server startet.

### Piper-Stimmmodell besorgen (kostenlose Alternative zu ElevenLabs)

```bash
python3 -m piper.download_voices --download-dir voices de_DE-thorsten-high
```

**Hinweis:** In der Cloud-Sandbox, in der dieses Werkzeug entwickelt wurde, ist `huggingface.co`
per Netzwerk-Policy gesperrt (403) – der Download muss dort einmalig lokal bei dir (oder in einer
Session mit Zugriff auf huggingface.co) laufen. Danach liegt das Modell unter `voices/` und wird
automatisch gefunden. `caption.py --from-audio` (faster-whisper) lädt sein Modell aus demselben
Grund ebenfalls einmalig von dort.

## Eigenen Rundgang aufnehmen

```bash
node record.mjs --storyboard storyboard.example.json --out out/raw
# oder gegen die Live-Seite statt lokal:
node record.mjs --storyboard mein-flow.json --base-url https://overhertz.app --out out/raw
```

Storyboard-Format: Liste von Schritten mit `action` (`goto`, `click`, `fill`, `upload`,
`waitFor`, `waitMs`, `scrollTo`, `highlight`) und optional `voiceover` (Text für die spätere
Vertonung dieses Moments) – siehe `storyboard.example.json`.

**Achtung:** Ein Rundgang, der den echten kostenlosen/kostenpflichtigen KI-Check auslöst, kostet
echte Anthropic-Aufrufe (und bei Fehlbedienung Credits) auf dem Live-Worker – für reine
Testaufnahmen der Pipeline lieber lokal (`--out` ohne `--base-url`) mit einer synthetischen
Testdatei arbeiten (`./make-test-audio.sh`).

## Bereits vorhandenes Video schneiden/vertonen/untertiteln

Ohne `record.mjs` direkt bei Schritt 2 einsteigen:

```bash
python3 cut.py --mode silence --in mein-video.mp4 --out out/cut.mp4
python3 caption.py --from-audio mein-video.mp4 --out out/captions.srt --language de
python3 assemble.py --video out/cut.mp4 --captions out/captions.srt --out out/final.mp4
```

(Ohne `--voiceover-dir` bleibt die Original-Tonspur des Videos erhalten.)

## Shorts aus einem fertigen Video schneiden

```bash
python3 shorts.py --in out/final.mp4 --start 3 --end 13 --captions out/captions.srt --out out/shorts/clip1.mp4
# oder alle 15s ein Häppchen als Kandidat:
python3 shorts.py --in out/final.mp4 --auto-split 15 --out-dir out/shorts
```

## Thumbnail erzeugen

```bash
python3 thumbnail.py --in out/final.mp4 --title "In Sekunden zum Urteil" \
  --subtitle "Overhertz prüft deinen Track" --out out/thumb.png --vertical-out out/thumb-9x16.png
```

## Getestet

Kompletter Durchlauf (`demo.sh`, Schritte 1–5) in dieser Sandbox gegen den echten
`/index.html`-Kurzcheck-Flow verifiziert (Upload, Analyse, Ergebnis) – 18,9s Rohmaterial auf 5,8s
relevante Ausschnitte geschnitten, `espeak-ng`-Voiceover, eingebrannte Untertitel, Titelkarte.
`shorts.py` (Hochkant-Format mit weichgezeichnetem Hintergrund) und `thumbnail.py` (16:9 + 9:16,
Verlaufsbalken + Titeltext) einzeln gegen echtes Ausgabematerial getestet. `music-short.py`
gegen synthetische Testmusik in beiden Varianten getestet (mit Cover-Bild/Ken-Burns-Zoom und ohne
Bild/generierte Wellenform) – dabei einen echten Bug gefunden und gefixt: `ffmpeg`s
`showwaves`-Filter liefert in dieser Umgebung (ffmpeg 6.1.1) bei Hex-Farben und manchen benannten
Farben (u.a. die ursprünglich geplante Markenfarbe) einen falschen, grünstichigen Ton statt der
angegebenen Farbe – verifiziert per Pixelwert-Messung, nicht nur nach Augenmaß. Funktionierender
Fallback: `colors=white` (auch `yellow`/`red` bestätigt korrekt). Das Dashboard (`web/server.mjs`)
wurde für Thumbnail- und Musik-Short-Jobs per echtem HTTP-Aufruf inkl. Datei-Upload end-to-end
verifiziert.

Nicht getestet, weil in dieser Sandbox nicht verfügbar: ElevenLabs (`--engine cloud`, kein Key
vorhanden), Piper mit echtem Stimmmodell (Download von huggingface.co dort blockiert) und
`imagegen.py` (siehe eigener Abschnitt oben – weder `torch` noch das Modell ließen sich laden) –
alle drei Code-Pfade sind vorhanden, aber ungetestet mit echten Zugangsdaten/Modellen. Vor dem
ersten echten Einsatz einmal mit einem kurzen Testscript gegenprüfen.

**Wichtige Einschränkung, per Frame-für-Frame-Kontrolle gefunden:** `cut.py --mode steps`
verlässt sich darauf, dass die von `record.mjs` geloggten Zeitstempel (`steps.json`) linear der
tatsächlichen Videolänge entsprechen. Bei kurzen Rundgängen (wie dem Beispiel-Storyboard oben)
stimmt das ausreichend. Bei längeren, mehrszenigen Rundgängen (viele `scrollTo`/`waitMs`-Schritte)
kann die reale Aufnahme in dieser Sandbox spürbar kürzer ausfallen als die Summe der
Schritt-Zeitstempel (beobachtet: 26,7s protokollierte Aktionen, nur 14,7s tatsächliches Video) –
vermutlich, weil Playwrights Bildschirmaufnahme bei ruhigen Wartemomenten kaum neue Frames
erzeugt. Weil `cut.py` Zeitstempel jenseits der echten Videolänge hart auf deren Ende kappt,
kollabieren dann mehrere spätere Szenen auf denselben Punkt – der Schnitt wird unbrauchbar
(einzeln per `ffprobe`/Frame-Extraktion verifiziert, nicht nur vermutet). Workaround für
längere Rundgänge: `cut.py` überspringen und die Rohaufnahme direkt (ungeschnitten) verwenden,
oder auf einem Rechner ohne diese Aufnahme-Eigenheit testen, bevor man sich auf `--mode steps`
verlässt. Ursache nicht abschließend behoben, nur umgangen.

Dashboard-Restyle (Seitenleiste mit Einzelseiten statt einer langen Scroll-Liste, Vorschaubilder
in der Dateiliste, neue "Bild-Generator"-Sektion) per Playwright gegen den laufenden
`web/server.mjs` verifiziert: alle Navigationspunkte zeigen die richtige Seite (auch mobile
Seitenleiste mit Menü-Button), bestehende Formulare senden weiterhin dieselben Felder wie vorher,
keine Konsolen-/Ladefehler. Live-Video-Frames als Thumbnail (`<video>`-Element mit
Zeitstempel-Fragment) erwiesen sich als zu unzuverlässig (mal schwarzes Rechteck statt Frame,
abhängig vom Rendering-Timing) – stattdessen ein festes Icon für Videos, echte Thumbnails nur für
Bilddateien.
