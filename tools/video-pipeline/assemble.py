#!/usr/bin/env python3
"""Letzter Schritt: fertig geschnittenes Video + Voiceover-Spur + Untertitel + Titelkarte zu
einem MP4 zusammensetzen.

Nutzung:
  python3 assemble.py --video out/cut.mp4 --voiceover-dir out/voiceover \\
      --captions out/captions.srt --title "Overhertz" --out out/final.mp4
"""
import argparse
import json
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


def effective_start_times(manifest, step_timing=None):
    """start_s je Segment - per Default die Reihenfolge aus dem Voiceover-Manifest (sequenziell
    hintereinander). Liegt eine step-timing-Zuordnung von cut.py vor (Segment-Id == Storyboard-
    Schritt-Id), hat die Vorrang: cut.py und voiceover.py sind sonst zwei unabhaengige
    Zeitleisten, die nur zufaellig grob synchron laufen - bei mehreren kurzen Momenten kurz
    hintereinander (Listicle-Videos) faellt das sichtbar auseinander (falsches Badge markiert,
    waehrend der dazugehoerige Satz schon laeuft)."""
    times = {}
    for seg in manifest:
        times[seg["id"]] = (step_timing or {}).get(seg["id"], seg["start_s"])
    return times


def build_voiceover_track(manifest_path: Path, tmp_dir: Path, step_timing=None) -> Path:
    """Mischt die einzelnen Voiceover-Schnipsel zu einer einzigen Tonspur - amix statt simples
    Concat, weil jedes Segment eine absolute Startzeit hat (adelay pro Clip), so bleibt die
    Vertonung synchron zum Video."""
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    start_times = effective_start_times(manifest, step_timing)
    inputs = []
    filter_parts = []
    for i, seg in enumerate(manifest):
        inputs += ["-i", seg["file"]]
        delay_ms = round(start_times[seg["id"]] * 1000)
        filter_parts.append(f"[{i}:a]adelay={delay_ms}|{delay_ms}[a{i}]")
    mix_inputs = "".join(f"[a{i}]" for i in range(len(manifest)))
    filter_complex = ";".join(filter_parts) + f";{mix_inputs}amix=inputs={len(manifest)}:normalize=0[aout]"

    out_path = tmp_dir / "voiceover-mixed.wav"
    subprocess.run(
        [FFMPEG, "-y", *inputs, "-filter_complex", filter_complex, "-map", "[aout]", str(out_path)],
        check=True, capture_output=True,
    )
    return out_path


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--video", required=True, help="geschnittenes Video (aus cut.py)")
    parser.add_argument("--voiceover-dir", help="Ordner mit manifest.json (aus voiceover.py)")
    parser.add_argument("--captions", help=".srt-Datei (aus caption.py)")
    parser.add_argument("--step-timing", help="*.steps-timing.json von cut.py - synct Voiceover-Segmente auf echte Bildmomente statt Reihenfolge zu schaetzen")
    parser.add_argument("--title", help="Titeltext, kurz auf schwarzem Grund vor dem eigentlichen Video")
    parser.add_argument("--out", required=True)
    args = parser.parse_args()

    step_timing = json.loads(Path(args.step_timing).read_text(encoding="utf-8")) if args.step_timing else None

    with tempfile.TemporaryDirectory() as tmp:
        tmp = Path(tmp)
        video_path = Path(args.video)

        # 1) Voiceover-Spur bauen. Ist sie laenger als das Rohvideo (haeufig bei kurzen
        #    Bildschirm-Rundgaengen mit langem Sprechertext), lieber das letzte Bild einfrieren
        #    und halten, bis die Vertonung fertig ist, statt mit -shortest den Satz mitten drin
        #    abzuwuergen - Standardtrick bei erzaehlten Screen-Recordings.
        if args.voiceover_dir:
            manifest_path = Path(args.voiceover_dir) / "manifest.json"
            voiceover_wav = build_voiceover_track(manifest_path, tmp, step_timing)

            video_duration = ffprobe_duration(video_path)
            voiceover_duration = ffprobe_duration(voiceover_wav)
            if voiceover_duration > video_duration:
                extended = tmp / "video-extended.mp4"
                pad_s = voiceover_duration - video_duration
                subprocess.run(
                    [FFMPEG, "-y", "-i", str(video_path),
                     "-vf", f"tpad=stop_mode=clone:stop_duration={pad_s:.3f}",
                     "-c:v", "libx264", "-pix_fmt", "yuv420p", str(extended)],
                    check=True, capture_output=True,
                )
                video_path = extended

            with_audio = tmp / "with-audio.mp4"
            subprocess.run(
                [FFMPEG, "-y", "-i", str(video_path), "-i", str(voiceover_wav),
                 "-c:v", "copy", "-c:a", "aac", "-shortest", str(with_audio)],
                check=True, capture_output=True,
            )
            video_path = with_audio

        # 2) Titelkarte voranstellen (optional) - schwarzer Clip mit Text, gleiche Aufloesung wie
        #    das Hauptvideo, damit concat ohne Re-Skalierungsprobleme funktioniert.
        if args.title:
            probe = subprocess.run(
                ["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height",
                 "-of", "csv=p=0", str(video_path)],
                capture_output=True, text=True, check=True,
            )
            width, height = probe.stdout.strip().split(",")
            title_clip = tmp / "title.mp4"
            escaped_title = args.title.replace(":", r"\:").replace("'", r"\'")
            subprocess.run(
                [FFMPEG, "-y", "-f", "lavfi", "-i", f"color=c=black:s={width}x{height}:d=2",
                 "-vf", f"drawtext=text='{escaped_title}':fontcolor=white:fontsize=64:x=(w-text_w)/2:y=(h-text_h)/2",
                 "-c:v", "libx264", "-pix_fmt", "yuv420p", "-an", str(title_clip)],
                check=True, capture_output=True,
            )
            with_audio_reenc = tmp / "main-reenc.mp4"
            subprocess.run(
                [FFMPEG, "-y", "-i", str(video_path), "-c:v", "libx264", "-pix_fmt", "yuv420p",
                 "-c:a", "aac", str(with_audio_reenc)],
                check=True, capture_output=True,
            )
            concat_list = tmp / "concat.txt"
            concat_list.write_text(f"file '{title_clip}'\nfile '{with_audio_reenc}'\n", encoding="utf-8")
            titled = tmp / "titled.mp4"
            subprocess.run(
                [FFMPEG, "-y", "-f", "concat", "-safe", "0", "-i", str(concat_list),
                 "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", str(titled)],
                check=True, capture_output=True,
            )
            video_path = titled

        # 3) Untertitel einbrennen (letzter Schritt, damit sie ueber der Titelkarte nicht stoeren).
        out_path = Path(args.out)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        if args.captions:
            srt_escaped = str(Path(args.captions).resolve()).replace(":", r"\:")
            subprocess.run(
                [FFMPEG, "-y", "-i", str(video_path),
                 "-vf", f"subtitles='{srt_escaped}':force_style='FontSize=20,PrimaryColour=&HFFFFFF&,OutlineColour=&H000000&,BorderStyle=1'",
                 "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", str(out_path)],
                check=True, capture_output=True,
            )
        else:
            subprocess.run(
                [FFMPEG, "-y", "-i", str(video_path), "-c:v", "libx264", "-pix_fmt", "yuv420p",
                 "-c:a", "aac", str(out_path)],
                check=True, capture_output=True,
            )

    print(f"[assemble] -> {out_path}")


if __name__ == "__main__":
    main()
