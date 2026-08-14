# Music Declutter

Eigenständiges Werkzeug (kein Teil des Overhertz-Produkts) zum Aufräumen großer Musik-Ordner mit
vielen Versionen/Edits desselben Tracks (z. B. aus KI-Musik-Generatoren) — erkennt per
**Audio-Fingerabdruck**, welche Dateien musikalisch derselbe Aufnahme sind, auch bei komplett
unterschiedlichen Dateinamen. Behält pro erkannter Gruppe nur die zuletzt geänderten Versionen
(Standard: 2), der Rest wird in einen `_zum-Pruefen`-Unterordner verschoben — **nie gelöscht**.

## Wie es funktioniert

- Ohne `--apply`: nur ein Bericht (`report.csv` im Zielordner + Ausgabe im Terminal). Es wird
  nichts verschoben oder verändert.
- Erst mit `--apply` werden die überzähligen Versionen tatsächlich in `<Ordner>/_zum-Pruefen/`
  verschoben. Du kannst diesen Ordner danach selbst durchsehen und leeren, wenn du dem Ergebnis
  vertraust.
- Läuft komplett lokal/offline, kein Internet, kein Account nötig.

**Immer erst ohne `--apply` laufen lassen, das Ergebnis (Terminal-Ausgabe oder `report.csv`)
anschauen, und erst wenn es plausibel aussieht, mit `--apply` wiederholen.**

## Installation auf Android (Termux)

1. **Termux installieren** — nicht aus dem Play Store (dort veraltet), sondern von
   [F-Droid](https://f-droid.org/packages/com.termux/) herunterladen und installieren.
2. Termux öffnen, dann:
   ```
   pkg update
   pkg install python ffmpeg chromaprint
   termux-setup-storage
   ```
   Der letzte Befehl fragt nach der Berechtigung, auf deinen Speicher (Downloads, Musik-Ordner
   etc.) zuzugreifen — bestätigen.
3. Dieses Skript auf dein Tablet bekommen — z. B. `declutter.py` per Browser/Dateien-App
   herunterladen und in Termux verschieben, oder direkt mit `curl`/`git`, falls du es irgendwo
   online ablegst.
4. Deinen Musik-Ordner finden — nach `termux-setup-storage` liegt der gemeinsame Speicher meist
   unter `~/storage/downloads`, `~/storage/music` oder `~/storage/shared/...` (in Termux mit `ls
   ~/storage` nachschauen).

## Installation auf Mac

```
brew install chromaprint
```
(Python ist auf dem Mac meist schon vorhanden - mit `python3 --version` prüfen.)

## Installation auf Windows

1. Python von [python.org](https://www.python.org/downloads/) installieren (Haken bei "Add
   python.exe to PATH" beim Installer setzen).
2. Chromaprint-Release von [acoustid.org/chromaprint](https://acoustid.org/chromaprint)
   herunterladen (enthält `fpcalc.exe`), den Ordner in den PATH aufnehmen oder `fpcalc.exe` in
   denselben Ordner wie `declutter.py` legen.

## Benutzung

```
python3 declutter.py <Ordner>                        Nur Bericht, nichts wird angefasst
python3 declutter.py <Ordner> --apply                 Verschiebt erkannte Dubletten wirklich
python3 declutter.py <Ordner> --keep 3                 Behält 3 statt 2 Versionen pro Gruppe
python3 declutter.py <Ordner> --min-similarity 0.85     Großzügiger gruppieren (Standard: 0.92)
```

Falls zwei tatsächlich unterschiedliche Songs fälschlich in eine Gruppe geraten (zu großzügig),
`--min-similarity` erhöhen (z. B. 0.95) und den Bericht erneut ohne `--apply` laufen lassen.
Falls zwei echte Versionen NICHT als eine Gruppe erkannt werden (zu streng), `--min-similarity`
senken. Erst wenn der Bericht gut aussieht, mit `--apply` wirklich verschieben.

## Hinweis zum Dateiformat

Das Werkzeug sortiert nach Audioinhalt, unabhängig vom Format (WAV/MP3/...). Wenn eine der
behaltenen Versionen kein WAV ist, steht das im Bericht als Hinweis dabei — das Skript konvertiert
nichts automatisch, um nichts verlustbehaftet zu verändern, ohne dass du es siehst.
