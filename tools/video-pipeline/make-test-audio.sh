#!/usr/bin/env bash
# Erzeugt eine kurze synthetische WAV-Datei nur zum Testen der Pipeline (Upload-Feld braucht
# irgendeine Audiodatei) - kein echter Track, keine Aussage ueber Klangqualitaet.
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p sample
ffmpeg -y -f lavfi -i "sine=frequency=220:duration=20" -ar 44100 -ac 2 sample/test-audio.wav
echo "sample/test-audio.wav erzeugt"
