# Video-Pipeline (eigenes Werkzeug, kein Teil von Overhertz)

Automatisiert Produktvideos: nimmt den Overhertz-Screen-Flow per Browser-Automation auf,
schneidet Leerlauf raus, vertont mit einer Stimme und brennt Untertitel ein. Funktioniert
genauso mit einem bereits vorhandenen, hochgeladenen Video statt einer eigenen Aufnahme.

Kein Teil des Produkts/Repos-Deploys, deshalb eigenständig hier unter `tools/` und ohne Einfluss
auf `website/`/`worker/`.

## Ablauf

```
record.mjs  --------->  cut.py  --------->  assemble.py  --------->  final.mp4
(Playwright,             (Leerlauf              ^
 Screen-Video)            raus)                 |
                                          voiceover.py -> caption.py
                                          (Stimme)       (.srt)
```

1. **`record.mjs`** – steuert Chromium automatisiert durch einen Rundgang (definiert in einer
   Storyboard-JSON, siehe `storyboard.example.json`) und nimmt das als Video auf. Alternativ:
   eigenes, bereits vorhandenes Video direkt bei Schritt 2 einsteigen.
2. **`cut.py`** – kürzt Leerlauf raus. `--mode steps` nutzt die von `record.mjs` geloggten
   Zeitstempel (präzise, für eigene Aufnahmen). `--mode silence` erkennt Stille generisch per
   ffmpeg (für fremde/hochgeladene Videos mit Sprachspur).
3. **`voiceover.py`** – vertont ein Sprecherscript (`script.example.json`: Liste von
   `{id, text}`) als Voiceover-Schnipsel + `manifest.json` mit exakten Zeiten.
4. **`caption.py`** – Untertitel als `.srt`. Entweder exakt aus dem Voiceover-Manifest
   (`--from-manifest`) oder per Spracherkennung aus einer echten Tonspur (`--from-audio`, für
   hochgeladene Videos mit eigener Stimme statt TTS).
5. **`assemble.py`** – setzt alles zu einem MP4 zusammen: Video + Voiceover-Ton + eingebrannte
   Untertitel + optionale Titelkarte.

`demo.sh` führt den kompletten Ablauf einmal am Beispiel-Rundgang aus (guter erster Test).

## Einmaliges Setup

```bash
cd tools/video-pipeline
npm install                                  # Playwright (Aufnahme)
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt              # piper-tts, faster-whisper
```

`ffmpeg` und `espeak-ng` müssen als Systempaket vorhanden sein (`apt install ffmpeg espeak-ng`
bzw. das Äquivalent auf macOS `brew install ffmpeg espeak-ng`).

### Stimmmodell besorgen (für gute Sprachqualität)

Ohne Stimmmodell fällt `voiceover.py` automatisch auf `espeak-ng` zurück (funktioniert immer,
klingt aber robotisch). Für eine natürlich klingende Stimme einmalig ein Piper-Modell laden:

```bash
python3 -m piper.download_voices --download-dir voices de_DE-thorsten-high
```

**Hinweis:** In der Cloud-Sandbox, in der dieses Werkzeug entwickelt wurde, ist `huggingface.co`
per Netzwerk-Policy gesperrt (403) – der Download muss dort einmalig lokal bei dir (oder in einer
Session mit Zugriff auf huggingface.co) laufen. Danach liegt das Modell einfach unter `voices/`
und wird von `voiceover.py`/`caption.py --from-audio` automatisch gefunden. `caption.py
--from-audio` (faster-whisper) lädt sein Modell aus demselben Grund ebenfalls einmalig von dort.

### Auf eine Cloud-Stimme umsteigen (optional, bessere Qualität)

`voiceover.py --engine cloud` ruft `synth_cloud()` auf – bewusst nicht fertig verdrahtet, weil
das einen API-Key braucht. Bei Bedarf dort den HTTP-Call zu einem Dienst (z. B. ElevenLabs,
OpenAI TTS) ergänzen; der Key kommt zur Laufzeit aus einer Umgebungsvariable, nie fest im Code
oder Chat (siehe Hausregel "Keine Secrets im Code oder Chat" in der Projekt-`CLAUDE.md`).

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

## Getestet

Kompletter Durchlauf (`demo.sh`) in dieser Sandbox erfolgreich verifiziert: Aufnahme des echten
`/index.html`-Kurzcheck-Flows (Upload, Analyse, Ergebnis), automatischer Schnitt (18,9s Rohmaterial
auf 5,8s relevante Ausschnitte), `espeak-ng`-Voiceover, eingebrannte Untertitel, Titelkarte - alles
im finalen `out/final.mp4` sichtbar korrekt. Piper-Stimmmodell und faster-whisper-Modell selbst
noch nicht mit echter Stimme getestet, weil deren Download in dieser Sandbox blockiert ist (siehe
oben) - Code-Pfad ist vorhanden, aber ungetestet mit echtem Modell.
