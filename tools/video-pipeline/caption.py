#!/usr/bin/env python3
"""Erzeugt Untertitel (.srt) fuer ein Produktvideo. Zwei Modi:

  --from-manifest voiceover/manifest.json
      Nimmt Text+Timing direkt aus dem Voiceover-Manifest (voiceover.py) - exakt, weil der
      Text ja bereits bekannt ist, keine Spracherkennung noetig. Fuer selbst erzeugte
      TTS-Voiceovers der Normalfall.

  --from-audio irgendein-hochgeladenes-video.mp4
      Transkribiert eine echte Sprachspur per faster-whisper (laeuft komplett lokal, kein
      Cloud-Call) und erzeugt Untertitel mit den erkannten Zeitstempeln. Fuer bereits
      hochgeladene Videos mit echter Sprecherstimme, die nur noch Untertitel brauchen.

Nutzung:
  python3 caption.py --from-manifest out/voiceover/manifest.json --out out/captions.srt
  python3 caption.py --from-audio mein-video.mp4 --out out/captions.srt --language de
"""
import argparse
import json
from pathlib import Path


def srt_timestamp(seconds: float) -> str:
    ms_total = round(seconds * 1000)
    h, rem = divmod(ms_total, 3_600_000)
    m, rem = divmod(rem, 60_000)
    s, ms = divmod(rem, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def write_srt(cues, out_path: Path):
    lines = []
    for i, (start, end, text) in enumerate(cues, start=1):
        lines.append(str(i))
        lines.append(f"{srt_timestamp(start)} --> {srt_timestamp(end)}")
        lines.append(text.strip())
        lines.append("")
    out_path.write_text("\n".join(lines), encoding="utf-8")


def from_manifest(manifest_path: Path):
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    cues = []
    for seg in manifest:
        start = seg["start_s"]
        end = start + seg["duration_s"]
        cues.append((start, end, seg["text"]))
    return cues


def from_audio(audio_path: Path, language: str, model_size: str):
    from faster_whisper import WhisperModel

    # int8 auf CPU: deutlich schneller als float32, fuer Untertitel-Zwecke kein hoerbarer
    # Genauigkeitsverlust - laeuft ohne GPU in dieser Sandbox in vertretbarer Zeit.
    model = WhisperModel(model_size, device="cpu", compute_type="int8")
    segments, _info = model.transcribe(str(audio_path), language=language, vad_filter=True)
    return [(seg.start, seg.end, seg.text) for seg in segments]


def main():
    parser = argparse.ArgumentParser()
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--from-manifest", help="voiceover/manifest.json (exakter Text+Timing)")
    group.add_argument("--from-audio", help="Video/Audio-Datei mit echter Sprachspur")
    parser.add_argument("--out", required=True, help="Ziel-.srt-Datei")
    parser.add_argument("--language", default="de", help="nur fuer --from-audio")
    parser.add_argument("--model-size", default="small", help="Whisper-Modellgroesse (tiny/base/small/medium)")
    args = parser.parse_args()

    if args.from_manifest:
        cues = from_manifest(Path(args.from_manifest))
    else:
        cues = from_audio(Path(args.from_audio), args.language, args.model_size)

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    write_srt(cues, out_path)
    print(f"[caption] {len(cues)} Untertitel-Zeilen -> {out_path}")


if __name__ == "__main__":
    main()
