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


def synth_cloud(text, out_wav: Path):
    # Hier eine Cloud-TTS anbinden (z.B. ElevenLabs/OpenAI). Der Key kommt zur Laufzeit aus einer
    # Umgebungsvariable (z.B. OVERHERTZ_TTS_API_KEY), nie fest im Code oder Chat - siehe
    # Hausregel "Keine Secrets im Code oder Chat" in der Projekt-CLAUDE.md.
    raise NotImplementedError(
        "Keine Cloud-TTS angebunden. API-Key als Umgebungsvariable setzen und hier den "
        "HTTP-Call zum gewaehlten Dienst ergaenzen (z.B. ElevenLabs/OpenAI TTS)."
    )


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
    if engine in ("auto", "piper"):
        voice_model = find_voice_model(Path(args.voices_dir))
        if voice_model:
            from piper import PiperVoice

            piper_voice = PiperVoice.load(str(voice_model))
            engine = "piper"
        elif engine == "piper":
            raise SystemExit(f"Kein Stimmmodell (*.onnx) in {args.voices_dir}/ gefunden - siehe README.")
        else:
            engine = "espeak"

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
