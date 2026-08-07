#!/usr/bin/env python3
"""Erzeugt ein Thumbnail aus einem Video: Frame greifen + fetten Titeltext mit lesbarem
Verlaufsbalken drueberlegen. Zwei Formate gleichzeitig moeglich (YouTube 16:9 und Shorts-Cover
9:16), weil beide aus demselben Frame gebraucht werden.

Nutzung:
  python3 thumbnail.py --in out/final.mp4 --title "In 10 Sekunden zum Urteil" --out out/thumb.png
  python3 thumbnail.py --in out/final.mp4 --time 8 --title "Track zu leise?" \\
      --subtitle "Overhertz sagt dir warum" --out out/thumb.png --vertical-out out/thumb-9x16.png
"""
import argparse
import subprocess
from pathlib import Path

FFMPEG = "ffmpeg"
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"


def ffprobe_duration(path: Path) -> float:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
        capture_output=True, text=True, check=True,
    )
    return float(out.stdout.strip())


def escape_text(text: str) -> str:
    return text.replace("\\", r"\\\\").replace(":", r"\:").replace("'", r"\'")


def build_overlay_filter(title: str, subtitle: str | None, accent: str) -> str:
    # Dunkler Verlaufsbalken am unteren Bilddrittel fuer Lesbarkeit auf jedem Hintergrund, Titel
    # fett + optional Zeile darunter in der Akzentfarbe - kein Hintergrundbild-generieren noetig,
    # das echte Frame traegt schon die Bildaussage.
    parts = [
        f"drawbox=x=0:y=ih*0.62:w=iw:h=ih*0.38:color=black@0.55:t=fill",
        f"drawtext=fontfile={FONT}:text='{escape_text(title)}':fontcolor=white:fontsize=w/16"
        f":x=(w-text_w)/2:y=h*0.72:line_spacing=6",
    ]
    if subtitle:
        parts.append(
            f"drawtext=fontfile={FONT}:text='{escape_text(subtitle)}':fontcolor={accent}:fontsize=w/28"
            f":x=(w-text_w)/2:y=h*0.88"
        )
    return ",".join(parts)


def make_thumbnail(input_path: Path, time_s: float, title: str, subtitle: str | None, accent: str, size: str, out_path: Path):
    w, h = size.split("x")
    filt = f"scale={w}:{h}:force_original_aspect_ratio=increase,crop={w}:{h}," + build_overlay_filter(title, subtitle, accent)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        [FFMPEG, "-y", "-ss", f"{time_s:.3f}", "-i", str(input_path), "-frames:v", "1",
         "-vf", filt, str(out_path)],
        check=True, capture_output=True,
    )


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--in", dest="input", required=True)
    parser.add_argument("--time", type=float, help="Sekunde im Video, aus der der Frame kommt (Default: 30%% der Laenge)")
    parser.add_argument("--title", required=True)
    parser.add_argument("--subtitle")
    parser.add_argument("--accent", default="#ff9a3c", help="Hex-Akzentfarbe fuer die Subtitle-Zeile")
    parser.add_argument("--out", required=True, help="16:9-YouTube-Thumbnail (1280x720)")
    parser.add_argument("--vertical-out", help="zusaetzlich 9:16-Cover (1080x1920) fuer Shorts")
    args = parser.parse_args()

    input_path = Path(args.input)
    time_s = args.time if args.time is not None else ffprobe_duration(input_path) * 0.3

    make_thumbnail(input_path, time_s, args.title, args.subtitle, args.accent, "1280x720", Path(args.out))
    print(f"[thumbnail] -> {args.out}")

    if args.vertical_out:
        make_thumbnail(input_path, time_s, args.title, args.subtitle, args.accent, "1080x1920", Path(args.vertical_out))
        print(f"[thumbnail] -> {args.vertical_out}")


if __name__ == "__main__":
    main()
