"use strict";

/* ---------- Icons (inline SVG, currentColor, always paired with a text label) ---------- */

const ICONS = {
  good: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5"/><path d="M5 8.2l2 2 4-4.4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  warning: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 2l6.9 12H1.1L8 2z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M8 6.5v3.2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="8" cy="11.8" r="0.9" fill="currentColor"/></svg>`,
  critical: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5"/><path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
};

function statusForScore(score) {
  if (score >= 75) return { key: "good", color: "var(--status-good)", label: "Gut" };
  if (score >= 50) return { key: "warning", color: "var(--status-warning)", label: "Ausbaufähig" };
  return { key: "critical", color: "var(--status-critical)", label: "Schwach" };
}

/* ---------- Entertainment layer: grades, badges, teaser (for the free view) ---------- */

function gradeForScore(score) {
  if (score >= 80) {
    return { stars: 5, title: "Star Potential", desc: "Dein Track hat richtig Potential – so kannst du ihn einreichen.", color: "var(--status-good)" };
  }
  if (score >= 60) {
    return { stars: 4, title: "Fast am Ziel", desc: "Guter Stand – mit ein paar Anpassungen ist noch mehr drin.", color: "var(--status-good)" };
  }
  if (score >= 40) {
    return { stars: 3, title: "Noch Feinschliff nötig", desc: "Die Basis stimmt, aber es gibt ein paar klare Stellschrauben.", color: "var(--status-warning)" };
  }
  return { stars: 2, title: "Baustelle", desc: "Vor einer Einreichung lohnt sich nochmal Arbeit am Track.", color: "var(--status-critical)" };
}

function starRatingHtml(stars) {
  let html = "";
  for (let i = 1; i <= 5; i++) {
    html += i <= stars ? "★" : `<span class="star-empty">★</span>`;
  }
  return html;
}

function badgeTier(score) {
  if (score === null || score === undefined) return { dots: "○ ○ ○", label: "Fehlt Info" };
  if (score >= 75) return { dots: "● ● ●", label: "Stark" };
  if (score >= 50) return { dots: "● ● ○", label: "Solide" };
  return { dots: "● ○ ○", label: "Ausbaufähig" };
}

function combineScores(scores) {
  const vals = scores.filter((v) => v !== null && v !== undefined);
  if (vals.length === 0) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

const TIP_LEVEL_RANK = { critical: 0, warning: 1, good: 2 };

function pickTopTip(tips) {
  let best = tips[0];
  for (const tip of tips) {
    if (TIP_LEVEL_RANK[tip.level] < TIP_LEVEL_RANK[best.level]) best = tip;
  }
  return best;
}

/* ---------- FFT (iterative radix-2 Cooley-Tukey) ---------- */

function fft(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let curWr = 1, curWi = 0;
      for (let k = 0; k < len / 2; k++) {
        const ur = re[i + k], ui = im[i + k];
        const idx = i + k + len / 2;
        const vr = re[idx] * curWr - im[idx] * curWi;
        const vi = re[idx] * curWi + im[idx] * curWr;
        re[i + k] = ur + vr; im[i + k] = ui + vi;
        re[idx] = ur - vr; im[idx] = ui - vi;
        const nwr = curWr * wr - curWi * wi;
        const nwi = curWr * wi + curWi * wr;
        curWr = nwr; curWi = nwi;
      }
    }
  }
}

const FFT_SIZE = 4096;
const MAX_FRAMES = 200;

const FREQ_BANDS = [
  { name: "Sub-Bass", range: [20, 60], ref: [2, 8] },
  { name: "Bass", range: [60, 250], ref: [14, 26] },
  { name: "Low-Mid", range: [250, 500], ref: [10, 18] },
  { name: "Mid", range: [500, 2000], ref: [20, 32] },
  { name: "High-Mid", range: [2000, 4000], ref: [10, 18] },
  { name: "Presence", range: [4000, 6000], ref: [5, 12] },
  { name: "Brillanz", range: [6000, 16000], ref: [4, 12] },
];

function hann(n) {
  const w = new Float64Array(n);
  for (let i = 0; i < n; i++) w[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (n - 1));
  return w;
}

function analyzeAudioBuffer(buffer) {
  const sampleRate = buffer.sampleRate;
  const numChannels = buffer.numberOfChannels;
  const length = buffer.length;

  const mono = new Float32Array(length);
  for (let ch = 0; ch < numChannels; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < length; i++) mono[i] += data[i] / numChannels;
  }

  let peak = 0;
  let sumSquares = 0;
  let clippedSamples = 0;
  for (let i = 0; i < length; i++) {
    const abs = Math.abs(mono[i]);
    if (abs > peak) peak = abs;
    if (abs >= 0.999) clippedSamples++;
    sumSquares += mono[i] * mono[i];
  }
  const rms = Math.sqrt(sumSquares / length);
  const clippingRatio = clippedSamples / length;
  const loudnessDb = 20 * Math.log10(rms || 1e-9);
  const crestFactorDb = 20 * Math.log10((peak || 1e-9) / (rms || 1e-9));

  const window = hann(FFT_SIZE);
  const bandEnergy = new Array(FREQ_BANDS.length).fill(0);
  let framesUsed = 0;

  const maxStart = Math.max(0, length - FFT_SIZE);
  const frameCount = Math.min(MAX_FRAMES, Math.max(1, Math.floor(length / FFT_SIZE)));
  const step = frameCount > 1 ? maxStart / (frameCount - 1) : 0;

  for (let f = 0; f < frameCount; f++) {
    const start = Math.round(f * step);
    const re = new Float64Array(FFT_SIZE);
    const im = new Float64Array(FFT_SIZE);
    for (let i = 0; i < FFT_SIZE; i++) {
      const s = start + i < length ? mono[start + i] : 0;
      re[i] = s * window[i];
    }
    fft(re, im);

    const binHz = sampleRate / FFT_SIZE;
    for (let bin = 1; bin < FFT_SIZE / 2; bin++) {
      const freq = bin * binHz;
      const mag = Math.sqrt(re[bin] * re[bin] + im[bin] * im[bin]);
      const energy = mag * mag;
      for (let b = 0; b < FREQ_BANDS.length; b++) {
        const [lo, hi] = FREQ_BANDS[b].range;
        if (freq >= lo && freq < hi) {
          bandEnergy[b] += energy;
          break;
        }
      }
    }
    framesUsed++;
  }

  const totalEnergy = bandEnergy.reduce((a, b) => a + b, 0) || 1;
  const bandPercents = bandEnergy.map((e) => (e / totalEnergy) * 100);

  return {
    duration: buffer.duration,
    peak,
    rms,
    clippingRatio,
    loudnessDb,
    crestFactorDb,
    bandPercents,
    framesUsed,
  };
}

/* ---------- Lyrics / hook analysis ---------- */

function normalizeText(s) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9äöüß\s]/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function analyzeLyrics(lyricsRaw, titleRaw) {
  const hasLyrics = !!lyricsRaw && lyricsRaw.trim().length > 0;
  const hasTitle = !!titleRaw && titleRaw.trim().length > 0;
  if (!hasLyrics) {
    return { hasLyrics: false, hasTitle };
  }

  const lines = lyricsRaw
    .split("\n")
    .map((l) => normalizeText(l))
    .filter((l) => l.length > 2);

  const counts = new Map();
  for (const line of lines) counts.set(line, (counts.get(line) || 0) + 1);

  let hookLine = "";
  let hookRepeatCount = 0;
  for (const [line, count] of counts) {
    if (count > hookRepeatCount) {
      hookRepeatCount = count;
      hookLine = line;
    }
  }

  const normLyrics = normalizeText(lyricsRaw);
  const normTitle = hasTitle ? normalizeText(titleRaw) : "";

  const titleInLyrics = hasTitle && normTitle.length > 0 && normLyrics.includes(normTitle);
  const titleInHook = hasTitle && normTitle.length > 0 && hookLine.includes(normTitle);

  return {
    hasLyrics: true,
    hasTitle,
    hookLine,
    hookRepeatCount,
    titleInLyrics,
    titleInHook,
  };
}

/* ---------- Scoring ---------- */

function scoreTechnik(a) {
  let score = 100;
  if (a.clippingRatio > 0.02) score -= 45;
  else if (a.clippingRatio > 0.005) score -= 25;
  else if (a.clippingRatio > 0.0005) score -= 10;

  if (a.crestFactorDb < 6) score -= 30;
  else if (a.crestFactorDb < 8) score -= 12;
  else if (a.crestFactorDb > 22) score -= 15;
  else if (a.crestFactorDb > 18) score -= 6;

  return Math.max(0, Math.min(100, score));
}

function scoreLautheit(a) {
  const target = -14;
  const diff = Math.abs(a.loudnessDb - target);
  let score = 100 - diff * 6;
  return Math.max(0, Math.min(100, score));
}

function scoreFrequenz(a) {
  let penalty = 0;
  FREQ_BANDS.forEach((band, i) => {
    const [lo, hi] = band.ref;
    const val = a.bandPercents[i];
    if (val < lo) penalty += (lo - val) * 1.8;
    else if (val > hi) penalty += (val - hi) * 1.8;
  });
  return Math.max(0, Math.min(100, 100 - penalty));
}

function scoreHook(lyrics) {
  if (!lyrics.hasLyrics) return null;
  if (lyrics.hookRepeatCount >= 3) return 100;
  if (lyrics.hookRepeatCount === 2) return 70;
  return 30;
}

function scoreTitel(lyrics) {
  if (!lyrics.hasLyrics || !lyrics.hasTitle) return null;
  if (lyrics.titleInHook) return 100;
  if (lyrics.titleInLyrics) return 55;
  return 15;
}

/* ---------- Tips ---------- */

function buildTips(a, lyrics, scores) {
  const tips = [];

  if (a.clippingRatio > 0.005) {
    tips.push({
      level: "critical",
      text: `Der Track clippt hörbar (${(a.clippingRatio * 100).toFixed(2)}% der Samples am Limit). Reduziere den Gain vor dem Limiter oder senke das Limiter-Ceiling auf ca. -1 dBTP.`,
    });
  } else if (a.clippingRatio > 0.0005) {
    tips.push({
      level: "warning",
      text: "Vereinzelte Samples liegen am Limit. Für Streaming-Plattformen etwas mehr Headroom lassen (True-Peak-Limiter, Ceiling ca. -1 dBTP).",
    });
  }

  if (a.crestFactorDb < 6) {
    tips.push({
      level: "critical",
      text: `Der Track ist stark überkomprimiert (Crest Factor ${a.crestFactorDb.toFixed(1)} dB). Das killt Dynamik und wirkt beim Mastering oft müde – etwas lockerer limitieren.`,
    });
  } else if (a.crestFactorDb > 22) {
    tips.push({
      level: "warning",
      text: `Der Track ist sehr dynamisch (Crest Factor ${a.crestFactorDb.toFixed(1)} dB). Auf kleinen Boxen könnten leise Parts untergehen – ggf. etwas mehr komprimieren.`,
    });
  }

  const loudnessTarget = -14;
  if (a.loudnessDb < loudnessTarget - 4) {
    tips.push({
      level: "warning",
      text: `Der Track ist recht leise (~${a.loudnessDb.toFixed(1)} dB RMS). Für Streaming wird meist um ${loudnessTarget} dB (LUFS-ähnlich) angepeilt – lauter mastern.`,
    });
  } else if (a.loudnessDb > loudnessTarget + 4) {
    tips.push({
      level: "warning",
      text: `Der Track ist sehr laut ausgesteuert (~${a.loudnessDb.toFixed(1)} dB RMS). Viele Plattformen normalisieren ohnehin auf Zielwerte – zu viel Loudness kostet oft nur Dynamik.`,
    });
  }

  FREQ_BANDS.forEach((band, i) => {
    const val = a.bandPercents[i];
    const [lo, hi] = band.ref;
    if (val < lo - 3) {
      tips.push({
        level: "warning",
        text: `Wenig Energie im Bereich "${band.name}" (${band.range[0]}–${band.range[1]} Hz). Der Track könnte in diesem Bereich dünn/schwach klingen.`,
      });
    } else if (val > hi + 3) {
      tips.push({
        level: "warning",
        text: `Viel Energie im Bereich "${band.name}" (${band.range[0]}–${band.range[1]} Hz). Kann matschig oder harsch wirken – im Mix gezielt absenken (EQ).`,
      });
    }
  });

  if (!lyrics.hasLyrics) {
    tips.push({
      level: "warning",
      text: "Kein Songtext eingegeben – Hook- und Songtitel-Erkennbarkeit konnten nicht geprüft werden. Für eine vollständige Analyse den Text ergänzen.",
    });
  } else {
    if (scores.hook !== null && scores.hook < 70) {
      tips.push({
        level: "warning",
        text: "Im Text ist keine klar wiederholte Hookline erkennbar. Eine Zeile (idealerweise mit dem Songtitel) 2–3x zu wiederholen erhöht den Wiedererkennungswert.",
      });
    }
    if (lyrics.hasTitle && scores.titel !== null && scores.titel < 100) {
      if (!lyrics.titleInLyrics) {
        tips.push({
          level: "critical",
          text: "Der Songtitel taucht im Text gar nicht auf. Hörer erinnern sich deutlich leichter, wenn der Titel tatsächlich gesungen wird.",
        });
      } else {
        tips.push({
          level: "warning",
          text: "Der Songtitel kommt zwar im Text vor, aber nicht in der am häufigsten wiederholten Zeile (Hook). Titel in die Hook zu holen stärkt den Wiedererkennungswert.",
        });
      }
    }
  }

  if (tips.length === 0) {
    tips.push({ level: "good", text: "Keine größeren technischen oder inhaltlichen Auffälligkeiten gefunden – solide Basis." });
  }

  return tips;
}

/* ---------- Submission recommendations ---------- */

function buildSubmissions(overallScore, targetStation) {
  const items = [
    {
      name: "Groover",
      desc: "Kostenpflichtige Einreichung bei Kuratoren, Playlists, Blogs und Radios – gibt garantiertes Feedback.",
    },
    {
      name: "SubmitHub",
      desc: "Einreichung bei Blogs, Playlist-Kuratoren und Radiosendern, Bezahlung meist nur bei Feedback/Ablehnung.",
    },
    {
      name: "MusoSoup",
      desc: "Alternative zu SubmitHub, u.a. für Playlists, YouTube-Kanäle und Radio.",
    },
    {
      name: "Spotify for Artists – Playlist-Einreichung",
      desc: "Kostenlose Einreichung für Spotify-eigene, redaktionelle Playlists (mind. 7 Tage vor Release).",
    },
  ];

  let note;
  if (overallScore >= 70) {
    note = "Der technische und inhaltliche Score ist solide – eine Einreichung ist aus heutiger Sicht realistisch.";
  } else if (overallScore >= 45) {
    note = "Der Track ist einreichbar, hat aber noch Luft nach oben – die Verbesserungsvorschläge oben zuerst umsetzen erhöht die Chancen.";
  } else {
    note = "Vor einer Einreichung lohnt es sich, erst die wichtigsten Verbesserungsvorschläge oben umzusetzen.";
  }

  if (targetStation && targetStation.trim()) {
    note += ` Bezogen auf "${targetStation.trim()}": das ist eine grobe, allgemeine Einschätzung – die tatsächliche Musikauswahl/Ausrichtung des Senders kennt nur der Sender selbst.`;
  }

  return { items, note };
}

/* ---------- Rendering ---------- */

function iconFor(level) {
  return ICONS[level] || ICONS.warning;
}

function renderMeter(container, { name, score, statusText }) {
  if (score === null) {
    const el = document.createElement("div");
    el.className = "meter";
    el.innerHTML = `
      <div class="meter-head">
        <span class="meter-name">${name}</span>
        <span class="meter-status">${statusText}</span>
      </div>
      <div class="meter-track"><div class="meter-fill" style="width:0%;background:var(--gridline)"></div></div>
    `;
    container.appendChild(el);
    return;
  }
  const status = statusForScore(score);
  const el = document.createElement("div");
  el.className = "meter";
  el.innerHTML = `
    <div class="meter-head">
      <span class="meter-name">${name}</span>
      <span class="meter-status" style="color:${status.color}">${iconFor(status.key)} ${status.label} · ${Math.round(score)}/100</span>
    </div>
    <div class="meter-track"><div class="meter-fill" style="width:${score}%;background:${status.color}"></div></div>
  `;
  container.appendChild(el);
}

function renderFreqChart(container, bandPercents) {
  container.innerHTML = "";
  const maxVal = Math.max(...bandPercents, ...FREQ_BANDS.map((b) => b.ref[1])) * 1.15;

  FREQ_BANDS.forEach((band, i) => {
    const val = bandPercents[i];
    const [refLo, refHi] = band.ref;
    const wrap = document.createElement("div");
    wrap.className = "freq-bar-wrap";

    const refZone = document.createElement("div");
    refZone.className = "freq-ref-zone";
    refZone.style.bottom = `${(refLo / maxVal) * 100}%`;
    refZone.style.height = `${((refHi - refLo) / maxVal) * 100}%`;
    refZone.title = `Referenzbereich: ${refLo}–${refHi}%`;

    const valueLabel = document.createElement("div");
    valueLabel.className = "freq-value";
    valueLabel.textContent = `${val.toFixed(1)}%`;

    const bar = document.createElement("div");
    bar.className = "freq-bar";
    bar.style.height = `${Math.max(2, (val / maxVal) * 100)}%`;
    bar.title = `${band.name}: ${val.toFixed(1)}% (Referenz ${refLo}–${refHi}%)`;

    const label = document.createElement("div");
    label.className = "freq-label";
    label.textContent = `${band.name}\n${band.range[0]}-${band.range[1]}Hz`;

    wrap.appendChild(refZone);
    wrap.appendChild(valueLabel);
    wrap.appendChild(bar);
    wrap.appendChild(label);
    container.appendChild(wrap);
  });
}

function renderTips(container, tips) {
  container.innerHTML = "";
  for (const tip of tips) {
    const li = document.createElement("li");
    const color =
      tip.level === "good" ? "var(--status-good)" : tip.level === "critical" ? "var(--status-critical)" : "var(--status-warning)";
    li.innerHTML = `<span style="color:${color}">${iconFor(tip.level)}</span><span>${tip.text}</span>`;
    container.appendChild(li);
  }
}

function renderSubmissions(listEl, hintEl, { items, note }) {
  hintEl.textContent = note;
  listEl.innerHTML = "";
  for (const item of items) {
    const li = document.createElement("li");
    li.innerHTML = `<div class="submit-name">${item.name}</div><div class="submit-desc">${item.desc}</div>`;
    listEl.appendChild(li);
  }
}

function renderBadges(container, badgeDefs) {
  container.innerHTML = "";
  for (const { label, score, mutedNote } of badgeDefs) {
    const tier = score === null ? { dots: "○ ○ ○", label: mutedNote || "Fehlt Info" } : badgeTier(score);
    const dotColor = score === null ? "var(--text-muted)" : statusForScore(score).color;
    const el = document.createElement("div");
    el.className = "badge";
    el.innerHTML = `
      <span class="badge-dots" style="color:${dotColor}">${tier.dots}</span>
      <span class="badge-text">
        <span class="badge-label">${label}</span>
        <span class="badge-tier">${tier.label}</span>
      </span>
    `;
    container.appendChild(el);
  }
}

/* ---------- KI-Songtextverbesserung (Cloudflare Worker, hält den API-Key serverseitig) ---------- */

// Nach dem Deploy des Workers (siehe worker/songtext-worker.js) die Worker-URL eintragen,
// z. B. "https://trackstar-songtext-worker.<dein-account>.workers.dev". Leer = Funktion deaktiviert.
const SONGTEXT_WORKER_URL = "";

async function requestImprovedLyrics(title, lyrics) {
  const res = await fetch(SONGTEXT_WORKER_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ title, lyrics }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) throw new Error(data.error || "Unbekannter Fehler bei der KI-Anfrage.");
  return data.improved;
}

/* ---------- Main flow ---------- */

const form = document.getElementById("analyze-form");
const statusLine = document.getElementById("status-line");
const analyzeBtn = document.getElementById("analyze-btn");
const freeResultsEl = document.getElementById("free-results");
const premiumResultsEl = document.getElementById("premium-results");
const unlockBtn = document.getElementById("unlock-btn");
const rewriteBtn = document.getElementById("rewrite-btn");
const rewriteStatus = document.getElementById("rewrite-status");
const rewriteOutput = document.getElementById("rewrite-output");

rewriteBtn.addEventListener("click", async () => {
  if (!SONGTEXT_WORKER_URL) {
    rewriteStatus.textContent = "Diese Funktion ist noch nicht eingerichtet (Backend fehlt noch).";
    return;
  }
  const title = document.getElementById("track-title").value;
  const lyricsRaw = document.getElementById("track-lyrics").value;

  rewriteBtn.disabled = true;
  rewriteStatus.textContent = "KI überarbeitet deinen Text…";
  rewriteOutput.hidden = true;

  try {
    const improved = await requestImprovedLyrics(title, lyricsRaw);
    rewriteOutput.textContent = improved;
    rewriteOutput.hidden = false;
    rewriteStatus.textContent = "";
  } catch (err) {
    rewriteStatus.textContent = "Fehler: " + (err && err.message ? err.message : "Unbekannter Fehler.");
  } finally {
    rewriteBtn.disabled = false;
  }
});

unlockBtn.addEventListener("click", () => {
  premiumResultsEl.hidden = false;
  premiumResultsEl.scrollIntoView({ behavior: "smooth", block: "start" });
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const fileInput = document.getElementById("audio-file");
  const file = fileInput.files[0];
  if (!file) return;

  const title = document.getElementById("track-title").value;
  const lyricsRaw = document.getElementById("track-lyrics").value;
  const targetStation = document.getElementById("target-station").value;

  analyzeBtn.disabled = true;
  statusLine.textContent = "Lade Audio…";

  try {
    const arrayBuffer = await file.arrayBuffer();
    statusLine.textContent = "Decodiere Audio…";
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioCtx();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));

    statusLine.textContent = "Analysiere Frequenzen & Lautheit…";
    await new Promise((r) => setTimeout(r, 10));
    const audioMetrics = analyzeAudioBuffer(audioBuffer);

    const lyrics = analyzeLyrics(lyricsRaw, title);

    const scores = {
      technik: scoreTechnik(audioMetrics),
      lautheit: scoreLautheit(audioMetrics),
      frequenz: scoreFrequenz(audioMetrics),
      hook: scoreHook(lyrics),
      titel: scoreTitel(lyrics),
    };

    const weighted = [
      { score: scores.technik, weight: 30 },
      { score: scores.lautheit, weight: 20 },
      { score: scores.frequenz, weight: 25 },
      { score: scores.hook, weight: 12.5 },
      { score: scores.titel, weight: 12.5 },
    ].filter((x) => x.score !== null);

    const totalWeight = weighted.reduce((a, x) => a + x.weight, 0);
    const overallScore = Math.round(weighted.reduce((a, x) => a + x.score * x.weight, 0) / totalWeight);

    const soundScore = combineScores([scores.technik, scores.frequenz]);
    const starPotentialScore = scores.lautheit;
    const hookScore = combineScores([scores.hook, scores.titel]);

    const grade = gradeForScore(overallScore);
    document.getElementById("star-rating").innerHTML = starRatingHtml(grade.stars);
    const heroTitleEl = document.getElementById("hero-title");
    heroTitleEl.textContent = grade.title;
    heroTitleEl.style.color = grade.color;
    document.getElementById("hero-desc").textContent = grade.desc;

    renderBadges(document.getElementById("badges"), [
      { label: "Sound", score: soundScore },
      { label: "Star-Potential", score: starPotentialScore },
      { label: "Hook", score: hookScore, mutedNote: "Songtext fehlt" },
    ]);

    const tips = buildTips(audioMetrics, lyrics, scores);
    const topTip = pickTopTip(tips);
    const teaserLabel = topTip.level === "good" ? "Stärke" : "Größter Hebel";
    document.getElementById("teaser-tip").innerHTML = `<span class="mark">✦ ${teaserLabel}</span> ${topTip.text}`;

    premiumResultsEl.hidden = true;

    const metersEl = document.getElementById("meters");
    metersEl.innerHTML = "";
    renderMeter(metersEl, { name: "Klangqualität / Sauberkeit", score: scores.technik });
    renderMeter(metersEl, { name: "Lautheit / Star-Potential", score: scores.lautheit });
    renderMeter(metersEl, { name: "Frequenzbalance", score: scores.frequenz });
    renderMeter(metersEl, {
      name: "Hook",
      score: scores.hook,
      statusText: scores.hook === null ? "Songtext fehlt" : "",
    });
    renderMeter(metersEl, {
      name: "Songtitel erkennbar",
      score: scores.titel,
      statusText: scores.titel === null ? (lyrics.hasLyrics ? "Songtitel fehlt" : "Songtext fehlt") : "",
    });

    renderFreqChart(document.getElementById("freq-chart"), audioMetrics.bandPercents);

    renderTips(document.getElementById("tips-list"), tips);

    const rewriteBlock = document.getElementById("rewrite-block");
    rewriteBlock.hidden = !lyrics.hasLyrics;
    document.getElementById("rewrite-status").textContent = "";
    document.getElementById("rewrite-output").hidden = true;

    const submissions = buildSubmissions(overallScore, targetStation);
    renderSubmissions(document.getElementById("submit-list"), document.getElementById("submit-hint"), submissions);

    freeResultsEl.hidden = false;
    freeResultsEl.scrollIntoView({ behavior: "smooth", block: "start" });
    statusLine.textContent = "";
    ctx.close();
  } catch (err) {
    console.error(err);
    statusLine.textContent = "Analyse fehlgeschlagen: " + (err && err.message ? err.message : "Unbekannter Fehler.");
  } finally {
    analyzeBtn.disabled = false;
  }
});
