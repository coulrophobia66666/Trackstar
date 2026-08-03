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
    return {
      stars: 5,
      title: "Star Potential",
      desc: "Richtig stark! Dein Track ist bereit für die große Bühne – so kannst du ihn einreichen.",
      color: "var(--status-good)",
      celebrate: true,
    };
  }
  if (score >= 60) {
    return {
      stars: 4,
      title: "Fast am Ziel",
      desc: "Du bist auf einem richtig guten Weg – mit ein paar Handgriffen holst du das letzte Stück raus.",
      color: "var(--status-good)",
    };
  }
  if (score >= 40) {
    return {
      stars: 3,
      title: "Noch Feinschliff nötig",
      desc: "Die Basis stimmt schon – mit den Tipps unten machst du daraus einen echten Kracher.",
      color: "var(--status-warning)",
    };
  }
  return {
    stars: 2,
    title: "Baustelle",
    desc: "Der Kern ist da, jetzt geht's ans Feilen – jeder Hit hat mal so angefangen.",
    color: "var(--status-critical)",
  };
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
  { name: "Sub-Bass", range: [20, 60] },
  { name: "Bass", range: [60, 250] },
  { name: "Low-Mid", range: [250, 500] },
  { name: "Mid", range: [500, 2000] },
  { name: "High-Mid", range: [2000, 4000] },
  { name: "Presence", range: [4000, 6000] },
  { name: "Brillanz", range: [6000, 16000] },
];

/* Referenzbereiche (% Energieanteil je Band) und Lautheits-Ziel je Genre. "" = allgemeiner
   Referenzbereich, wenn kein Genre gewählt wurde. Grobe, praxisnahe Richtwerte, keine exakte
   Norm - dienen als Orientierung, nicht als harte Regel. */
const GENRE_PROFILES = {
  "": { label: "Allgemein", loudnessTarget: -14, refs: [[2, 8], [14, 26], [10, 18], [20, 32], [10, 18], [5, 12], [4, 12]] },
  hiphop: {
    label: "Hip-Hop / Rap",
    loudnessTarget: -9,
    refs: [[4, 10], [18, 30], [9, 16], [18, 28], [9, 16], [5, 11], [3, 9]],
    fingerprint: { bpmRange: [70, 100], brightnessRange: [700, 1800], bassRatioRange: [20, 38], crestRange: [6, 15] },
  },
  pop: {
    label: "Pop",
    loudnessTarget: -11,
    refs: [[2, 7], [13, 22], [10, 18], [22, 34], [11, 19], [6, 13], [5, 13]],
    fingerprint: { bpmRange: [95, 130], brightnessRange: [1100, 2300], bassRatioRange: [14, 27], crestRange: [7, 16] },
  },
  edm: {
    label: "Electronic / EDM",
    loudnessTarget: -8,
    refs: [[6, 14], [20, 32], [8, 15], [16, 26], [9, 15], [4, 10], [4, 11]],
    fingerprint: { bpmRange: [118, 150], brightnessRange: [900, 2000], bassRatioRange: [24, 42], crestRange: [5, 11] },
  },
  rock: {
    label: "Rock / Metal",
    loudnessTarget: -9,
    refs: [[2, 6], [12, 20], [12, 20], [22, 32], [12, 20], [6, 13], [3, 9]],
    fingerprint: { bpmRange: [95, 145], brightnessRange: [1000, 2100], bassRatioRange: [13, 25], crestRange: [8, 17] },
  },
  acoustic: {
    label: "Akustik / Singer-Songwriter",
    loudnessTarget: -16,
    refs: [[1, 5], [10, 18], [12, 20], [22, 34], [12, 20], [6, 13], [4, 11]],
    fingerprint: { bpmRange: [55, 115], brightnessRange: [850, 1900], bassRatioRange: [9, 22], crestRange: [10, 22] },
  },
};

function genreProfile(genreKey) {
  return GENRE_PROFILES[genreKey] || GENRE_PROFILES[""];
}

/* ---------- Automatische Genre-Schätzung (Tempo, Klangfarbe, Bassanteil, Dynamik) ----------
   Kein trainiertes ML-Modell, sondern ein grober Signal-Fingerabdruck-Vergleich mit den
   Genre-Referenzwerten oben. Läuft komplett lokal, ohne dass Audio das Gerät verlässt. */

function estimateTempoBpm(mono, sampleRate) {
  const windowSamples = Math.max(1, Math.round(sampleRate * 0.01)); // 10ms Fenster
  const envLen = Math.floor(mono.length / windowSamples);
  if (envLen < 50) return { bpm: null, confidence: 0 };

  const env = new Float64Array(envLen);
  for (let i = 0; i < envLen; i++) {
    const start = i * windowSamples;
    const end = Math.min(start + windowSamples, mono.length);
    let sum = 0;
    for (let j = start; j < end; j++) sum += Math.abs(mono[j]);
    env[i] = sum / (end - start);
  }

  const onset = new Float64Array(envLen);
  for (let i = 1; i < envLen; i++) onset[i] = Math.max(0, env[i] - env[i - 1]);

  const envRate = 1 / 0.01;
  const minLag = Math.max(1, Math.round((envRate * 60) / 180)); // 180 BPM
  const maxLag = Math.round((envRate * 60) / 60); // 60 BPM

  let bestLag = 0;
  let bestScore = -Infinity;
  let scoreSum = 0;
  let lagCount = 0;
  for (let lag = minLag; lag <= maxLag && lag < envLen; lag++) {
    let score = 0;
    for (let i = lag; i < envLen; i++) score += onset[i] * onset[i - lag];
    scoreSum += score;
    lagCount++;
    if (score > bestScore) {
      bestScore = score;
      bestLag = lag;
    }
  }
  if (bestLag === 0 || lagCount === 0) return { bpm: null, confidence: 0 };

  const avgScore = scoreSum / lagCount || 1;
  const confidence = Math.max(0, Math.min(1, (bestScore / avgScore - 1) / 3));
  const bpm = 60 / (bestLag / envRate);
  return { bpm, confidence };
}

function bandCenterHz(band) {
  return Math.sqrt(band.range[0] * band.range[1]);
}

function normDist(val, [lo, hi]) {
  const mid = (lo + hi) / 2;
  const half = (hi - lo) / 2 || 1;
  return Math.max(0, Math.abs(val - mid) / half - 1);
}

function estimateGenre({ bpm, brightnessHz, bassRatioPercent, crestFactorDb }) {
  let best = null;
  let bestDist = Infinity;
  for (const [key, profile] of Object.entries(GENRE_PROFILES)) {
    if (!profile.fingerprint) continue;
    const fp = profile.fingerprint;
    let dist = normDist(brightnessHz, fp.brightnessRange) + normDist(bassRatioPercent, fp.bassRatioRange) + normDist(crestFactorDb, fp.crestRange);
    dist += bpm !== null ? normDist(bpm, fp.bpmRange) : 0.5;
    if (dist < bestDist) {
      bestDist = dist;
      best = key;
    }
  }
  const lowConfidence = best === null || bestDist > 3.5;
  return { key: lowConfidence ? "" : best, bpm, lowConfidence };
}

function hann(n) {
  const w = new Float64Array(n);
  for (let i = 0; i < n; i++) w[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (n - 1));
  return w;
}

// Ungegatete Ganzsong-RMS zieht den Durchschnitt bei jedem Track mit Intro/Outro/Pausen
// systematisch nach unten (fast jeder Song hat davon etwas) - das fuehrte dazu, dass praktisch
// jeder Track als "zu leise" markiert wurde, unabhaengig vom tatsaechlichen Master. Eine grobe
// Annaeherung an gegatete Lautheit (aehnlich dem Prinzip hinter LUFS-Messung, ohne vollstaendige
// K-Gewichtung) behebt den systematischen Bias: nur Passagen mit tatsaechlichem Signal zaehlen.
function computeGatedLoudnessDb(mono, sampleRate) {
  const blockSamples = Math.max(1, Math.round(sampleRate * 0.4));
  const blocks = [];
  for (let i = 0; i + blockSamples <= mono.length; i += blockSamples) {
    let sum = 0;
    for (let j = i; j < i + blockSamples; j++) sum += mono[j] * mono[j];
    blocks.push(sum / blockSamples);
  }
  if (blocks.length === 0) {
    let sum = 0;
    for (let i = 0; i < mono.length; i++) sum += mono[i] * mono[i];
    return 10 * Math.log10(sum / Math.max(1, mono.length) || 1e-18);
  }

  const absoluteGateMS = Math.pow(10, -70 / 10);
  const afterAbsolute = blocks.filter((ms) => ms > absoluteGateMS);
  const gated1 = afterAbsolute.length > 0 ? afterAbsolute : blocks;

  const meanMS = gated1.reduce((a, b) => a + b, 0) / gated1.length;
  const relativeGateMS = meanMS * Math.pow(10, -20 / 10);
  const afterRelative = gated1.filter((ms) => ms > relativeGateMS);
  const finalBlocks = afterRelative.length > 0 ? afterRelative : gated1;

  const finalMeanMS = finalBlocks.reduce((a, b) => a + b, 0) / finalBlocks.length;
  return 10 * Math.log10(finalMeanMS || 1e-18);
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
  const loudnessDb = computeGatedLoudnessDb(mono, sampleRate);
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

  const edgeSilence = analyzeEdgeSilence(mono, sampleRate);

  const tempo = estimateTempoBpm(mono, sampleRate);
  const brightnessHz = bandPercents.reduce((sum, pct, i) => sum + (pct / 100) * bandCenterHz(FREQ_BANDS[i]), 0);
  const bassRatioPercent = bandPercents[0] + bandPercents[1];
  const genreGuess = estimateGenre({
    bpm: tempo.confidence > 0.15 ? tempo.bpm : null,
    brightnessHz,
    bassRatioPercent,
    crestFactorDb,
  });

  return {
    duration: buffer.duration,
    peak,
    rms,
    clippingRatio,
    loudnessDb,
    crestFactorDb,
    bandPercents,
    framesUsed,
    introSilenceMs: edgeSilence.introSilenceMs,
    outroEndsAbruptly: edgeSilence.outroEndsAbruptly,
    estimatedBpm: tempo.bpm,
    estimatedGenre: genreGuess.key,
    estimatedGenreLowConfidence: genreGuess.lowConfidence,
  };
}

