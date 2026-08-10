#!/usr/bin/env python3
"""Erzeugt ein Bild aus einem Text-Prompt - lokal, offline, ohne API-Key/Tokens/Kontingent.

Nutzt ein kleines, CPU-taugliches Stable-Diffusion-Modell ueber die diffusers-Bibliothek.
Bewusst KEIN Cloud-Dienst (Midjourney/DALL-E/etc.): kein Secret noetig, keine Kosten pro Bild,
keine Rate-Limits - dafuer langsamer als eine GPU/Cloud-Loesung und mit dem
Qualitaetsniveau eines kleinen, offline-faehigen Modells statt eines State-of-the-Art-Riesen.

Standardmodell "OFA-Sys/small-stable-diffusion-v0": ein auf halbe Groesse destilliertes
Stable-Diffusion-1.5-Derivat unter Apache-2.0-Lizenz (kommerziell unbedenklich nutzbar, z.B.
fuer Thumbnails/Cover) - bewusst NICHT "stabilityai/sd-turbo"/"sdxl-turbo", die zwar schneller
waeren, aber unter Stability AI's nicht-kommerzieller Community-Lizenz stehen.

Laeuft ohne GPU (--device cpu, Standard) - das dauert je nach Server spuerbar (grob 1-5 Minuten
pro Bild auf 2 vCPU ohne GPU, stark abhaengig von Schrittzahl/Aufloesung). Deshalb bewusst
niedrige Standardwerte (512x512, 15 Schritte) und --steps/--width/--height nach Bedarf hoch-
oder runterdrehen. attention/vae slicing ist immer aktiv, um mit wenig RAM auszukommen (siehe
DEPLOY.md: Zielserver hat nur 4GB RAM insgesamt, geteilt mit Dashboard/ffmpeg/Chromium).

Erster Aufruf laedt das Modell einmalig von huggingface.co (mehrere hundert MB, landet in
~/.cache/huggingface) - braucht dafuer Netzwerkzugriff. In der Sandbox, in der dieses Skript
entstanden ist, war huggingface.co per Netzwerk-Policy gesperrt (403) - das Skript ist deshalb
NICHT gegen einen echten Modell-Download getestet, nur gegen die Argument-/Ablauflogik. Vor dem
ersten echten Einsatz einmal mit einem einfachen Test-Prompt gegenpruefen (siehe README).

Nutzung:
  python3 imagegen.py --prompt "warmes Bokeh-Licht, dunkle Buehne, Vinyl-Schallplatte" --out out/images/cover.png
  python3 imagegen.py --prompt "..." --steps 25 --width 768 --height 768 --seed 42 --out out/images/cover.png
"""
import argparse
from pathlib import Path

DEFAULT_MODEL = "OFA-Sys/small-stable-diffusion-v0"


def generate(prompt, negative_prompt, model, steps, width, height, guidance_scale, seed, device):
    import torch
    from diffusers import AutoPipelineForText2Image

    dtype = torch.float16 if device == "cuda" else torch.float32
    print(f"[imagegen] Lade Modell {model} ({device}, {dtype})- beim ersten Mal wird es dafuer heruntergeladen...")
    pipe = AutoPipelineForText2Image.from_pretrained(model, torch_dtype=dtype, safety_checker=None)
    pipe = pipe.to(device)
    # Reduziert Spitzen-RAM-Verbrauch deutlich (auf Kosten von etwas Geschwindigkeit) - auf dem
    # Zielserver mit nur 4GB RAM insgesamt sonst reales OOM-Risiko neben Dashboard/ffmpeg/Chromium.
    pipe.enable_attention_slicing("max")
    if hasattr(pipe, "enable_vae_slicing"):
        pipe.enable_vae_slicing()

    generator = torch.Generator(device).manual_seed(seed) if seed is not None else None

    print(f"[imagegen] Erzeuge Bild: \"{prompt[:70]}\" ({steps} Schritte, {width}x{height}) - das kann ohne GPU mehrere Minuten dauern...")
    result = pipe(
        prompt=prompt,
        negative_prompt=negative_prompt or None,
        num_inference_steps=steps,
        width=width,
        height=height,
        guidance_scale=guidance_scale,
        generator=generator,
    )
    return result.images[0]


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--prompt", required=True, help="Bildbeschreibung")
    parser.add_argument("--negative-prompt", default="", help="was das Bild NICHT zeigen soll (optional)")
    parser.add_argument("--out", required=True, help="Ziel-Bilddatei (.png/.jpg)")
    parser.add_argument("--model", default=DEFAULT_MODEL, help=f"HuggingFace-Modell-Id (Standard: {DEFAULT_MODEL})")
    parser.add_argument("--steps", type=int, default=15, help="Diffusions-Schritte - mehr = besser, aber langsamer (Standard: 15)")
    parser.add_argument("--width", type=int, default=512)
    parser.add_argument("--height", type=int, default=512)
    parser.add_argument("--guidance-scale", type=float, default=7.5, help="wie strikt am Prompt (Standard: 7.5)")
    parser.add_argument("--seed", type=int, help="fuer reproduzierbare Ergebnisse (leer = zufaellig)")
    parser.add_argument("--device", default="cpu", choices=["cpu", "cuda"], help="'cuda' nur falls tatsaechlich eine GPU verfuegbar ist")
    args = parser.parse_args()

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    image = generate(
        args.prompt, args.negative_prompt, args.model, args.steps,
        args.width, args.height, args.guidance_scale, args.seed, args.device,
    )
    image.save(out_path)
    print(f"[imagegen] -> {out_path}")


if __name__ == "__main__":
    main()
