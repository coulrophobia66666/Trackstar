#!/usr/bin/env node
// Kleines lokales Dashboard, das die einzelnen Pipeline-Skripte (record.mjs, cut.py,
// voiceover.py, caption.py, assemble.py, shorts.py, thumbnail.py) ueber eine Weboberflaeche statt
// von Hand ueber die Kommandozeile ansteuert. Laeuft nur lokal (127.0.0.1) - kein Deploy, kein
// Teil des Overhertz-Produkts.
//
// Start: node web/server.mjs   (dann http://127.0.0.1:5177 oeffnen)

import express from "express";
import multer from "multer";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { mkdir, readdir, stat } from "node:fs/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "out");
const UPLOAD_DIR = path.join(ROOT, "uploads");
const VENV_PYTHON = path.join(ROOT, ".venv", "bin", "python3");

await mkdir(OUT_DIR, { recursive: true });
await mkdir(UPLOAD_DIR, { recursive: true });

const app = express();
app.use(express.json());
app.use("/out", express.static(OUT_DIR));
app.use(express.static(path.join(__dirname, "public")));

const upload = multer({ dest: UPLOAD_DIR });

// Laufende/abgeschlossene Jobs im Prozessspeicher - reicht fuer ein lokales Ein-Personen-Tool,
// keine Datenbank noetig.
const jobs = new Map();

function runJob(command, args, cwd = ROOT) {
  const id = randomUUID();
  const job = { id, status: "running", log: [], command: [command, ...args].join(" ") };
  jobs.set(id, job);

  const child = spawn(command, args, { cwd });
  child.stdout.on("data", (d) => job.log.push(d.toString()));
  child.stderr.on("data", (d) => job.log.push(d.toString()));
  child.on("close", (code) => {
    job.status = code === 0 ? "done" : "error";
    job.exitCode = code;
  });
  child.on("error", (err) => {
    job.status = "error";
    job.log.push(`\n[server] Konnte Prozess nicht starten: ${err.message}`);
  });

  return id;
}

app.get("/api/jobs/:id", (req, res) => {
  const job = jobs.get(req.params.id);
  if (!job) return res.status(404).json({ error: "unbekannte Job-Id" });
  res.json({ id: job.id, status: job.status, exitCode: job.exitCode ?? null, log: job.log.join("") });
});

app.post("/api/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "keine Datei" });
  res.json({ path: req.file.path, originalName: req.file.originalname });
});

app.get("/api/files", async (req, res) => {
  async function walk(dir, base = "") {
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return [];
    }
    let files = [];
    for (const entry of entries) {
      const rel = path.join(base, entry.name);
      if (entry.isDirectory()) {
        files = files.concat(await walk(path.join(dir, entry.name), rel));
      } else if (/\.(mp4|png|jpg|srt|wav|json)$/i.test(entry.name)) {
        const s = await stat(path.join(dir, entry.name));
        files.push({ path: rel, size: s.size, mtime: s.mtimeMs });
      }
    }
    return files;
  }
  const files = (await walk(OUT_DIR)).sort((a, b) => b.mtime - a.mtime);
  res.json(files);
});

// --- Pipeline-Stufen ---

app.post("/api/record", (req, res) => {
  const { storyboard, out, baseUrl } = req.body;
  const args = ["record.mjs", "--storyboard", storyboard, "--out", out || "out/raw"];
  if (baseUrl) args.push("--base-url", baseUrl);
  res.json({ jobId: runJob("node", args) });
});

app.post("/api/cut", (req, res) => {
  const { mode, input, steps, out, maxGap } = req.body;
  const args = [path.join(ROOT, "cut.py"), "--mode", mode, "--in", input, "--out", out];
  if (mode === "steps") args.push("--steps", steps, "--max-gap", String(maxGap || 1.2));
  res.json({ jobId: runJob(VENV_PYTHON, args) });
});

app.post("/api/voiceover", (req, res) => {
  const { script, out, engine } = req.body;
  const args = [path.join(ROOT, "voiceover.py"), "--script", script, "--out", out || "out/voiceover"];
  if (engine) args.push("--engine", engine);
  res.json({ jobId: runJob(VENV_PYTHON, args) });
});

app.post("/api/caption", (req, res) => {
  const { fromManifest, fromAudio, out, language } = req.body;
  const args = [path.join(ROOT, "caption.py"), "--out", out];
  if (fromManifest) args.push("--from-manifest", fromManifest);
  else args.push("--from-audio", fromAudio, "--language", language || "de");
  res.json({ jobId: runJob(VENV_PYTHON, args) });
});

app.post("/api/assemble", (req, res) => {
  const { video, voiceoverDir, captions, title, out } = req.body;
  const args = [path.join(ROOT, "assemble.py"), "--video", video, "--out", out];
  if (voiceoverDir) args.push("--voiceover-dir", voiceoverDir);
  if (captions) args.push("--captions", captions);
  if (title) args.push("--title", title);
  res.json({ jobId: runJob(VENV_PYTHON, args) });
});

app.post("/api/shorts", (req, res) => {
  const { input, start, end, autoSplit, outDir, out, captions } = req.body;
  const args = [path.join(ROOT, "shorts.py"), "--in", input];
  if (autoSplit) args.push("--auto-split", String(autoSplit), "--out-dir", outDir || "out/shorts");
  else args.push("--start", String(start), "--end", String(end), "--out", out);
  if (captions) args.push("--captions", captions);
  res.json({ jobId: runJob(VENV_PYTHON, args) });
});

app.post("/api/music-short", (req, res) => {
  const { audio, start, end, image, title, captions, out } = req.body;
  const args = [path.join(ROOT, "music-short.py"), "--audio", audio, "--start", String(start), "--end", String(end), "--out", out];
  if (image) args.push("--image", image);
  if (title) args.push("--title", title);
  if (captions) args.push("--captions", captions);
  res.json({ jobId: runJob(VENV_PYTHON, args) });
});

app.post("/api/thumbnail", (req, res) => {
  const { input, time, title, subtitle, out, verticalOut } = req.body;
  const args = [path.join(ROOT, "thumbnail.py"), "--in", input, "--title", title, "--out", out];
  if (time !== undefined && time !== "") args.push("--time", String(time));
  if (subtitle) args.push("--subtitle", subtitle);
  if (verticalOut) args.push("--vertical-out", verticalOut);
  res.json({ jobId: runJob(VENV_PYTHON, args) });
});

const PORT = process.env.PORT || 5177;
app.listen(PORT, "127.0.0.1", () => {
  console.log(`Video-Pipeline-Dashboard: http://127.0.0.1:${PORT}`);
});