function analyzeEdgeSilence(mono, sampleRate) {
  const silenceThreshold = 0.02;
  const windowSamples = Math.max(1, Math.round(sampleRate * 0.05));

  let leadingSilentWindows = 0;
  for (let i = 0; i < mono.length; i += windowSamples) {
    const end = Math.min(i + windowSamples, mono.length);
    let sum = 0;
    for (let j = i; j < end; j++) sum += Math.abs(mono[j]);
    const avg = sum / (end - i);
    if (avg > silenceThreshold) break;
    leadingSilentWindows++;
  }
  const introSilenceMs = (leadingSilentWindows * windowSamples * 1000) / sampleRate;

  const tailSamples = Math.min(mono.length, Math.round(sampleRate * 0.3));
  let tailSum = 0;
  for (let j = mono.length - tailSamples; j < mono.length; j++) tailSum += Math.abs(mono[j]);
  const tailAvg = tailSamples > 0 ? tailSum / tailSamples : 0;
  const outroEndsAbruptly = tailAvg > silenceThreshold * 1.5;

  return { introSilenceMs, outroEndsAbruptly };
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
  // Bewertung um einen Idealpunkt statt einem "Idealfenster" - ein flacher Bereich, in dem
  // jeder Wert 100% gibt, wirkt schnell unglaubwuerdig grob (fast jeder saubere Track landet
  // sonst exakt bei 100%). So gibt's fast nie eine glatte Bestnote, sondern einen nuancierten Wert.
  const clipPenalty = Math.min(60, a.clippingRatio * 2800);

  const idealCrest = 12.5;
  const crestDeviation = Math.abs(a.crestFactorDb - idealCrest);
  const crestPenalty = crestDeviation * crestDeviation * 0.22;

  return Math.max(0, Math.min(100, 100 - clipPenalty - crestPenalty));
}

function scoreLautheit(a, loudnessTarget) {
  const diff = Math.abs(a.loudnessDb - loudnessTarget);
  let score = 100 - diff * 6;
  return Math.max(0, Math.min(100, score));
}

