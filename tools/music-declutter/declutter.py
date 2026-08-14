#!/usr/bin/env python3
"""
Findet Duplikat-/Versionsgruppen von Songs per Audio-Fingerabdruck (Chromaprint/fpcalc) statt per
Dateiname - bei KI-generierter Musik mit chaotischen/umbenannten Dateinamen deutlich
zuverlaessiger als ein Namensabgleich. Behaelt pro erkannter Gruppe nur die zuletzt geaenderten
--keep Dateien, der Rest wird (nur mit --apply) in einen "_zum-Pruefen"-Unterordner verschoben -
NIE geloescht. Ohne --apply passiert gar nichts, es wird nur ein Bericht geschrieben.

Voraussetzung (einmalig, siehe README.md fuer Details je Plattform):
  fpcalc (Teil von Chromaprint) muss installiert und im PATH sein.

Aufruf:
  python3 declutter.py <Ordner>                       Nur Bericht (report.csv), nichts wird angefasst
  python3 declutter.py <Ordner> --apply                Verschiebt erkannte Dubletten wirklich
  python3 declutter.py <Ordner> --keep 3                Behaelt 3 statt 2 Versionen pro Gruppe
  python3 declutter.py <Ordner> --min-similarity 0.85   Grosszuegiger gruppieren (Standard: 0.92)

Bei falscher Gruppierung (zwei verschiedene Songs faelschlich zusammengeworfen, oder zwei echte
Versionen nicht erkannt): --min-similarity anpassen und den Bericht (ohne --apply) einfach erneut
laufen lassen, bis das Ergebnis passt. Erst wenn der Bericht gut aussieht, mit --apply wirklich
verschieben.
"""

import argparse
import csv
import shutil
import subprocess
import sys
from pathlib import Path

AUDIO_EXTENSIONS = {".wav", ".mp3", ".m4a", ".flac", ".ogg", ".opus", ".aac", ".wma"}

# Fingerabdruck-Laenge in Sekunden - reicht, um Versionen desselben Songs zuverlaessig zu
# erkennen, ohne bei tausenden Dateien ewig zu brauchen.
FINGERPRINT_SECONDS = 90

# Toleranz in Sekunden fuer den Dauer-Vorfilter - zwei Dateien werden nur verglichen, wenn ihre
# Laenge nicht mehr als das hier auseinanderliegt (spart bei grossen Bibliotheken sehr viel Zeit,
# ohne echte Versionen zu verpassen - Edits aendern die Laenge meist nur leicht).
DURATION_TOLERANCE_S = 6.0


def find_audio_files(root):
    files = []
    for path in root.rglob("*"):
        if path.is_file() and path.suffix.lower() in AUDIO_EXTENSIONS and "_zum-Pruefen" not in path.parts:
            files.append(path)
    return files


def fingerprint(path):
    """Ruft fpcalc auf, gibt (dauer_sekunden, fingerprint_ints) zurueck oder None bei Fehler."""
    try:
        result = subprocess.run(
            ["fpcalc", "-raw", "-length", str(FINGERPRINT_SECONDS), str(path)],
            capture_output=True,
            text=True,
            timeout=60,
        )
    except (subprocess.TimeoutExpired, FileNotFoundError) as e:
        print(f"  Warnung: fpcalc fehlgeschlagen fuer {path.name}: {e}", file=sys.stderr)
        return None
    if result.returncode != 0:
        print(f"  Warnung: fpcalc-Fehler bei {path.name}: {result.stderr.strip()}", file=sys.stderr)
        return None

    duration = None
    fp = None
    for line in result.stdout.splitlines():
        if line.startswith("DURATION="):
            duration = float(line.split("=", 1)[1])
        elif line.startswith("FINGERPRINT="):
            fp = [int(x) for x in line.split("=", 1)[1].split(",")]
    if duration is None or fp is None:
        print(f"  Warnung: konnte Fingerabdruck fuer {path.name} nicht lesen.", file=sys.stderr)
        return None
    return duration, fp


def similarity(fp_a, fp_b):
    """Anteil uebereinstimmender Bits zwischen zwei rohen Chromaprint-Fingerabdruecken (0-1)."""
    n = min(len(fp_a), len(fp_b))
    if n == 0:
        return 0.0
    diff_bits = sum(bin(a ^ b).count("1") for a, b in zip(fp_a[:n], fp_b[:n]))
    return 1 - diff_bits / (n * 32)


