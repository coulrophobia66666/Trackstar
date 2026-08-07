#!/usr/bin/env python3
"""Schneidet ein Rohvideo automatisch auf ein praesentierbares Mass runter - entfernt Leerlauf,
statt jeden Frame zu behalten. Zwei Modi:

  --mode steps  (fuer Aufnahmen von record.mjs)
      Nutzt die geloggten Schritt-Zeitstempel (steps.json) statt zu raten: jeder Abschnitt
      zwischen zwei Schritten wird auf --max-gap Sekunden gekappt (die lange Wartezeit auf ein
      Ergebnis wird raus-, der Moment der Aenderung aber drinbehalten). Praezise, weil wir genau
      wissen, wann im Video was passiert ist - kein Erraten anhand von Bild-/Audiomerkmalen.

  --mode silence  (fuer beliebige hochgeladene Videos mit Sprachspur)
      Erkennt Stille per ffmpeg silencedetect und schneidet laengere Pausen auf --keep-padding
      Sekunden zusammen. Fuer eigenes Rohmaterial (z.B. eine unbearbeitete Bildschirmaufnahme mit
      Mikro-Kommentar), bei dem lange Denkpausen raus sollen.

Nutzung:
  python3 cut.py --mode steps --in out/raw/xyz.webm --steps out/raw/steps.json --out out/cut.mp4
  python3 cut.py --mode silence --in mein-hochgeladenes-video.mp4 --out out/cut.mp4
"""
import argparse
import json
import re
import subprocess
import tempfile
from pathlib import Path

FFMPEG = "ffmpeg"


def ffprobe_duration(path: Path) -> float:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
        capture_output=True, text=True, check=True,
    )
    return float(out.stdout.strip())


def segments_from_steps(steps_path: Path, total_duration: float, max_gap: float, min_gap: float = 0.15):
    data = json.loads(steps_path.read_text(encoding="utf-8"))
    boundaries = [0.0] + [s["atMs"] / 1000 for s in data["steps"]] + [total_duration]
    boundaries = sorted(set(boundaries))

    segments = []
    for start, end in zip(boundaries, boundaries[1:]):
        gap = end - start
        if gap <= min_gap:
            continue
        # Bei langen Pausen nur das Ende behalten (den Moment kurz vor der naechsten Aktion/dem
        # Ergebnis) - der Anfang der Wartezeit traegt nichts zur Praesentation bei.
        kept_start = start if gap <= max_gap else end - max_gap
        segments.append((kept_start, end))
    return segments


def segments_from_silence(input_path: Path, silence_db: float, min_silence: float, keep_padding: float, total_duration: float):
    proc = subprocess.run(
        [FFMPEG, "-i", str(input_path), "-af", f"silencedetect=noise={silence_db}dB:d={min_silence}", "-f", "null", "-"],
        capture_output=True, text=True,
    )
    log = proc.stderr
    silences = []
    starts = [float(m) for m in re.findall(r"silence_start:\s*([\d.]+)", log)]
    ends = [float(m) for m in re.findall(r"silence_end:\s*([\d.]+)", log)]
    for s, e in zip(starts, ends):
        silences.append((s, e))

    # In Sprachabschnitte umdrehen: alles ausserhalb der (verkuerzten) Stille-Fenster behalten.
    segments = []
    cursor = 0.0
    for s, e in silences:
        keep_end = min(s + keep_padding, e)
        if keep_end > cursor:
            segments.append((cursor, keep_end))
        cursor = max(cursor, e - keep_padding)
    if cursor < total_duration:
        segments.append((cursor, total_duration))
    return segments


def cut_and_concat(input_path: Path, segments, out_path: Path):
    with tempfile.TemporaryDirectory() as tmp:
        tmp = Path(tmp)
        list_file = tmp / "concat.txt"
        parts = []
        for i, (start, end) in enumerate(segments):
            part = tmp / f"part{i:03d}.mp4"
            duration = max(end - start, 0.05)
            subprocess.run(
                [FFMPEG, "-y", "-ss", f"{start:.3f}", "-i", str(input_path), "-t", f"{duration:.3f}",
                 "-c:v", "libx264", "-preset", "veryfast", "-pix_fmt", "yuv420p", "-an", str(part)],
                check=True, capture_output=True,
            )
            parts.append(part)
        list_file.write_text("\n".join(f"file '{p}'" for p in parts), encoding="utf-8")
        out_path.parent.mkdir(parents=True, exist_ok=True)
        subprocess.run(
            [FFMPEG, "-y", "-f", "concat", "-safe", "0", "-i", str(list_file), "-c", "copy", str(out_path)],
            check=True, capture_output=True,
        )


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", choices=["steps", "silence"], required=True)
    parser.add_argument("--in", dest="input", required=True)
    parser.add_argument("--out", required=True)
    parser.add_argument("--steps", help="steps.json von record.mjs (fuer --mode steps)")
    parser.add_argument("--max-gap", type=float, default=1.2, help="max. Sekunden Wartezeit pro Abschnitt (--mode steps)")
    parser.add_argument("--silence-db", type=float, default=-30.0, help="Stille-Schwelle in dB (--mode silence)")
    parser.add_argument("--min-silence", type=float, default=1.0, help="min. Stille-Dauer in s (--mode silence)")
    parser.add_argument("--keep-padding", type=float, default=0.3, help="Rest-Stille an Schnittkanten in s (--mode silence)")
    args = parser.parse_args()

    input_path = Path(args.input)
    total_duration = ffprobe_duration(input_path)

    if args.mode == "steps":
        if not args.steps:
            raise SystemExit("--mode steps braucht --steps steps.json")
        segments = segments_from_steps(Path(args.steps), total_duration, args.max_gap)
    else:
        segments = segments_from_silence(input_path, args.silence_db, args.min_silence, args.keep_padding, total_duration)

    if not segments:
        raise SystemExit("Keine Segmente zum Behalten gefunden - Schwellenwerte pruefen.")

    kept = sum(e - s for s, e in segments)
    print(f"[cut] {len(segments)} Segmente, {kept:.1f}s von {total_duration:.1f}s behalten")
    cut_and_concat(input_path, segments, Path(args.out))
    print(f"[cut] -> {args.out}")


if __name__ == "__main__":
    main()