function scoreFrequenz(a, refs) {
  let penalty = 0;
  refs.forEach(([lo, hi], i) => {
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

function buildTips(a, lyrics, scores, profile) {
  const tips = [];
  const loudnessTarget = profile.loudnessTarget;

  if (a.clippingRatio > 0.005) {
    const fix = "Reduziere den Gain vor dem Limiter oder senke das Limiter-Ceiling auf ca. -1 dBTP.";
    tips.push({
      level: "critical",
      problem: `Der Track clippt hörbar (${(a.clippingRatio * 100).toFixed(2)}% der Samples am Limit).`,
      fix,
      text: `Der Track clippt hörbar (${(a.clippingRatio * 100).toFixed(2)}% der Samples am Limit). ${fix}`,
    });
  } else if (a.clippingRatio > 0.0005) {
    const fix = "Für Streaming-Plattformen etwas mehr Headroom lassen (True-Peak-Limiter, Ceiling ca. -1 dBTP).";
    tips.push({
      level: "warning",
      problem: "Vereinzelte Samples liegen am Limit.",
      fix,
      text: `Vereinzelte Samples liegen am Limit. ${fix}`,
    });
  }

  if (a.crestFactorDb < 6) {
    const fix = "Etwas lockerer limitieren, damit mehr Dynamik erhalten bleibt.";
    tips.push({
      level: "critical",
      problem: `Der Track ist stark überkomprimiert (Crest Factor ${a.crestFactorDb.toFixed(1)} dB).`,
      fix,
      text: `Der Track ist stark überkomprimiert (Crest Factor ${a.crestFactorDb.toFixed(1)} dB). Das killt Dynamik und wirkt beim Mastering oft müde – ${fix.charAt(0).toLowerCase()}${fix.slice(1)}`,
    });
  } else if (a.crestFactorDb > 22) {
    const fix = "Ggf. etwas mehr komprimieren, damit leise Parts auf kleinen Boxen nicht untergehen.";
    tips.push({
      level: "warning",
      problem: `Der Track ist sehr dynamisch (Crest Factor ${a.crestFactorDb.toFixed(1)} dB).`,
      fix,
      text: `Der Track ist sehr dynamisch (Crest Factor ${a.crestFactorDb.toFixed(1)} dB). ${fix}`,
    });
  }

  if (a.loudnessDb < loudnessTarget - 4) {
    const fix = `Auf ca. ${loudnessTarget} dB zumastern.`;
    tips.push({
      level: "warning",
      problem: `Der Track ist recht leise (~${a.loudnessDb.toFixed(1)} dB).`,
      fix,
      text: `Der Track ist recht leise (~${a.loudnessDb.toFixed(1)} dB). Spotify, Apple Music & Co. normalisieren zwar automatisch auf ein Zielniveau, aber wenn dein Master schon sehr leise angeliefert wird, verlierst du dabei Punch im Vergleich zu lauter gemasterten Tracks in derselben Playlist. ${fix}`,
    });
  } else if (a.loudnessDb > loudnessTarget + 4) {
    const fix = "Beim Mastern nicht zusätzlich lauter fahren - die Extra-Lautheit wird eh weggenormalisiert, kostet nur Dynamik.";
    tips.push({
      level: "warning",
      problem: `Der Track ist sehr laut ausgesteuert (~${a.loudnessDb.toFixed(1)} dB).`,
      fix,
      text: `Der Track ist sehr laut ausgesteuert (~${a.loudnessDb.toFixed(1)} dB). Streaming-Plattformen wie Spotify (Ziel ca. -14 LUFS) und YouTube normalisieren automatisch nach unten. ${fix}`,
    });
  }

  if (a.introSilenceMs > 1500) {
    const fix = "Stille am Anfang kürzen oder direkt mit Sound starten.";
    tips.push({
      level: "warning",
      problem: `Der Track startet mit ca. ${(a.introSilenceMs / 1000).toFixed(1)} Sekunden Stille.`,
      fix,
      text: `Der Track startet mit ca. ${(a.introSilenceMs / 1000).toFixed(1)} Sekunden Stille. Auf Playlists/Radio, wo Tracks oft direkt ineinander übergehen, kann das wie ein Fehler wirken oder Hörer verlieren, bevor überhaupt was passiert. ${fix}`,
    });
  }
  if (a.outroEndsAbruptly) {
    const fix = "Ein bewusstes Ende setzen oder ein kurzes Fade-out einbauen.";
    tips.push({
      level: "warning",
      problem: "Der Track endet abrupt/hart, ohne Fade-out oder klaren Schluss.",
      fix,
      text: `Der Track endet abrupt/hart, ohne Fade-out oder klaren Schluss. Für saubere Übergänge (Playlists, DJ-Sets, Radio) wirkt das professioneller. ${fix}`,
    });
  }

  // Statt fuenf fast identischen "probier X dB bei Y Hz"-Tipps hintereinander (unverstaendlich
  // ohne EQ-Vorwissen): ein einziger zusammenfassender Tipp, der auf den EQ-Editor verweist, wo
  // die konkreten Werte bereits als Vorschlag vorausgefuellt sind und live anhoerbar.
  const offBands = [];
  FREQ_BANDS.forEach((band, i) => {
    const val = a.bandPercents[i];
    const [lo, hi] = profile.refs[i];
    if (val < lo - 3) offBands.push(`${band.name} (zu wenig)`);
    else if (val > hi + 3) offBands.push(`${band.name} (zu viel)`);
  });
  if (offBands.length > 0) {
    const fix = "Nutze den EQ-Editor weiter unten – dort ist schon ein Vorschlag aus dieser Analyse vorausgefüllt, du kannst live reinhören und direkt anpassen.";
    tips.push({
      level: offBands.length >= 4 ? "critical" : "warning",
      problem: `Frequenzbalance weicht in ${offBands.length} Bereich${offBands.length > 1 ? "en" : ""} vom Referenzbereich ab (${offBands.join(", ")}).`,
      fix,
      text: `Frequenzbalance weicht in ${offBands.length} Bereich${offBands.length > 1 ? "en" : ""} vom Referenzbereich ab: ${offBands.join(", ")}. ${fix}`,
    });
  }

  if (!lyrics.hasLyrics) {
    const fix = "Songtext ergänzen, dann können Hook & Songtitel mitbewertet werden.";
    tips.push({
      level: "warning",
      problem: "Kein Songtext eingegeben – Hook- und Songtitel-Erkennbarkeit konnten nicht geprüft werden.",
      fix,
      text: `Kein Songtext eingegeben – Hook- und Songtitel-Erkennbarkeit konnten nicht geprüft werden. ${fix}`,
    });
  } else {
    if (scores.hook !== null && scores.hook < 70) {
      const fix = "Eine Zeile (idealerweise mit dem Songtitel) 2–3x wiederholen, um eine klare Hook zu schaffen.";
      tips.push({
        level: "warning",
        problem: "Im Text ist keine klar wiederholte Hookline erkennbar.",
        fix,
        text: `Im Text ist keine klar wiederholte Hookline erkennbar. ${fix} Das erhöht den Wiedererkennungswert.`,
      });
    }
    if (lyrics.hasTitle && scores.titel !== null && scores.titel < 100) {
      if (!lyrics.titleInLyrics) {
        const fix = "Den Songtitel tatsächlich im Text singen/erwähnen.";
        tips.push({
          level: "critical",
          problem: "Der Songtitel taucht im Text gar nicht auf.",
          fix,
          text: `Der Songtitel taucht im Text gar nicht auf. Hörer erinnern sich deutlich leichter, wenn der Titel tatsächlich gesungen wird. ${fix}`,
        });
      } else {
        const fix = "Den Titel in die am häufigsten wiederholte Zeile (Hook) holen.";
        tips.push({
          level: "warning",
          problem: "Der Songtitel kommt zwar im Text vor, aber nicht in der Hook.",
          fix,
          text: `Der Songtitel kommt zwar im Text vor, aber nicht in der am häufigsten wiederholten Zeile (Hook). ${fix} Das stärkt den Wiedererkennungswert.`,
        });
      }
    }
  }

  if (tips.length === 0) {
    tips.push({
      level: "good",
      problem: "Keine größeren technischen oder inhaltlichen Auffälligkeiten gefunden – solide Basis.",
      fix: "",
      text: "Keine größeren technischen oder inhaltlichen Auffälligkeiten gefunden – solide Basis.",
    });
  }

  return tips;
}

/* ---------- Fazit als Wegweiser ---------- */

function buildFazit(overallScore, tips) {
  const actionable = tips
    .filter((t) => t.level !== "good")
    .sort((a, b) => TIP_LEVEL_RANK[a.level] - TIP_LEVEL_RANK[b.level])
    .slice(0, 5);

  let intro;
  if (overallScore >= 70) intro = `Dein Track steht technisch und inhaltlich solide da (Score ${overallScore}/100).`;
  else if (overallScore >= 45) intro = `Dein Track hat eine gute Basis, aber noch Luft nach oben (Score ${overallScore}/100).`;
  else intro = `Dein Track braucht vor einer Einreichung noch Arbeit (Score ${overallScore}/100).`;

  const stepsIntro = actionable.length > 0 ? "So gehst du vor, der Reihe nach:" : "";

  const closing =
    actionable.length > 0
      ? "Arbeite die Punkte einfach von oben nach unten ab, dann bist du dem einreichfertigen Ergebnis jedes Mal ein Stück näher – dein Fahrplan, kein Grund zur Sorge."
      : "Keine größeren offenen Punkte – dein Track ist bereit für die Einreichung.";

  // fix statt text: nur die Handlungsanweisung, ohne die Diagnose aus der Tipps-Liste oben
  // wortgleich zu wiederholen - macht den Wegweiser zu einer eigenstaendigen Checkliste.
  return { intro, stepsIntro, steps: actionable.map((t) => t.fix || t.problem), closing };
}

function renderFazit(container, fazit) {
  const stepsIntroHtml = fazit.stepsIntro ? `<p class="fazit-steps-intro">${fazit.stepsIntro}</p>` : "";
  const stepsHtml =
    fazit.steps.length > 0 ? `<ol class="fazit-steps">${fazit.steps.map((s) => `<li>${s}</li>`).join("")}</ol>` : "";
  container.innerHTML = `<p>${fazit.intro}</p>${stepsIntroHtml}${stepsHtml}<p class="fazit-closing">${fazit.closing}</p>`;
}

/* ---------- Submission recommendations ---------- */

/* ---------- Erfolge & Belohnung ---------- */

function buildAchievements(audioMetrics, scores, loudnessTarget) {
  const list = [];
  if (audioMetrics.clippingRatio < 0.0005) list.push({ emoji: "🧼", label: "Kristallklar" });
  if (Math.abs(audioMetrics.loudnessDb - loudnessTarget) <= 1) list.push({ emoji: "🎯", label: "Punktgenau" });
  if (scores.hook === 100) list.push({ emoji: "🪝", label: "Hook sitzt" });
  if (scores.frequenz >= 85) list.push({ emoji: "🌈", label: "Ausgewogen" });
  if (scores.titel === 100) list.push({ emoji: "🏷️", label: "Wiedererkennbar" });
  return list;
}

function renderAchievements(container, achievements) {
  if (!container) return;
  if (!achievements.length) {
    container.hidden = true;
    container.innerHTML = "";
    return;
  }
  container.hidden = false;
  container.innerHTML = achievements.map((a) => `<span class="achievement-badge">${a.emoji} ${a.label}</span>`).join("");
}

function fireConfetti(container) {
  if (!container) return;
  const colors = ["#cda86b", "#e8caa0", "#4cc38a", "#f3efe6"];
  for (let i = 0; i < 26; i++) {
    const piece = document.createElement("div");
    piece.className = "confetti-piece";
    piece.style.left = Math.random() * 100 + "%";
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDelay = Math.random() * 0.25 + "s";
    piece.style.setProperty("--rot", Math.round(Math.random() * 360) + "deg");
    container.appendChild(piece);
    setTimeout(() => piece.remove(), 2000);
  }
}

const CHECK_COUNT_KEY = "overhertz_checks_done";

function incrementCheckCount() {
  const n = parseInt(localStorage.getItem(CHECK_COUNT_KEY) || "0", 10) + 1;
  localStorage.setItem(CHECK_COUNT_KEY, String(n));
  return n;
}

function renderStreakNote(n) {
  const el = document.getElementById("streak-note");
  if (!el) return;
  if (!n || n < 1) {
    el.textContent = "";
    return;
  }
  el.textContent =
    n === 1
      ? "✦ Dein erster Check auf Overhertz – willkommen!"
      : `🔥 Das ist bereits dein ${n}. Check auf Overhertz!`;
}

function buildSubmissions(overallScore, genreLabel) {
  const hasGenre = genreLabel && genreLabel !== "Allgemein";
  const genreSuffix = hasGenre ? ` (${genreLabel})` : "";
  const ready = overallScore >= 70;
  const mid = overallScore >= 45;

  const items = [
    {
      name: "Groover",
      desc: "Kostenpflichtige Einreichung bei Kuratoren, Playlists, Blogs und Radios – gibt garantiertes Feedback.",
      reason: ready
        ? `Score ${overallScore}/100${genreSuffix} ist stark genug, um bezahltes Kuratoren-Feedback wirklich auszunutzen.`
        : `Bei ${overallScore}/100 lohnt sich das bezahlte Feedback erst, nachdem die Tipps oben umgesetzt sind – sonst zahlst du für Hinweise, die du hier schon kostenlos hast.`,
    },
    {
      name: "SubmitHub",
      desc: "Einreichung bei Blogs, Playlist-Kuratoren und Radiosendern, Bezahlung meist nur bei Feedback/Ablehnung.",
      reason: hasGenre
        ? `Kuratoren lassen sich dort nach Genre filtern – für ${genreLabel} findest du gezielt passende.`
        : "Kuratoren lassen sich dort nach Genre filtern, sobald eins feststeht (oben im Formular wählbar).",
    },
    {
      name: "MusoSoup",
      desc: "Alternative zu SubmitHub, u.a. für Playlists, YouTube-Kanäle und Radio.",
      reason: "Guter Zweitkanal parallel zu SubmitHub – andere Kuratoren-Datenbank, kostet nichts extra, sich bei beiden einzutragen.",
    },
    {
      name: "Spotify for Artists – Playlist-Einreichung",
      desc: "Kostenlose Einreichung für Spotify-eigene, redaktionelle Playlists (mind. 7 Tage vor Release).",
      reason: ready
        ? `Bei ${overallScore}/100 realistische Chance auf redaktionelle Playlists – kostet nichts, unbedingt mitnehmen.`
        : mid
          ? `Bei ${overallScore}/100 ist die Chance auf redaktionelle Playlists noch begrenzt, aber die Einreichung ist kostenlos – schadet nicht, auch parallel an den Tipps oben zu arbeiten.`
          : `Bei ${overallScore}/100 realistisch eher nicht – Einreichung ist zwar kostenlos, aber die Tipps oben zuerst umsetzen erhöht die Chancen deutlich.`,
    },
  ];

  let note;
  if (ready) {
    note = `Der technische und inhaltliche Score ist solide (${overallScore}/100)${genreSuffix} – eine Einreichung ist aus heutiger Sicht realistisch.`;
  } else if (mid) {
    note = `Der Track ist einreichbar (${overallScore}/100)${genreSuffix}, hat aber noch Luft nach oben – die Verbesserungsvorschläge oben zuerst umsetzen erhöht die Chancen.`;
  } else {
    note = `Vor einer Einreichung (aktuell ${overallScore}/100${genreSuffix}) lohnt es sich, erst die wichtigsten Verbesserungsvorschläge oben umzusetzen.`;
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
      <span class="meter-status" style="color:${status.color}">${iconFor(status.key)} ${status.label} · ${score.toFixed(1)}/100</span>
    </div>
    <div class="meter-track"><div class="meter-fill" style="width:0%;background:${status.color}"></div></div>
  `;
  container.appendChild(el);
  const fill = el.querySelector(".meter-fill");
  requestAnimationFrame(() => requestAnimationFrame(() => (fill.style.width = score + "%")));
}

function renderFreqChart(container, bandPercents, refs) {
  container.innerHTML = "";
  const maxVal = Math.max(...bandPercents, ...refs.map((r) => r[1])) * 1.15;

  FREQ_BANDS.forEach((band, i) => {
    const val = bandPercents[i];
    const [refLo, refHi] = refs[i];
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
    li.className = "submit-row";
    li.innerHTML = `<span class="submit-row-name">${item.name}</span><span class="submit-row-reason">${item.reason}</span>`;
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
const SONGTEXT_WORKER_URL = "https://trackstar.coulrophobia66666.workers.dev/";

let lastAnalysis = null;

async function requestKiEinschaetzung(title, lyrics, metrics) {
  const res = await fetch(SONGTEXT_WORKER_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ title, lyrics, metrics }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) throw new Error(data.error || "Unbekannter Fehler bei der KI-Anfrage.");
  return data;
}

/* ---------- Konten, Credits & Pro-Abo (D1 + Stripe über den Worker) ---------- */

const WORKER_BASE = SONGTEXT_WORKER_URL.replace(/\/?$/, "/");
const TOKEN_KEY = "overhertz_token";
const ANALYSIS_SNAPSHOT_KEY = "overhertz_analysis_snapshot";

let currentAnalysisSnapshot = null;
let currentUser = null; // { email, plan, credits, checksUsedPeriod, planRenewsAt, proQuota } oder null

function getToken() {
  return localStorage.getItem(TOKEN_KEY) || "";
}
function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function apiFetch(path, options = {}) {
  const headers = Object.assign({ "content-type": "application/json" }, options.headers || {});
  const token = getToken();
  if (token) headers["Authorization"] = "Bearer " + token;
  let res;
  try {
    res = await fetch(WORKER_BASE + path, Object.assign({}, options, { headers }));
  } catch {
    return { ok: false, status: 0, data: { error: "Server nicht erreichbar." } };
  }
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

const accountBar = document.getElementById("account-bar");
const authCard = document.getElementById("auth-card");
const authStatus = document.getElementById("auth-status");
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const authToggleBtn = document.getElementById("account-toggle");
const logoutBtn = document.getElementById("logout-btn");
const pricingCard = document.getElementById("pricing-card");
const pricingStatus = document.getElementById("pricing-status");

function renderAccountBar() {
  if (!accountBar) return;
  accountBar.innerHTML = "";
  if (currentUser) {
    const quotaText =
      currentUser.plan === "pro" || currentUser.plan === "pro_annual"
        ? `${currentUser.proQuota - currentUser.checksUsedPeriod}/${currentUser.proQuota} Checks diesen Monat`
        : `${currentUser.credits} Credit${currentUser.credits === 1 ? "" : "s"}`;
    const planLabel = { free: "Free", pro: "Pro", pro_annual: "Pro (jährlich)" }[currentUser.plan] || currentUser.plan;
    accountBar.innerHTML = `
      <span class="account-info"><strong>${currentUser.email}</strong> · ${planLabel} · ${quotaText}</span>
      <button type="button" id="logout-btn" class="account-btn">Abmelden</button>
    `;
    document.getElementById("logout-btn").addEventListener("click", handleLogout);
  } else {
    accountBar.innerHTML = `<button type="button" id="account-toggle" class="account-btn">Login / Registrieren</button>`;
    document.getElementById("account-toggle").addEventListener("click", () => toggleAuthCard());
  }
}

function toggleAuthCard(forceOpen) {
  if (!authCard) return;
  authCard.hidden = forceOpen === true ? false : !authCard.hidden;
  if (!authCard.hidden) authCard.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function refreshAccount() {
  if (!getToken()) {
    currentUser = null;
    renderAccountBar();
    return;
  }
  const { ok, data } = await apiFetch("auth/me", { method: "GET" });
  if (ok) {
    currentUser = data.user;
  } else {
    currentUser = null;
    setToken("");
  }
  renderAccountBar();
}

async function handleLogout() {
  await apiFetch("auth/logout", { method: "POST" });
  setToken("");
  currentUser = null;
  renderAccountBar();
}

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;
    authStatus.textContent = "Einloggen…";
    const { ok, data } = await apiFetch("auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
    if (ok) {
      setToken(data.token);
      currentUser = data.user;
      renderAccountBar();
      authCard.hidden = true;
      authStatus.textContent = "";
    } else {
      authStatus.textContent = data.error || "Login fehlgeschlagen.";
    }
  });
}

if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("register-email").value;
    const password = document.getElementById("register-password").value;
    authStatus.textContent = "Konto wird erstellt…";
    const { ok, data } = await apiFetch("auth/register", { method: "POST", body: JSON.stringify({ email, password }) });
    if (ok) {
      setToken(data.token);
      currentUser = data.user;
      renderAccountBar();
      authCard.hidden = true;
      authStatus.textContent = "";
    } else {
      authStatus.textContent = data.error || "Registrierung fehlgeschlagen.";
    }
  });
}

document.querySelectorAll(".plan-select-btn").forEach((btn) => {
  btn.addEventListener("click", async () => {
    if (!currentUser) {
      toggleAuthCard(true);
      pricingStatus.textContent = "Bitte zuerst einloggen oder registrieren.";
      return;
    }
    pricingStatus.textContent = "Weiterleitung zur Zahlung…";
    if (currentAnalysisSnapshot) sessionStorage.setItem(ANALYSIS_SNAPSHOT_KEY, JSON.stringify(currentAnalysisSnapshot));
    const { ok, data } = await apiFetch("create-checkout-session", {
      method: "POST",
      body: JSON.stringify({ plan: btn.dataset.plan }),
    });
    if (ok && data.url) {
      window.location.href = data.url;
    } else {
      pricingStatus.textContent = data.error || "Zahlung konnte nicht gestartet werden.";
    }
  });
});

function openPricing(message) {
  if (pricingCard) {
    pricingCard.hidden = false;
    pricingStatus.textContent = message || "";
    pricingCard.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

async function tryConsumeCredit() {
  return apiFetch("consume-credit", { method: "POST" });
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
const rewriteResult = document.getElementById("rewrite-result");
const rewriteOutput = document.getElementById("rewrite-output");
const rewriteClassification = document.getElementById("rewrite-classification");
const rewriteTitleIdeas = document.getElementById("rewrite-title-ideas");

let genreManuallySet = false;
const trackGenreSelect = document.getElementById("track-genre");
trackGenreSelect.addEventListener("change", () => {
  genreManuallySet = true;
  if (currentAnalysisSnapshot) {
    const unlockedNow = !premiumResultsEl.hidden;
    renderAnalysis(Object.assign({}, currentAnalysisSnapshot, { genre: trackGenreSelect.value }), { unlockedPremium: unlockedNow });
  }
});

function renderAnalysis({ title, lyricsRaw, audioMetrics, genre }, { unlockedPremium }) {
  const lyrics = analyzeLyrics(lyricsRaw, title);
  const profile = genreProfile(genre);

  const scores = {
    technik: scoreTechnik(audioMetrics),
    lautheit: scoreLautheit(audioMetrics, profile.loudnessTarget),
    frequenz: scoreFrequenz(audioMetrics, profile.refs),
    hook: scoreHook(lyrics),
    titel: scoreTitel(lyrics),
  };

  // Hook & Songtitel sind die wichtigsten Wiedererkennungs-Hebel, deshalb zusammen die Haelfte
  // des Gesamtscores - nicht nur ein Nebenaspekt neben den technischen Werten.
  const weighted = [
    { score: scores.technik, weight: 18 },
    { score: scores.lautheit, weight: 12 },
    { score: scores.frequenz, weight: 20 },
    { score: scores.hook, weight: 25 },
    { score: scores.titel, weight: 25 },
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

  if (grade.celebrate) {
    fireConfetti(document.getElementById("confetti-layer"));
  }

  renderBadges(document.getElementById("badges"), [
    { label: "Sound", score: soundScore },
    { label: "Star-Potential", score: starPotentialScore },
    { label: "Hook", score: hookScore, mutedNote: "Songtext fehlt" },
  ]);

  const achievements = buildAchievements(audioMetrics, scores, profile.loudnessTarget);
  renderAchievements(document.getElementById("achievements"), achievements);

  initEqEditor(audioMetrics, profile);

  const tips = buildTips(audioMetrics, lyrics, scores, profile);
  const topTip = pickTopTip(tips);
  const teaserLabel = topTip.level === "good" ? "Stärke" : "Größtes Problem";
  document.getElementById("teaser-tip").innerHTML = `<span class="mark">✦ ${teaserLabel}</span> ${topTip.problem}`;

  lastAnalysis = {
    overallScore,
    soundScore,
    starPotentialScore,
    hookScore,
    topIssues: tips.filter((t) => t.level !== "good").map((t) => t.text),
  };

  currentAnalysisSnapshot = { title, lyricsRaw, audioMetrics, genre };

  premiumResultsEl.hidden = !unlockedPremium;

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

  const detectedGenreEl = document.getElementById("detected-genre");
  if (audioMetrics.estimatedGenre && !audioMetrics.estimatedGenreLowConfidence) {
    const bpmText = audioMetrics.estimatedBpm ? `, ~${Math.round(audioMetrics.estimatedBpm)} BPM` : "";
    detectedGenreEl.textContent = `Automatisch erkannt: ${genreProfile(audioMetrics.estimatedGenre).label}${bpmText} (Schätzung anhand Tempo, Klangfarbe & Bassanteil – oben im Formular korrigierbar).`;
  } else if (audioMetrics.estimatedBpm) {
    detectedGenreEl.textContent = `Tempo gemessen: ~${Math.round(audioMetrics.estimatedBpm)} BPM. Genre nicht eindeutig automatisch bestimmbar – oben im Formular manuell wählen für passendere Referenzwerte.`;
  } else {
    detectedGenreEl.textContent = "";
  }

  renderFreqChart(document.getElementById("freq-chart"), audioMetrics.bandPercents, profile.refs);
  renderTips(document.getElementById("tips-list"), tips);

  renderFazit(document.getElementById("fazit-block"), buildFazit(overallScore, tips));

  const rewriteBlock = document.getElementById("rewrite-block");
  rewriteBlock.hidden = !lyrics.hasLyrics;
  document.getElementById("rewrite-status").textContent = "";
  document.getElementById("rewrite-result").hidden = true;

  const vocalsBlockEl = document.getElementById("vocals-block");
  if (vocalsBlockEl) {
    vocalsBlockEl.hidden = !lyrics.hasLyrics;
    document.getElementById("vocals-status").textContent = "";
    document.getElementById("vocals-result").hidden = true;
    document.getElementById("vocals-choice").hidden = false;
  }

  const submissions = buildSubmissions(overallScore, profile.label);
  renderSubmissions(document.getElementById("submit-list"), document.getElementById("submit-hint"), submissions);

  freeResultsEl.hidden = false;
}

rewriteBtn.addEventListener("click", async () => {
  if (!SONGTEXT_WORKER_URL) {
    rewriteStatus.textContent = "Diese Funktion ist noch nicht eingerichtet (Backend fehlt noch).";
    return;
  }
  const title = document.getElementById("track-title").value;
  const lyricsRaw = document.getElementById("track-lyrics").value;

  rewriteBtn.disabled = true;
  rewriteStatus.textContent = "KI erstellt Einordnung, Titel-Ideen und verfeinerten Text…";
  rewriteResult.hidden = true;

  try {
    const result = await requestKiEinschaetzung(title, lyricsRaw, lastAnalysis || {});
    rewriteClassification.textContent = result.classification || "Keine Einordnung erhalten.";
    rewriteTitleIdeas.innerHTML = "";
    for (const idea of result.titleIdeas || []) {
      const li = document.createElement("li");
      li.textContent = idea;
      rewriteTitleIdeas.appendChild(li);
    }
    rewriteOutput.textContent = result.improved;
    rewriteResult.hidden = false;
    rewriteStatus.textContent = "";
  } catch (err) {
    rewriteStatus.textContent = "Fehler: " + (err && err.message ? err.message : "Unbekannter Fehler.");
  } finally {
    rewriteBtn.disabled = false;
  }
});

unlockBtn.addEventListener("click", async () => {
  if (!currentAnalysisSnapshot) return;
  if (!currentUser) {
    toggleAuthCard(true);
    statusLine.textContent = "Bitte zuerst einloggen oder registrieren, um die Vollanalyse freizuschalten.";
    return;
  }
  unlockBtn.disabled = true;
  const { ok, data } = await tryConsumeCredit();
  unlockBtn.disabled = false;
  if (ok) {
    currentUser = Object.assign({}, currentUser, { credits: data.credits, plan: data.plan });
    renderAccountBar();
    renderAnalysis(currentAnalysisSnapshot, { unlockedPremium: true });
    renderStreakNote(incrementCheckCount());
    premiumResultsEl.scrollIntoView({ behavior: "smooth", block: "start" });
  } else {
    openPricing("Keine Credits mehr übrig – wähle ein Paket, um die Vollanalyse freizuschalten.");
  }
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const fileInput = document.getElementById("audio-file");
  const file = fileInput.files[0];
  if (!file) return;

  const title = document.getElementById("track-title").value;
  const lyricsRaw = document.getElementById("track-lyrics").value;
  const genreSelectEl = document.getElementById("track-genre");

  analyzeBtn.disabled = true;
  statusLine.textContent = "Lade Audio…";

  try {
    const arrayBuffer = await file.arrayBuffer();
    statusLine.textContent = "Decodiere Audio…";
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioCtx();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
    lastAudioBuffer = audioBuffer;

    statusLine.textContent = "Analysiere Frequenzen, Lautheit & Genre…";
    await new Promise((r) => setTimeout(r, 10));
    const audioMetrics = analyzeAudioBuffer(audioBuffer);

    const genre = genreManuallySet ? genreSelectEl.value : audioMetrics.estimatedGenre || "";
    genreSelectEl.value = genre;

    renderAnalysis({ title, lyricsRaw, audioMetrics, genre }, { unlockedPremium: false });
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

/* ---------- Vocals-Check: Transkription der Gesangsspur im Browser (kein Upload) ----------
   Läuft komplett client-seitig über ein Whisper-Modell (transformers.js), das erst bei Klick
   nachgeladen wird (kein Effekt auf die normale Ladezeit der Seite). Das Audio verlässt dabei
   nie das Gerät - nur die Modell-Datei kommt von einem externen CDN (Hugging Face/jsDelivr),
   das ist keine Nutzerdaten-Übertragung. Transkription von Gesang ist von Natur aus
   fehleranfällig (Autotune, Beat, Slang) - Ergebnis wird bewusst als Hinweis, nicht als Fakt
   dargestellt. */

let lastAudioBuffer = null;
let transcriberPromise = null;

async function getTranscriber(onProgress) {
  if (!transcriberPromise) {
    transcriberPromise = (async () => {
      const { pipeline } = await import("https://cdn.jsdelivr.net/npm/@huggingface/transformers@3/+esm");
      return pipeline("automatic-speech-recognition", "Xenova/whisper-base", {
        progress_callback: onProgress,
      });
    })();
  }
  return transcriberPromise;
}

async function resampleTo16kMono(audioBuffer) {
  const targetRate = 16000;
  const offlineCtx = new OfflineAudioContext(1, Math.ceil(audioBuffer.duration * targetRate), targetRate);
  const src = offlineCtx.createBufferSource();
  src.buffer = audioBuffer;
  src.connect(offlineCtx.destination);
  src.start();
  const rendered = await offlineCtx.startRendering();
  return rendered.getChannelData(0);
}

function tokenizeWords(text) {
  return normalizeText(text || "").split(/\s+/).filter(Boolean);
}

// Laengste gemeinsame Teilfolge (LCS) auf Wortebene: markiert, welche Woerter aus den
// eingegebenen Lyrics sich (in Reihenfolge) auch im Transkript wiederfinden lassen.
function lcsMatchedMask(intendedWords, transcribedWords) {
  const n = intendedWords.length;
  const m = transcribedWords.length;
  const dp = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      dp[i][j] =
        intendedWords[i - 1] === transcribedWords[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  const matched = new Array(n).fill(false);
  let i = n, j = m;
  while (i > 0 && j > 0) {
    if (intendedWords[i - 1] === transcribedWords[j - 1]) {
      matched[i - 1] = true;
      i--; j--;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }
  return matched;
}

function renderVocalsComparison(lyricsRaw, transcribedText) {
  const intendedWords = tokenizeWords(lyricsRaw);
  const transcribedWords = tokenizeWords(transcribedText);
  const matched = lcsMatchedMask(intendedWords, transcribedWords);
  const matchedCount = matched.filter(Boolean).length;
  const ratio = intendedWords.length > 0 ? matchedCount / intendedWords.length : 1;

  let summary;
  if (intendedWords.length === 0) {
    summary = "Kein Songtext zum Abgleich vorhanden.";
  } else if (ratio >= 0.85) {
    summary = `${Math.round(ratio * 100)}% deines Songtexts finden sich im automatischen Vocal-Transkript wieder – kein Hinweis auf grobe Aussprache-Artefakte.`;
  } else if (ratio >= 0.6) {
    summary = `${Math.round(ratio * 100)}% deines Songtexts finden sich im Transkript wieder. Die markierten Stellen unten kommen im Gesang anders/unklar rüber – kann an der KI-Aussprache liegen, kann aber auch ein Transkriptionsfehler sein (bei Gesang normal).`;
  } else {
    summary = `Nur ${Math.round(ratio * 100)}% deines Songtexts finden sich im Transkript wieder. Entweder hat die Spracherkennung hier größere Probleme (Autotune, Beat, Slang), oder die Vocals weichen stark vom Text ab – lohnt sich, dir das Rohtranskript unten anzuhören/anzusehen.`;
  }

  const highlighted = intendedWords
    .map((w, idx) => (matched[idx] ? w : `<mark>${w}</mark>`))
    .join(" ");

  return { summary, highlightedHtml: highlighted || "(kein Text)" };
}

const vocalsCheckBtn = document.getElementById("vocals-check-btn");
const vocalsSkipBtn = document.getElementById("vocals-skip-btn");
const vocalsChoice = document.getElementById("vocals-choice");
const vocalsStatus = document.getElementById("vocals-status");
const vocalsResult = document.getElementById("vocals-result");

if (vocalsSkipBtn) {
  vocalsSkipBtn.addEventListener("click", () => {
    vocalsChoice.hidden = true;
    vocalsStatus.textContent = "Kein Problem – lässt sich jederzeit später (z. B. am Laptop) nachholen.";
  });
}

if (vocalsCheckBtn) {
  vocalsCheckBtn.addEventListener("click", async () => {
    if (!lastAudioBuffer) {
      vocalsStatus.textContent = "Kein Audio verfügbar – bitte Track erneut analysieren.";
      return;
    }
    const lyricsRaw = document.getElementById("track-lyrics").value;
    if (!lyricsRaw.trim()) {
      vocalsStatus.textContent = "Kein Songtext eingegeben – nichts zum Abgleichen.";
      return;
    }

    vocalsChoice.hidden = true;
    vocalsCheckBtn.disabled = true;
    vocalsResult.hidden = true;
    vocalsStatus.textContent = "Lade Transkriptions-Modell (einmalig, danach gecacht)…";

    try {
      const transcriber = await getTranscriber((info) => {
        if (info && info.status === "progress" && typeof info.progress === "number") {
          vocalsStatus.textContent = `Lade Transkriptions-Modell… ${Math.round(info.progress)}%`;
        }
      });

      vocalsStatus.textContent = "Bereite Audio auf (16kHz Mono)…";
      const audioData = await resampleTo16kMono(lastAudioBuffer);

      vocalsStatus.textContent = "Transkribiere Vocals (kann bei längeren Tracks etwas dauern)…";
      const result = await transcriber(audioData, {
        language: "german",
        task: "transcribe",
        chunk_length_s: 30,
        stride_length_s: 5,
      });
      const transcribedText = (result && result.text ? result.text : "").trim();

      if (!transcribedText) {
        vocalsStatus.textContent = "Keine verwertbare Transkription erhalten (evtl. sehr leiser/instrumentaler Track).";
        vocalsChoice.hidden = false;
        return;
      }

      const { summary, highlightedHtml } = renderVocalsComparison(lyricsRaw, transcribedText);
      document.getElementById("vocals-summary").textContent = summary;
      document.getElementById("vocals-lyrics-highlighted").innerHTML = highlightedHtml;
      document.getElementById("vocals-transcript").textContent = transcribedText;
      vocalsResult.hidden = false;
      vocalsStatus.textContent = "";
    } catch (err) {
      vocalsStatus.textContent = "Transkription fehlgeschlagen: " + (err && err.message ? err.message : "Unbekannter Fehler.");
      vocalsChoice.hidden = false;
    } finally {
      vocalsCheckBtn.disabled = false;
    }
  });
}

/* ---------- EQ-Editor: Frequenzen direkt im Browser anpassen (kein Mastering) ----------
   Peaking-Filter (BiquadFilterNode) pro Frequenzband, live vorhoerbar und als WAV exportierbar.
   Alles client-seitig ueber Web Audio, kein Upload noetig - passt zur bestehenden
   "Audio verlaesst nie dein Geraet"-Architektur. */

function suggestedEqGainDb(val, lo, hi) {
  if (val < lo - 3) return +(10 * Math.log10(Math.max(lo, 0.5) / Math.max(val, 0.1))).toFixed(1);
  if (val > hi + 3) return -(10 * Math.log10(Math.max(val, 0.1) / Math.max(hi, 0.5))).toFixed(1);
  return 0;
}

const EQ_BAND_Q = 1;
let eqAudioCtx = null;
let eqSourceNode = null;
let eqFilters = [];
let eqPlaying = false;
let eqGains = FREQ_BANDS.map(() => 0);
let eqDeEsserEnabled = false;
let eqDeEsserAmount = 0.5;
let eqDeEsserNodes = null;
let eqGainDb = 0;
let eqGainNode = null;
let eqTrimIntroEnabled = false;
let eqFadeOutEnabled = false;
let eqLastMetrics = null;
let eqLastProfile = null;

function ensureEqAudioCtx() {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!eqAudioCtx) eqAudioCtx = new Ctx();
  if (eqAudioCtx.state === "suspended") eqAudioCtx.resume();
  return eqAudioCtx;
}

// Gibt die Filterkette zurueck, OHNE sie ans Ziel anzuschliessen - der Aufrufer haengt je
// nach De-Esser-Status entweder direkt destination oder den De-Esser-Signalpfad dahinter.
function buildEqFilterChain(ctx, gains) {
  const filters = FREQ_BANDS.map((band, i) => {
    const f = ctx.createBiquadFilter();
    f.type = "peaking";
    f.frequency.value = bandCenterHz(band);
    f.Q.value = EQ_BAND_Q;
    f.gain.value = gains[i] || 0;
    return f;
  });
  for (let i = 0; i < filters.length - 1; i++) filters[i].connect(filters[i + 1]);
  return filters;
}

// Echter De-Esser statt statischem EQ-Cut: eine feste Grund-Absenkung im Zischlaut-Bereich
// (Notch) wird durch einen dynamisch komprimierten Anteil desselben Bereichs wieder aufgefuellt.
// Bei ruhigen Passagen gleicht sich das etwa aus, bei einer lauten Zischlaut-Spitze komprimiert
// der Compressor den zurueckgemischten Anteil staerker weg - Nettoeffekt: Reduktion genau dann,
// wenn's tatsaechlich zischt, nicht pauschal wie ein normaler EQ-Cut.
// Verbindet NICHT selbst ans Ziel - gibt stattdessen den Ausgabeknoten zurueck, damit der
// Aufrufer die Kette flexibel weiterfuehren kann (z.B. noch eine Gain-Stufe danach).
function attachDeEsser(ctx, inputNode, amount) {
  const notch = ctx.createBiquadFilter();
  notch.type = "peaking";
  notch.frequency.value = 6500;
  notch.Q.value = 1.1;
  notch.gain.value = -12 * amount;

  const bandpass = ctx.createBiquadFilter();
  bandpass.type = "bandpass";
  bandpass.frequency.value = 6500;
  bandpass.Q.value = 1.1;

  const compressor = ctx.createDynamicsCompressor();
  compressor.threshold.value = -32;
  compressor.knee.value = 6;
  compressor.ratio.value = 10;
  compressor.attack.value = 0.003;
  compressor.release.value = 0.12;

  const sidechainGain = ctx.createGain();
  sidechainGain.gain.value = amount;

  const sumGain = ctx.createGain();
  sumGain.gain.value = 1;

  inputNode.connect(notch);
  notch.connect(sumGain);

  inputNode.connect(bandpass);
  bandpass.connect(compressor);
  compressor.connect(sidechainGain);
  sidechainGain.connect(sumGain);

  return { output: sumGain, notch, sidechainGain };
}

// Erstellt bei Bedarf eine gekuerzte Kopie des Buffers (Intro-Stille entfernt). Braucht einen
// AudioContext/OfflineAudioContext zum Anlegen des neuen Buffers.
function getEqSourceBuffer(ctx) {
  if (!eqTrimIntroEnabled || !eqLastMetrics || !eqLastMetrics.introSilenceMs || eqLastMetrics.introSilenceMs < 50) {
    return lastAudioBuffer;
  }
  const sampleRate = lastAudioBuffer.sampleRate;
  const trimSamples = Math.min(lastAudioBuffer.length - 1, Math.round((eqLastMetrics.introSilenceMs / 1000) * sampleRate));
  const newLength = lastAudioBuffer.length - trimSamples;
  const trimmed = ctx.createBuffer(lastAudioBuffer.numberOfChannels, newLength, sampleRate);
  for (let ch = 0; ch < lastAudioBuffer.numberOfChannels; ch++) {
    trimmed.getChannelData(ch).set(lastAudioBuffer.getChannelData(ch).subarray(trimSamples));
  }
  return trimmed;
}

function scheduleFadeOut(gainNode, startTime, duration, fadeSeconds) {
  const fadeStart = startTime + Math.max(0, duration - fadeSeconds);
  gainNode.gain.setValueAtTime(gainNode.gain.value, fadeStart);
  gainNode.gain.linearRampToValueAtTime(0.0001, fadeStart + fadeSeconds);
}

function updateDeEsserAmount(nodes, amount) {
  if (!nodes) return;
  nodes.notch.gain.value = -12 * amount;
  nodes.sidechainGain.gain.value = amount;
}

function stopEqPreview() {
  if (eqSourceNode) {
    try {
      eqSourceNode.stop();
    } catch {
      /* schon gestoppt */
    }
    eqSourceNode.disconnect();
    eqSourceNode = null;
  }
  eqFilters = [];
  eqDeEsserNodes = null;
  eqGainNode = null;
  eqPlaying = false;
  const btn = document.getElementById("eq-play-btn");
  if (btn) btn.textContent = "▶ Vorschau abspielen";
}

function startEqPreview() {
  if (!lastAudioBuffer) return;
  stopEqPreview();
  const ctx = ensureEqAudioCtx();
  const sourceBuffer = getEqSourceBuffer(ctx);
  const source = ctx.createBufferSource();
  source.buffer = sourceBuffer;
  // Mit Fade-out ergibt eine Endlos-Schleife keinen Sinn (man wuerde den harten Sprung nach
  // dem Fade hoeren) - dann einmalig abspielen statt loopen.
  source.loop = !eqFadeOutEnabled;

  const filters = buildEqFilterChain(ctx, eqGains);
  source.connect(filters[0]);
  let chainOutput = filters[filters.length - 1];

  if (eqDeEsserEnabled) {
    const de = attachDeEsser(ctx, chainOutput, eqDeEsserAmount);
    eqDeEsserNodes = de;
    chainOutput = de.output;
  } else {
    eqDeEsserNodes = null;
  }

  const gainNode = ctx.createGain();
  gainNode.gain.value = Math.pow(10, eqGainDb / 20);
  chainOutput.connect(gainNode);
  gainNode.connect(ctx.destination);
  eqGainNode = gainNode;

  if (eqFadeOutEnabled) {
    scheduleFadeOut(gainNode, ctx.currentTime, sourceBuffer.duration, Math.min(2.5, sourceBuffer.duration / 3));
  }

  source.start();
  eqSourceNode = source;
  eqFilters = filters;
  eqPlaying = true;
  const btn = document.getElementById("eq-play-btn");
  if (btn) btn.textContent = "⏸ Stop";
}

function updateEqFilterGains() {
  eqFilters.forEach((f, i) => {
    f.gain.value = eqGains[i] || 0;
  });
}

function audioBufferToWavBlob(buffer) {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const numFrames = buffer.length;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const dataSize = numFrames * blockAlign;
  const arr = new ArrayBuffer(44 + dataSize);
  const view = new DataView(arr);

  function writeString(offset, str) {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  }

  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bytesPerSample * 8, true);
  writeString(36, "data");
  view.setUint32(40, dataSize, true);

  const channelData = [];
  for (let ch = 0; ch < numChannels; ch++) channelData.push(buffer.getChannelData(ch));

  let offset = 44;
  for (let i = 0; i < numFrames; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      let sample = Math.max(-1, Math.min(1, channelData[ch][i]));
      sample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, sample, true);
      offset += 2;
    }
  }
  return new Blob([arr], { type: "audio/wav" });
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

function renderEqSliders() {
  const container = document.getElementById("eq-sliders");
  if (!container) return;
  container.innerHTML = "";
  FREQ_BANDS.forEach((band, i) => {
    const wrap = document.createElement("div");
    wrap.className = "eq-slider";
    wrap.innerHTML = `
      <span class="eq-value" id="eq-value-${i}">${eqGains[i].toFixed(1)} dB</span>
      <input type="range" id="eq-band-${i}" min="-12" max="12" step="0.5" value="${eqGains[i]}" />
      <label for="eq-band-${i}">${band.name}</label>
    `;
    container.appendChild(wrap);
    const input = wrap.querySelector("input");
    input.addEventListener("input", () => {
      eqGains[i] = Number(input.value);
      document.getElementById(`eq-value-${i}`).textContent = `${eqGains[i].toFixed(1)} dB`;
      if (eqPlaying) updateEqFilterGains();
    });
  });
}

function initEqEditor(audioMetrics, profile) {
  eqLastMetrics = audioMetrics;
  eqLastProfile = profile;
  eqGains = FREQ_BANDS.map(() => 0);
  eqDeEsserEnabled = false;
  eqDeEsserAmount = 0.5;
  eqGainDb = 0;
  eqTrimIntroEnabled = false;
  eqFadeOutEnabled = false;
  stopEqPreview();
  renderEqSliders();
  const status = document.getElementById("eq-status");
  if (status) status.textContent = "";
  const deEsserCheckbox = document.getElementById("eq-deesser-enabled");
  if (deEsserCheckbox) deEsserCheckbox.checked = false;
  const strengthWrap = document.getElementById("eq-deesser-strength-wrap");
  if (strengthWrap) strengthWrap.hidden = true;
  const strengthSlider = document.getElementById("eq-deesser-strength");
  if (strengthSlider) strengthSlider.value = 50;
  const strengthValue = document.getElementById("eq-deesser-strength-value");
  if (strengthValue) strengthValue.textContent = "50%";
  const gainSlider = document.getElementById("eq-gain");
  if (gainSlider) gainSlider.value = 0;
  const gainValue = document.getElementById("eq-gain-value");
  if (gainValue) gainValue.textContent = "0.0 dB";
  const trimCheckbox = document.getElementById("eq-trim-intro");
  if (trimCheckbox) trimCheckbox.checked = false;
  const fadeCheckbox = document.getElementById("eq-fadeout");
  if (fadeCheckbox) fadeCheckbox.checked = false;
}

const eqSuggestBtn = document.getElementById("eq-suggest-btn");
const eqResetBtn = document.getElementById("eq-reset-btn");
const eqPlayBtn = document.getElementById("eq-play-btn");
const eqDownloadBtn = document.getElementById("eq-download-btn");
const eqStatus = document.getElementById("eq-status");
const eqDeEsserEnabledEl = document.getElementById("eq-deesser-enabled");
const eqDeEsserStrengthWrap = document.getElementById("eq-deesser-strength-wrap");
const eqDeEsserStrengthEl = document.getElementById("eq-deesser-strength");
const eqDeEsserStrengthValueEl = document.getElementById("eq-deesser-strength-value");

if (eqDeEsserEnabledEl) {
  eqDeEsserEnabledEl.addEventListener("change", () => {
    eqDeEsserEnabled = eqDeEsserEnabledEl.checked;
    if (eqDeEsserStrengthWrap) eqDeEsserStrengthWrap.hidden = !eqDeEsserEnabled;
    if (eqPlaying) startEqPreview(); // Graph neu aufbauen, damit De-Esser sauber rein/raus geschaltet wird
  });
}

if (eqDeEsserStrengthEl) {
  eqDeEsserStrengthEl.addEventListener("input", () => {
    eqDeEsserAmount = Number(eqDeEsserStrengthEl.value) / 100;
    if (eqDeEsserStrengthValueEl) eqDeEsserStrengthValueEl.textContent = `${eqDeEsserStrengthEl.value}%`;
    if (eqPlaying && eqDeEsserNodes) updateDeEsserAmount(eqDeEsserNodes, eqDeEsserAmount);
  });
}

const eqGainEl = document.getElementById("eq-gain");
const eqGainValueEl = document.getElementById("eq-gain-value");
const eqGainMatchBtn = document.getElementById("eq-gain-match-btn");
const eqTrimIntroEl = document.getElementById("eq-trim-intro");
const eqFadeOutEl = document.getElementById("eq-fadeout");

if (eqGainEl) {
  eqGainEl.addEventListener("input", () => {
    eqGainDb = Number(eqGainEl.value);
    if (eqGainValueEl) eqGainValueEl.textContent = `${eqGainDb.toFixed(1)} dB`;
    if (eqPlaying && eqGainNode) eqGainNode.gain.value = Math.pow(10, eqGainDb / 20);
  });
}

if (eqGainMatchBtn) {
  eqGainMatchBtn.addEventListener("click", () => {
    if (!eqLastMetrics || !eqLastProfile) return;
    const suggested = Math.max(-12, Math.min(12, eqLastProfile.loudnessTarget - eqLastMetrics.loudnessDb));
    eqGainDb = Math.round(suggested * 2) / 2;
    if (eqGainEl) eqGainEl.value = eqGainDb;
    if (eqGainValueEl) eqGainValueEl.textContent = `${eqGainDb.toFixed(1)} dB`;
    if (eqPlaying && eqGainNode) eqGainNode.gain.value = Math.pow(10, eqGainDb / 20);
    if (eqStatus) eqStatus.textContent = "Lautheit an Zielwert angeglichen.";
  });
}

if (eqTrimIntroEl) {
  eqTrimIntroEl.addEventListener("change", () => {
    eqTrimIntroEnabled = eqTrimIntroEl.checked;
    if (eqPlaying) startEqPreview();
  });
}

if (eqFadeOutEl) {
  eqFadeOutEl.addEventListener("change", () => {
    eqFadeOutEnabled = eqFadeOutEl.checked;
    if (eqPlaying) startEqPreview();
  });
}

if (eqSuggestBtn) {
  eqSuggestBtn.addEventListener("click", () => {
    if (!eqLastMetrics || !eqLastProfile) return;
    eqGains = FREQ_BANDS.map((band, i) => {
      const [lo, hi] = eqLastProfile.refs[i];
      const suggested = suggestedEqGainDb(eqLastMetrics.bandPercents[i], lo, hi);
      return Math.max(-12, Math.min(12, suggested));
    });
    renderEqSliders();
    if (eqPlaying) updateEqFilterGains();
    if (eqStatus) eqStatus.textContent = "Vorschlag aus der Analyse übernommen.";
  });
}

if (eqResetBtn) {
  eqResetBtn.addEventListener("click", () => {
    eqGains = FREQ_BANDS.map(() => 0);
    eqGainDb = 0;
    eqDeEsserEnabled = false;
    eqTrimIntroEnabled = false;
    eqFadeOutEnabled = false;
    renderEqSliders();
    if (eqGainEl) eqGainEl.value = 0;
    if (eqGainValueEl) eqGainValueEl.textContent = "0.0 dB";
    if (eqDeEsserEnabledEl) eqDeEsserEnabledEl.checked = false;
    if (eqDeEsserStrengthWrap) eqDeEsserStrengthWrap.hidden = true;
    if (eqTrimIntroEl) eqTrimIntroEl.checked = false;
    if (eqFadeOutEl) eqFadeOutEl.checked = false;
    if (eqPlaying) startEqPreview();
    if (eqStatus) eqStatus.textContent = "Zurückgesetzt.";
  });
}

if (eqPlayBtn) {
  eqPlayBtn.addEventListener("click", () => {
    if (!lastAudioBuffer) {
      if (eqStatus) eqStatus.textContent = "Bitte zuerst einen Track analysieren.";
      return;
    }
    try {
      if (eqPlaying) {
        stopEqPreview();
        if (eqStatus) eqStatus.textContent = "";
      } else {
        startEqPreview();
        if (eqStatus) eqStatus.textContent = "Vorschau läuft (in Schleife) – Slider bewegen für Live-Vergleich.";
      }
    } catch (err) {
      if (eqStatus) eqStatus.textContent = "Vorschau fehlgeschlagen: " + (err && err.message ? err.message : "Unbekannter Fehler.");
    }
  });
}

if (eqDownloadBtn) {
  eqDownloadBtn.addEventListener("click", async () => {
    if (!lastAudioBuffer) {
      if (eqStatus) eqStatus.textContent = "Bitte zuerst einen Track analysieren.";
      return;
    }
    eqDownloadBtn.disabled = true;
    if (eqStatus) eqStatus.textContent = "Bearbeitete Version wird gerendert…";
    try {
      const helperCtx = ensureEqAudioCtx();
      const sourceBuffer = getEqSourceBuffer(helperCtx);
      const offlineCtx = new OfflineAudioContext(
        sourceBuffer.numberOfChannels,
        sourceBuffer.length,
        sourceBuffer.sampleRate
      );
      const source = offlineCtx.createBufferSource();
      source.buffer = sourceBuffer;
      const filters = buildEqFilterChain(offlineCtx, eqGains);
      source.connect(filters[0]);
      let chainOutput = filters[filters.length - 1];
      if (eqDeEsserEnabled) {
        const de = attachDeEsser(offlineCtx, chainOutput, eqDeEsserAmount);
        chainOutput = de.output;
      }
      const gainNode = offlineCtx.createGain();
      gainNode.gain.value = Math.pow(10, eqGainDb / 20);
      chainOutput.connect(gainNode);
      gainNode.connect(offlineCtx.destination);
      if (eqFadeOutEnabled) {
        scheduleFadeOut(gainNode, 0, sourceBuffer.duration, Math.min(2.5, sourceBuffer.duration / 3));
      }
      source.start();
      const rendered = await offlineCtx.startRendering();
      const blob = audioBufferToWavBlob(rendered);
      downloadBlob(blob, "overhertz-eq-bearbeitet.wav");
      if (eqStatus) eqStatus.textContent = "Download gestartet.";
    } catch (err) {
      if (eqStatus) eqStatus.textContent = "Rendern fehlgeschlagen: " + (err && err.message ? err.message : "Unbekannter Fehler.");
    } finally {
      eqDownloadBtn.disabled = false;
    }
  });
}

/* ---------- Album-Check (Pro-Feature: mehrere Tracks am Stück pruefen) ---------- */

const albumBtn = document.getElementById("album-analyze-btn");
const albumFilesInput = document.getElementById("album-files");
const albumStatus = document.getElementById("album-status");
const albumResults = document.getElementById("album-results");

if (albumBtn) {
  albumBtn.addEventListener("click", async () => {
    const files = Array.from((albumFilesInput && albumFilesInput.files) || []);
    if (files.length === 0) {
      albumStatus.textContent = "Bitte mindestens einen Track auswählen.";
      return;
    }
    if (!currentUser) {
      toggleAuthCard(true);
      albumStatus.textContent = "Bitte zuerst einloggen oder registrieren.";
      return;
    }
    if (currentUser.plan !== "pro" && currentUser.plan !== "pro_annual") {
      openPricing("Album-Check ist Teil des Pro-Plans.");
      return;
    }

    albumBtn.disabled = true;
    albumResults.innerHTML = "";
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const profile = genreProfile("");

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      albumStatus.textContent = `Track ${i + 1}/${files.length}: „${file.name}“ wird geprüft…`;

      const { ok, data } = await tryConsumeCredit();
      if (!ok) {
        albumStatus.textContent = `Kontingent aufgebraucht bei Track ${i + 1}/${files.length} (${data.error || "keine Checks mehr übrig"}).`;
        break;
      }
      currentUser = Object.assign({}, currentUser, { credits: data.credits, plan: data.plan });
      renderAccountBar();

      const card = document.createElement("div");
      card.className = "album-track";
      albumResults.appendChild(card);

      try {
        const arrayBuffer = await file.arrayBuffer();
        const ctx = new AudioCtx();
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
        const audioMetrics = analyzeAudioBuffer(audioBuffer);
        ctx.close();

        const scores = {
          technik: scoreTechnik(audioMetrics),
          lautheit: scoreLautheit(audioMetrics, profile.loudnessTarget),
          frequenz: scoreFrequenz(audioMetrics, profile.refs),
          hook: null,
          titel: null,
        };
        const weighted = [
          { score: scores.technik, weight: 40 },
          { score: scores.lautheit, weight: 30 },
          { score: scores.frequenz, weight: 30 },
        ];
        const overallScore = Math.round(weighted.reduce((a, x) => a + x.score * x.weight, 0) / 100);
        const grade = gradeForScore(overallScore);
        const tips = buildTips(audioMetrics, { hasLyrics: false, hasTitle: false }, scores, profile);
        const topTip = pickTopTip(tips);

        card.innerHTML = `
          <div class="album-track-head">
            <span class="album-track-name">${file.name}</span>
            <span class="album-track-score" style="color:${grade.color}">${overallScore}/100 · ${grade.title}</span>
          </div>
          <p class="album-track-tip">${topTip.text}</p>
        `;
      } catch (err) {
        card.innerHTML = `
          <div class="album-track-head"><span class="album-track-name">${file.name}</span></div>
          <p class="album-track-tip">Fehler: ${err && err.message ? err.message : "Analyse fehlgeschlagen."}</p>
        `;
      }
    }

    albumStatus.textContent = "";
    albumBtn.disabled = false;
  });
}

/* ---------- Seitenweiter Frequenzlinien-Hintergrund (Canvas) ----------
   Laeuft durchgehend hinter dem gesamten Inhalt, nicht nur in einem kleinen Header-Widget -
   das war explizites Feedback ("die ganze Seite soll in Bewegung sein"). */

(function initBgWaves() {
  const canvas = document.getElementById("bg-waves");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let width = 0;
  let height = 0;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener("resize", resize);

  const waves = [
    { amp: 30, freq: 0.0016, speed: 0.35, phase: 0, yRatio: 0.14, color: "205,168,107", widthPx: 1.6, alpha: 0.55 },
    { amp: 18, freq: 0.0024, speed: 0.5, phase: 2.1, yRatio: 0.24, color: "95,184,199", widthPx: 1.4, alpha: 0.42 },
    { amp: 38, freq: 0.0011, speed: -0.28, phase: 4.2, yRatio: 0.42, color: "205,168,107", widthPx: 1.3, alpha: 0.3 },
    { amp: 16, freq: 0.0028, speed: 0.6, phase: 1.3, yRatio: 0.66, color: "95,184,199", widthPx: 1.2, alpha: 0.24 },
    { amp: 24, freq: 0.0018, speed: -0.4, phase: 5.5, yRatio: 0.86, color: "205,168,107", widthPx: 1.2, alpha: 0.2 },
    { amp: 20, freq: 0.0021, speed: 0.45, phase: 3.3, yRatio: 1.05, color: "95,184,199", widthPx: 1.1, alpha: 0.16 },
  ];

  let t = 0;

  function draw() {
    ctx.clearRect(0, 0, width, height);
    const step = width > 900 ? 5 : 8;
    for (const w of waves) {
      ctx.beginPath();
      const y0 = height * w.yRatio;
      for (let x = 0; x <= width; x += step) {
        const y = y0 + Math.sin(x * w.freq + t * w.speed + w.phase) * w.amp;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = `rgba(${w.color}, ${w.alpha})`;
      ctx.lineWidth = w.widthPx;
      ctx.stroke();
    }
    t += 0.016;
    if (!reduceMotion) requestAnimationFrame(draw);
  }
  draw();
})();

/* ---------- Nach Rückkehr von der Stripe-Zahlung: Konto aktualisieren und Analyse freischalten ---------- */

(async function init() {
  await refreshAccount();

  const params = new URLSearchParams(window.location.search);
  const checkout = params.get("checkout");
  if (!checkout) return;
  history.replaceState({}, "", window.location.pathname);

  const snapshotRaw = sessionStorage.getItem(ANALYSIS_SNAPSHOT_KEY);
  if (!snapshotRaw) return;
  const snapshot = JSON.parse(snapshotRaw);

  if (checkout !== "success") {
    renderAnalysis(snapshot, { unlockedPremium: false });
    return;
  }

  statusLine.textContent = "Zahlung wird verarbeitet…";
  let unlocked = false;
  let lastData = null;
  for (let attempt = 0; attempt < 6 && !unlocked; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, 1500));
      await refreshAccount();
    }
    const result = await tryConsumeCredit();
    lastData = result.data;
    if (result.ok) {
      currentUser = Object.assign({}, currentUser, { credits: result.data.credits, plan: result.data.plan });
      renderAccountBar();
      unlocked = true;
    }
  }

  renderAnalysis(snapshot, { unlockedPremium: unlocked });
  if (unlocked) {
    renderStreakNote(incrementCheckCount());
    statusLine.textContent = "";
    premiumResultsEl.scrollIntoView({ behavior: "smooth", block: "start" });
  } else {
    statusLine.textContent =
      "Zahlung wird noch verarbeitet (" +
      (lastData && lastData.error ? lastData.error : "bitte kurz warten") +
      ") – gleich nochmal auf 'Vollanalyse ansehen' klicken.";
  }
})();