class UnionFind:
    def __init__(self, items):
        self.parent = {item: item for item in items}

    def find(self, x):
        while self.parent[x] != x:
            self.parent[x] = self.parent[self.parent[x]]
            x = self.parent[x]
        return x

    def union(self, a, b):
        ra, rb = self.find(a), self.find(b)
        if ra != rb:
            self.parent[ra] = rb


def group_by_similarity(entries, min_similarity):
    """entries: Liste von (path, duration, fingerprint). Gibt Liste von Gruppen (Listen von path) zurueck."""
    entries = sorted(entries, key=lambda e: e[1])  # nach Dauer sortiert fuers Sliding-Window
    uf = UnionFind([e[0] for e in entries])

    n = len(entries)
    for i in range(n):
        path_a, dur_a, fp_a = entries[i]
        for j in range(i + 1, n):
            path_b, dur_b, fp_b = entries[j]
            if dur_b - dur_a > DURATION_TOLERANCE_S:
                break  # sortiert nach Dauer - alles Weitere ist noch weiter weg
            if similarity(fp_a, fp_b) >= min_similarity:
                uf.union(path_a, path_b)

    groups = {}
    for path, _, _ in entries:
        root = uf.find(path)
        groups.setdefault(root, []).append(path)
    return [g for g in groups.values() if len(g) > 1]


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("folder", type=str, help="Ordner, der (rekursiv) durchsucht wird")
    parser.add_argument("--keep", type=int, default=2, help="Wie viele neueste Versionen pro Gruppe behalten (Standard: 2)")
    parser.add_argument("--min-similarity", type=float, default=0.92, help="Aehnlichkeits-Schwelle 0-1 (Standard: 0.92)")
    parser.add_argument("--apply", action="store_true", help="Verschiebt Dubletten wirklich (ohne diese Option: nur Bericht)")
    args = parser.parse_args()

    root = Path(args.folder).expanduser().resolve()
    if not root.is_dir():
        print(f"Ordner nicht gefunden: {root}", file=sys.stderr)
        sys.exit(1)

    if shutil.which("fpcalc") is None:
        print("fpcalc nicht gefunden - siehe README.md fuer die Installation (Chromaprint).", file=sys.stderr)
        sys.exit(1)

    files = find_audio_files(root)
    print(f"{len(files)} Audiodatei(en) gefunden in {root}\n")

    entries = []
    for i, path in enumerate(files, 1):
        print(f"[{i}/{len(files)}] Analysiere {path.name}...", end="\r")
        fp_result = fingerprint(path)
        if fp_result is not None:
            duration, fp = fp_result
            entries.append((path, duration, fp))
    print()

    groups = group_by_similarity(entries, args.min_similarity)
    print(f"\n{len(groups)} Gruppe(n) mit mehreren Versionen gefunden.\n")

    review_dir = root / "_zum-Pruefen"
    report_rows = []
    total_move = 0

    for gi, group in enumerate(groups, 1):
        group_sorted = sorted(group, key=lambda p: p.stat().st_mtime, reverse=True)
        keep = group_sorted[: args.keep]
        move = group_sorted[args.keep :]

        print(f"Gruppe {gi} ({len(group_sorted)} Dateien):")
        for p in keep:
            non_wav_note = "" if p.suffix.lower() == ".wav" else "  [kein WAV]"
            print(f"  behalten:    {p.name}{non_wav_note}")
            report_rows.append({"gruppe": gi, "aktion": "behalten", "datei": str(p)})
        for p in move:
            print(f"  verschieben: {p.name}")
            report_rows.append({"gruppe": gi, "aktion": "verschieben" if args.apply else "wuerde_verschieben", "datei": str(p)})
            total_move += 1
        print()

        if args.apply:
            review_dir.mkdir(exist_ok=True)
            for p in move:
                target = review_dir / p.name
                counter = 1
                while target.exists():
                    target = review_dir / f"{p.stem}_{counter}{p.suffix}"
                    counter += 1
                shutil.move(str(p), str(target))

    report_path = root / "report.csv"
    with open(report_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["gruppe", "aktion", "datei"])
        writer.writeheader()
        writer.writerows(report_rows)

    print(f"Bericht gespeichert: {report_path}")
    if args.apply:
        print(f"{total_move} Datei(en) nach {review_dir} verschoben.")
    else:
        print(f"Nur Bericht - {total_move} Datei(en) wuerden mit --apply verschoben werden.")
        print("Sieht das Ergebnis gut aus? Dann nochmal mit --apply aufrufen.")


if __name__ == "__main__":
    main()
