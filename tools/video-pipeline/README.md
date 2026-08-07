# Video-Pipeline (eigenes Werkzeug, kein Teil von Overhertz)

Automatisiert alles rund um Produktvideos: nimmt den Overhertz-Screen-Flow per
Browser-Automation auf, schneidet Leerlauf raus, vertont mit einer Stimme (ElevenLabs/Piper/
espeak), brennt Untertitel ein, schneidet Hochkant-Shorts daraus und erzeugt Thumbnails.
Funktioniert genauso mit einem bereits vorhandenen, hochgeladenen Video statt einer eigenen
Aufnahme. Ein lokales Web-Dashboard (`web/`) steuert alle Schritte über eine Oberfläche statt
über einzelne Kommandozeilen-Aufrufe.

Kein Teil des Produkts/Repos-Deploys, deshalb eigenständig hier unter `tools/` und ohne Einfluss
auf `website/`/`worker/`.

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

Eine Seite mit einem Formular pro Pipeline-Schritt (Aufnahme, Schnitt, Voiceover, Untertitel,
Zusammensetzen, Shorts, Thumbnail), Job-Log live im Browser, Dateiliste mit Downloads. Läuft nur
lokal (127.0.0.1), kein Deploy. Alle Skripte sind trotzdem einzeln über die Kommandozeile nutzbar
(siehe unten) – das Dashboard ruft im Hintergrund genau dieselben Skripte auf.

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
   ffmpeg (für fremde/hochgeladene Videos mit Sprachspur).
3. **`voiceover.py`** – vertont ein Sprecherscript (`script.example.json`: Liste von
   `{id, text}`) als Voiceover-Schnipsel + `manifest.json` mit exakten Zeiten. Drei Engines,
   automatisch die beste verfügbare (siehe unten).
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

`demo.sh` führt Schritte 1–5 einmal am Beispiel-Rundgang aus (guter erster Test).

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
vorhanden) und Piper mit echtem Stimmmodell (Download von huggingface.co dort blockiert) – beide
Code-Pfade sind vorhanden, aber ungetestet mit echten Zugangsdaten/Modellen. Vor dem ersten
echten Einsatz einmal mit einem kurzen Testscript gegenprüfen.
