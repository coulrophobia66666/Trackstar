#!/usr/bin/env python3
"""Erzeugt einen fertigen Hochkant-Short (1080x1920) aus nur Musik + gewaehltem Ausschnitt -
Zielbild dieses Werkzeugs: Bild hochladen (optional), Musik hochladen, Part angeben, fertig.

Zwei Hintergrund-Varianten:
  --image gegeben    Bild mit sanftem Ken-Burns-Zoom als Hintergrund (klassischer Cover-Look).
  --image weggelassen Animierte Wellenform direkt aus dem Audio generiert - kein Bild noetig,
                       nie ein Blocker, falls (noch) kein Artwork da ist.

In beiden Faellen optional ein Titeltext oben drüber (z.B. Songtitel) und optionale Untertitel
aus einer .srt (z.B. per caption.py aus einem vorab eingesprochenen Kommentar, oder von Hand
getippt zum Songtext-Hook).

Nutzung:
  python3 music-short.py --audio track.mp3 --start 32 --end 47 --image cover.jpg \\
      --title "Natriumlicht" --out out/shorts/hook.mp4
  python3 music-short.py --audio track.mp3 --start 32 --end 47 --out out/shorts/hook.mp4
"""
import argparse
import subprocess
from pathlib import Path

FFMPEG = "ffmpeg"
W, H = 1080, 1920
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"


def escape_text(text: str) -> str:
    return text.replace("\\", r"\\\\").replace(":", r"\:").replace("'", r"\'")


def build_filter(has_image: bool, duration: float, title: str | None, captions: str | None) -> tuple[str, str]:
    if has_image:
        # Leichtes Ken-Burns (langsames Reinzoomen) statt eines toten Standbilds - macht auch ein
        # einzelnes Coverbild fuer die volle Kurzvideo-Laenge ansehnlich.
        frames = max(int(duration * 25), 25)
        chain = (
            f"[1:v]scale={W*2}:{H*2}:force_original_aspect_ratio=increase,crop={W*2}:{H*2},"
            f"zoompan=z='min(zoom+0.0007,1.15)':d={frames}:s={W}x{H}:fps=25[bg]"
        )
    else:
        # Ohne Bild: die Musik selbst liefert das Bild - eine Wellenform, mittig, auf dunklem
        # Grund, damit trotzdem sofort klar ist, worum es geht (Ton statt Standbild). Vorher auf
        # mono gemischt, weil zwei Kanaele mit je eigener Farbe an derselben Stelle sich sonst zu
        # einem Mischton blenden. Farbe bewusst "white", nicht die Markenfarbe: in diesem
        # ffmpeg-Build (6.1.1) liefert showwaves' colors-Option bei Hex-Werten (0xff9a3c) und
        # manchen benannten Farben (orange, cyan, gold) einen falschen, gruenstichigen Farbton
        # zurueck - offenbar eine interne Einschraenkung des Filters, kein Bug hier. Verifiziert
        # korrekt: white, yellow, red.
        chain = (
            f"color=c=0x14141c:s={W}x{H}:d={duration}[base];"
            f"[0:a]aformat=channel_layouts=mono,showwaves=s={W}x640:mode=cline:colors=white:rate=25,format=yuva420p[wave];"
            f"[base][wave]overlay=(W-w)/2:(H-h)/2[bg]"
        )

    out_label = "bg"
    if title:
        chain += f";[{out_label}]drawtext=fontfile={FONT}:text='{escape_text(title)}':fontcolor=white:fontsize=w/14:x=(w-text_w)/2:y=h*0.08:box=1:boxcolor=black@0.35:boxborderw=20[titled]"
        out_label = "titled"
    if captions:
        srt_escaped = str(Path(captions).resolve()).replace(":", r"\:")
        chain += f";[{out_label}]subtitles='{srt_escaped}':force_style='FontSize=26,PrimaryColour=&HFFFFFF&,OutlineColour=&H000000&,BorderStyle=1'[capped]"
        out_label = "capped"

    return chain, out_label


def make_music_short(audio_path: Path, start: float, end: float, image_path: Path | None, title: str | None, captions: str | None, out_path: Path):
    duration = end - start
    inputs = ["-ss", f"{start:.3f}", "-to", f"{end:.3f}", "-i", str(audio_path)]
    if image_path:
        inputs += ["-loop", "1", "-i", str(image_path)]

    filter_complex, out_label = build_filter(bool(image_path), duration, title, captions)

    out_path.parent.mkdir(parents=True, exist_ok=True)
    cmd = [
        FFMPEG, "-y", *inputs,
        "-filter_complex", filter_complex,
        "-map", f"[{out_label}]", "-map", "0:a",
        "-t", f"{duration:.3f}",
        "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac",
        str(out_path),
    ]
    subprocess.run(cmd, check=True, capture_output=True)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--audio", required=True, help="Musikdatei")
    parser.add_argument("--start", type=float, required=True, help="Beginn des gewuenschten Parts (s)")
    parser.add_argument("--end", type=float, required=True, help="Ende des gewuenschten Parts (s)")
    parser.add_argument("--image", help="Hintergrundbild (optional - ohne wird eine Wellenform generiert)")
    parser.add_argument("--title", help="Titeltext oben im Bild (optional, z.B. Songtitel)")
    parser.add_argument("--captions", help=".srt zum Einbrennen (optional)")
    parser.add_argument("--out", required=True)
    args = parser.parse_args()

    if args.end <= args.start:
        raise SystemExit("--end muss groesser als --start sein")

    make_music_short(
        Path(args.audio), args.start, args.end,
        Path(args.image) if args.image else None,
        args.title, args.captions, Path(args.out),
    )
    print(f"[music-short] -> {args.out}")


if __name__ == "__main__":
    main()
