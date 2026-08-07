#!/usr/bin/env bash
# Fuehrt die komplette Pipeline einmal end-to-end am Beispiel-Rundgang aus - guter erster Test,
# ob alles installiert/verkabelt ist, bevor man ein eigenes Storyboard/Script schreibt.
set -euo pipefail
cd "$(dirname "$0")"
source .venv/bin/activate 2>/dev/null || { echo "Erst Setup laut README ausfuehren (venv fehlt)."; exit 1; }

./make-test-audio.sh
node record.mjs --storyboard storyboard.example.json --out out/raw
RAW=$(ls out/raw/*.webm | head -1)

python3 cut.py --mode steps --in "$RAW" --steps out/raw/steps.json --out out/cut.mp4 --max-gap 1.2
python3 voiceover.py --script script.example.json --out out/voiceover
python3 caption.py --from-manifest out/voiceover/manifest.json --out out/captions.srt
python3 assemble.py --video out/cut.mp4 --voiceover-dir out/voiceover --captions out/captions.srt --title "Overhertz" --out out/final.mp4

echo ""
echo "Fertig: out/final.mp4"
