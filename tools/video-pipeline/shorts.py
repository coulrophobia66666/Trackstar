#!/usr/bin/env python3
"""Schneidet ein (langes) Video in Hochkant-Shorts (1080x1920, TikTok/Reels/YouTube Shorts).

Zwei Betriebsarten:
  --start/--end       Ein einzelner Ausschnitt (ein Short aus dem Video).
  --auto-split N       Zerlegt das ganze Video automatisch in N-Sekunden-Haeppchen - schneller
                        erster Zugriff auf mehrere Short-Kandidaten aus einer Rohaufnahme, statt
                        jeden Ausschnitt einzeln von Hand zu suchen.

Horizontale Quelle wird nicht einfach hart zugeschnitten (verliert Bildinhalt), sondern mittig
scharf eingebettet vor einem weichgezeichneten, formatfuellenden Hintergrund derselben Aufnahme -
uebliches Kurzvideo-Format, kein schwarzer Rand.

Nutzung:
  python3 shorts.py --in out/final.mp4 --start 3 --end 13 --out out/shorts/clip1.mp4
  python3 shorts.py --in out/final.mp4 --auto-split 15 --out-dir out/shorts
  python3 shorts.py --in out/final.mp4 --start 3 --end 13 --captions out/captions.srt --out out/shorts/clip1.mp4
"""
import argparse
import subprocess
from pathlib import Path

FFMPEG = "ffmpeg"
W, H = 1080, 1920


def ffprobe_duration(path: Path) -> float:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
        capture_output=True, text=True, check=True,
    )
    return float(out.stdout.strip())


def vertical_filter(captions_path: str | None) -> str:
    filt = (
        f"[0:v]scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},gblur=sigma=25[bg];"
        f"[0:v]scale={W}:-2[fg];"
        f"[bg][fg]overlay=(W-w)/2:(H-h)/2[merged]"
    )
    if captions_path:
        srt_escaped = str(Path(captions_path).resolve()).replace(":", r"\:")
        filt += f";[merged]subtitles='{srt_escaped}':force_style='FontSize=26,PrimaryColour=&HFFFFFF&,OutlineColour=&H000000&,BorderStyle=1'[out]"
        out_label = "[out]"
    else:
        out_label = "[merged]"
    return filt, out_label


def cut_short(input_path: Path, start: float, end: float, captions: str | None, out_path: Path):
    filt, out_label = vertical_filter(captions)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        [FFMPEG, "-y", "-ss", f"{start:.3f}", "-to", f"{end:.3f}", "-i", str(input_path),
         "-filter_complex", filt, "-map", out_label, "-map", "0:a?",
         "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", str(out_path)],
        check=True, capture_output=True,
    )


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--in", dest="input", required=True)
    parser.add_argument("--start", type=float, help="Sekunde, ab der der Ausschnitt beginnt")
    parser.add_argument("--end", type=float, help="Sekunde, bei der der Ausschnitt endet")
    parser.add_argument("--auto-split", type=float, help="Statt --start/--end: ganzes Video in N-Sekunden-Stuecke zerlegen")
    parser.add_argument("--captions", help=".srt zum Einbrennen (optional, Zeiten relativ zum Originalvideo)")
    parser.add_argument("--out", help="Zieldatei (bei --start/--end)")
    parser.add_argument("--out-dir", help="Zielordner (bei --auto-split)")
    args = parser.parse_args()

    input_path = Path(args.input)

    if args.auto_split:
        if not args.out_dir:
            raise SystemExit("--auto-split braucht --out-dir")
        total = ffprobe_duration(input_path)
        out_dir = Path(args.out_dir)
        cursor = 0.0
        i = 0
        while cursor < total:
            end = min(cursor + args.auto_split, total)
            if end - cursor < 2:  # zu kurzer Rest, nicht als eigenen Short ausgeben
                break
            out_path = out_dir / f"short-{i:02d}.mp4"
            cut_short(input_path, cursor, end, args.captions, out_path)
            print(f"[shorts] {out_path}  ({cursor:.1f}s - {end:.1f}s)")
            cursor = end
            i += 1
    else:
        if args.start is None or args.end is None or not args.out:
            raise SystemExit("Ohne --auto-split werden --start, --end und --out gebraucht.")
        cut_short(input_path, args.start, args.end, args.captions, Path(args.out))
        print(f"[shorts] -> {args.out}")


if __name__ == "__main__":
    main()
