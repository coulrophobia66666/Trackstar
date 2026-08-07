#!/usr/bin/env python3
"""Vertont ein Sprecherscript (script.json: Liste von {id, text}) als Voiceover.

Drei Engines, automatisch die beste verfuegbare:
  1. piper  - neuronale Offline-Stimme (gut genug fuer Produktdemos), braucht ein einmalig
              heruntergeladenes Stimmmodell (siehe README: "Stimmmodell besorgen")
  2. espeak - immer verfuegbar (apt-Paket espeak-ng), klingt robotisch, aber funktioniert
              garantiert ohne jeden externen Download - Fallback, kein Blocker
  3. cloud  - Platzhalter fuer einen bezahlten Dienst (ElevenLabs, OpenAI TTS o.ae.). Absichtlich
              nicht fertig verdrahtet, weil das einen Secret/API-Key braucht (siehe Hausregel:
              keine Secrets im Code) - synth_cloud() zeigt, wo eine Anbindung reinkommt.

Nutzung:
  python3 voiceover.py --script script.example.json --out out/voiceover
  python3 voiceover.py --script script.example.json --out out/voiceover --engine espeak
"""
import argparse
import json
import subprocess
import wave
from pathlib import Path

GAP_S_DEFAULT = 0.6


def synth_piper(voice, text, out_wav: Path):
    with wave.open(str(out_wav), "wb") as wav_file:
        voice.synthesize_wav(text, wav_file)


def synth_espeak(text, out_wav: Path, lang="de"):
    # -s Sprechtempo (Woerter/Minute), etwas langsamer als Default fuer bessere Verstaendlichkeit
    subprocess.run(
        ["espeak-ng", "-v", lang, "-s", "150", "-w", str(out_wav), text],
        check=True,
        capture_output=True,
    )


DEFAULT_ELEVENLABS_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"  # "Rachel" - Startvoreinstellung, per --voice-id/ELEVENLABS_VOICE_ID ersetzbar


def synth_cloud(text, out_wav: Path):
    # ElevenLabs Text-to-Speech. Key kommt ausschliesslich aus der Umgebungsvariable
    # ELEVENLABS_API_KEY - nie fest im Code, nie im Chat eingefuegt (siehe Hausregel "Keine
    # Secrets im Code oder Chat" in der Projekt-CLAUDE.md). Liefert MP3 zurueck, wird fuer
    # den Rest der Pipeline (erwartet WAV fuer Laengenmessung/Mischen) direkt umgewandelt.
    import os
    import requests

    api_key = os.environ.get("ELEVENLABS_API_KEY")
    if not api_key:
        raise SystemExit(
            "ELEVENLABS_API_KEY ist nicht gesetzt. Vor dem Aufruf z.B.:\n"
            "  export ELEVENLABS_API_KEY=dein-key\n"
            "(nie in eine Datei oder den Chat schreiben - nur als lokale Umgebungsvariable)."
        )
    voice_id = os.environ.get("ELEVENLABS_VOICE_ID", DEFAULT_ELEVENLABS_VOICE_ID)

    resp = requests.post(
        f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}",
        headers={"xi-api-key": api_key, "content-type": "application/json"},
        json={
            "text": text,
            "model_id": "eleven_multilingual_v2",
            "voice_settings": {"stability": 0.5, "similarity_boost": 0.75},
        },
        timeout=60,
    )
    if resp.status_code != 200:
        raise RuntimeError(f"ElevenLabs-Fehler {resp.status_code}: {resp.text[:300]}")

    mp3_path = out_wav.with_suffix(".mp3")
    mp3_path.write_bytes(resp.content)
    subprocess.run(
        ["ffmpeg", "-y", "-i", str(mp3_path), "-ar", "44100", "-ac", "1", str(out_wav)],
        check=True, capture_output=True,
    )
    mp3_path.unlink()


def wav_duration_s(path: Path) -> float:
    with wave.open(str(path), "rb") as wav_file:
        return wav_file.getnframes() / wav_file.getframerate()


def find_voice_model(voices_dir: Path):
    matches = sorted(voices_dir.glob("*.onnx"))
    return matches[0] if matches else None


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--script", required=True, help="JSON-Datei mit [{id, text}, ...]")
    parser.add_argument("--out", required=True, help="Zielordner fuer die WAV-Dateien")
    parser.add_argument("--voices-dir", default="voices", help="Ordner mit Piper-Stimmmodellen (*.onnx)")
    parser.add_argument("--engine", choices=["auto", "piper", "espeak", "cloud"], default="auto")
    parser.add_argument("--gap", type=float, default=GAP_S_DEFAULT, help="Stille zwischen Segmenten (s)")
    args = parser.parse_args()

    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)
    segments = json.loads(Path(args.script).read_text(encoding="utf-8"))

    engine = args.engine
    piper_voice = None
    if engine == "auto":
        # Qualitaets-Rangfolge, wenn nichts explizit gewaehlt wurde: ElevenLabs (falls Key
        # gesetzt) vor Piper (falls Stimmmodell vorhanden) vor espeak-ng (immer verfuegbar).
        import os

        if os.environ.get("ELEVENLABS_API_KEY"):
            engine = "cloud"
        elif find_voice_model(Path(args.voices_dir)):
            engine = "piper"
        else:
            engine = "espeak"

    if engine == "piper":
        voice_model = find_voice_model(Path(args.voices_dir))
        if not voice_model:
            raise SystemExit(f"Kein Stimmmodell (*.onnx) in {args.voices_dir}/ gefunden - siehe README.")
        from piper import PiperVoice

        piper_voice = PiperVoice.load(str(voice_model))

    print(f"[voiceover] Engine: {engine}")

    manifest = []
    cursor_s = 0.0
    for seg in segments:
        seg_id = seg["id"]
        text = seg["text"]
        out_wav = out_dir / f"{seg_id}.wav"

        if engine == "piper":
            synth_piper(piper_voice, text, out_wav)
        elif engine == "espeak":
            synth_espeak(text, out_wav)
        elif engine == "cloud":
            synth_cloud(text, out_wav)

        duration = wav_duration_s(out_wav)
        manifest.append({
            "id": seg_id,
            "text": text,
            "file": str(out_wav),
            "start_s": round(cursor_s, 3),
            "duration_s": round(duration, 3),
        })
        cursor_s += duration + args.gap
        print(f"  {seg_id}: {duration:.2f}s  \"{text[:60]}\"")

    manifest_path = out_dir / "manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\n[voiceover] Manifest: {manifest_path}  (Gesamtlaenge ~{cursor_s:.1f}s)")


if __name__ == "__main__":
    main()
