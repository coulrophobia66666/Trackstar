/* ---------- Overhertz: Audio-Analyse-Kernfunktionen (DOM-frei) ----------
   Ausgelagert aus app.js, damit sowohl die Hauptseite (app.js) als auch der
   eigenstaendige Battle-Rap-Contest (battle.js) dieselbe Analyse/Bewertung
   nutzen koennen, ohne dass battle.js das grosse app.js mitladen muss. Rein
   funktional, keine DOM-/i18n-Zugriffe - beide Seiten laden dieses Skript
   VOR ihrem eigenen <script>-Tag, die Funktionen haengen wie gewohnt als
   globale window-Funktionen (kein ES-Module). */

function combineScores(scores) {
  const vals = scores.filter((v) => v !== null && v !== undefined);
  if (vals.length === 0) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
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
  { key: "subbass", range: [20, 60] },
  { key: "bass", range: [60, 250] },
  { key: "lowmid", range: [250, 500] },
  { key: "mid", range: [500, 2000] },
  { key: "highmid", range: [2000, 4000] },
  { key: "presence", range: [4000, 6000] },
  { key: "brilliance", range: [6000, 16000] },
];
/* Referenzbereiche (% Energieanteil je Band) und Lautheits-Ziel je Genre. "" = allgemeiner
   Referenzbereich, wenn kein Genre gewählt wurde. Grobe, praxisnahe Richtwerte, keine exakte
   Norm - dienen als Orientierung, nicht als harte Regel. */
const GENRE_PROFILES = {
  "": { key: "", loudnessTarget: -14, refs: [[2, 8], [14, 26], [10, 18], [20, 32], [10, 18], [5, 12], [4, 12]] },
  hiphop: {
    key: "hiphop",
    loudnessTarget: -9,
    // Subbass/Bass-Obergrenze angehoben, Presence/Brillanz-Untergrenze gesenkt: moderne
    // 808-lastige Trap-/Hip-Hop-Produktion konzentriert einen deutlich groesseren Anteil der
    // rohen Spektralenergie im Bassbereich als die alte Referenz erwartete - das hat systematisch
    // zu starke Bass-Cut- und Hoehen-Boost-Vorschlaege ausgeloest (Nutzer-Feedback anhand vieler
    // echter Trap-Checks). Da alle 7 Baender sich immer auf 100% aufsummieren, driften die
    // uebrigen Baender-Prozentwerte automatisch mit, wenn der Bassanteil realistischer
    // kalibriert ist - Presence/Brillanz brauchten trotzdem eine eigene Anpassung nach unten.
    refs: [[5, 20], [16, 32], [9, 16], [18, 28], [9, 16], [4, 10], [2, 8]],
    fingerprint: { bpmRange: [70, 100], brightnessRange: [700, 1800], bassRatioRange: [20, 38], crestRange: [6, 15] },
  },
  pop: {
    key: "pop",
    loudnessTarget: -11,
    refs: [[2, 7], [13, 22], [10, 18], [22, 34], [11, 19], [6, 13], [5, 13]],
    fingerprint: { bpmRange: [95, 130], brightnessRange: [1100, 2300], bassRatioRange: [14, 27], crestRange: [7, 16] },
  },
  edm: {
    key: "edm",
    loudnessTarget: -8,
    refs: [[6, 14], [20, 32], [8, 15], [16, 26], [9, 15], [4, 10], [4, 11]],
    fingerprint: { bpmRange: [118, 150], brightnessRange: [900, 2000], bassRatioRange: [24, 42], crestRange: [5, 11] },
  },
  rock: {
    key: "rock",
    loudnessTarget: -9,
    refs: [[2, 6], [12, 20], [12, 20], [22, 32], [12, 20], [6, 13], [3, 9]],
    fingerprint: { bpmRange: [95, 145], brightnessRange: [1000, 2100], bassRatioRange: [13, 25], crestRange: [8, 17] },
  },
  acoustic: {
    key: "acoustic",
    loudnessTarget: -16,
    refs: [[1, 5], [10, 18], [12, 20], [22, 34], [12, 20], [6, 13], [4, 11]],
    fingerprint: { bpmRange: [55, 115], brightnessRange: [850, 1900], bassRatioRange: [9, 22], crestRange: [10, 22] },
  },
  techno: {
    key: "techno",
    loudnessTarget: -7,
    refs: [[7, 15], [20, 32], [7, 14], [15, 25], [9, 15], [4, 10], [4, 11]],
    fingerprint: { bpmRange: [120, 145], brightnessRange: [1000, 2200], bassRatioRange: [26, 45], crestRange: [4, 10] },
  },
  metal: {
    key: "metal",
    loudnessTarget: -8,
    refs: [[1, 4], [10, 17], [14, 22], [24, 34], [13, 21], [6, 13], [3, 9]],
    fingerprint: { bpmRange: [100, 180], brightnessRange: [1300, 2500], bassRatioRange: [12, 22], crestRange: [5, 11] },
  },
  reggae: {
    key: "reggae",
    loudnessTarget: -11,
    refs: [[5, 12], [20, 32], [9, 16], [16, 26], [9, 16], [5, 11], [3, 9]],
    fingerprint: { bpmRange: [60, 90], brightnessRange: [800, 1800], bassRatioRange: [22, 38], crestRange: [7, 15] },
  },
  latin: {
    key: "latin",
    loudnessTarget: -10,
    refs: [[2, 6], [14, 24], [10, 18], [20, 30], [11, 18], [6, 13], [4, 11]],
    fingerprint: { bpmRange: [90, 130], brightnessRange: [1000, 2100], bassRatioRange: [16, 28], crestRange: [7, 15] },
  },
  jazz: {
    key: "jazz",
    loudnessTarget: -15,
    refs: [[0, 3], [9, 17], [12, 20], [22, 33], [12, 20], [6, 13], [4, 11]],
    fingerprint: { bpmRange: [60, 140], brightnessRange: [900, 2000], bassRatioRange: [9, 20], crestRange: [11, 20] },
  },
  klassik: {
    key: "klassik",
    loudnessTarget: -20,
    refs: [[0, 2], [6, 14], [10, 18], [22, 34], [14, 22], [7, 14], [5, 13]],
    fingerprint: { bpmRange: [40, 160], brightnessRange: [900, 2000], bassRatioRange: [4, 14], crestRange: [14, 26] },
  },
  volksmusik: {
    key: "volksmusik",
    loudnessTarget: -16,
    refs: [[0, 3], [8, 16], [14, 22], [24, 36], [12, 20], [6, 13], [3, 10]],
    fingerprint: { bpmRange: [80, 140], brightnessRange: [900, 1900], bassRatioRange: [8, 20], crestRange: [11, 22] },
  },
};

// Feinere Genre-Auswahl (fuer Nutzer praeziser, fuer SEO-Tracking als eigene Kategorie zaehlbar),
// die aber noch keine eigenen recherchierten Zielwerte hat - nutzt stattdessen die Referenzwerte
// des musikalisch naechstliegenden Hauptgenres. Kein separater Eintrag in GENRE_PROFILES noetig,
// bis dafuer mal eigene Werte recherchiert werden.
const GENRE_SLUG_TO_PROFILE = {
  deutschrap: "hiphop",
  trap: "hiphop",
  drill: "hiphop",
  rnb: "pop",
  house: "edm",
  phonk: "edm",
  country: "acoustic",
};

function genreProfile(genreKey) {
  const profileKey = GENRE_SLUG_TO_PROFILE[genreKey] || genreKey;
  const base = GENRE_PROFILES[profileKey] || GENRE_PROFILES[""];
  // rawKey haelt die tatsaechlich gewaehlte (evtl. feinere) Genre-Angabe fest, z.B. "house" auch
  // wenn intern das breitere "edm"-Profil fuer die Zielwerte genutzt wird - manche Eigenschaften
  // (z.B. "hier ist instrumental normal") haengen am spezifischen Subgenre, nicht am Elternprofil.
  return Object.assign({}, base, { rawKey: genreKey || base.key });
}

// Genres, bei denen ein rein instrumentaler Track die Norm ist (kein Songtext ist hier kein
// Mangel) - Hook-/Songtitel-Erkennbarkeit sollen dafuer nicht wie ein Fehler behandelt werden.
// Bewusst die feineren Subgenre-Slugs (nicht das Elternprofil) - "edm" pauschal wuerde z.B. auch
// vokallastige Festival-EDM mit einschliessen, wo fehlender Text durchaus ein echtes Manko waere.
const TYPICALLY_INSTRUMENTAL_GENRES = ["techno", "klassik", "house", "phonk"];

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

// K-Gewichtung (Kernstueck der LUFS-Messung nach ITU-R BS.1770): ein Hochregler um ~1.5kHz plus
// ein Hochpass, die grob nachbilden, wie das menschliche Gehoer/Ohr Lautheit wahrnimmt. Ohne das
// las eine helle, moderne Abmischung (viel Energie in Hi-Hats/Praesenz/Luft) systematisch LEISER
// als sie tatsaechlich ist - genau die Tracks, die eigentlich am haeufigsten hochgeladen werden,
// wurden faelschlich als "zu leise" markiert. RBJ-Cookbook-Biquads, Parameter an den BS.1770-
// Referenzfilter angelehnt (keine bit-exakte Nachbildung, aber behebt den Haupt-Bias).
function biquadCoeffsHighShelf(sampleRate, freq, gainDb, q) {
  const A = Math.pow(10, gainDb / 40);
  const w0 = (2 * Math.PI * freq) / sampleRate;
  const cosw0 = Math.cos(w0);
  const sinw0 = Math.sin(w0);
  const alpha = sinw0 / (2 * q);
  const twoSqrtAalpha = 2 * Math.sqrt(A) * alpha;
  return {
    b0: A * (A + 1 + (A - 1) * cosw0 + twoSqrtAalpha),
    b1: -2 * A * (A - 1 + (A + 1) * cosw0),
    b2: A * (A + 1 + (A - 1) * cosw0 - twoSqrtAalpha),
    a0: A + 1 - (A - 1) * cosw0 + twoSqrtAalpha,
    a1: 2 * (A - 1 - (A + 1) * cosw0),
    a2: A + 1 - (A - 1) * cosw0 - twoSqrtAalpha,
  };
}

function biquadCoeffsHighPass(sampleRate, freq, q) {
  const w0 = (2 * Math.PI * freq) / sampleRate;
  const cosw0 = Math.cos(w0);
  const sinw0 = Math.sin(w0);
  const alpha = sinw0 / (2 * q);
  return {
    b0: (1 + cosw0) / 2,
    b1: -(1 + cosw0),
    b2: (1 + cosw0) / 2,
    a0: 1 + alpha,
    a1: -2 * cosw0,
    a2: 1 - alpha,
  };
}

function applyBiquad(samples, { b0, b1, b2, a0, a1, a2 }) {
  const out = new Float32Array(samples.length);
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < samples.length; i++) {
    const x0 = samples[i];
    const y0 = (b0 / a0) * x0 + (b1 / a0) * x1 + (b2 / a0) * x2 - (a1 / a0) * y1 - (a2 / a0) * y2;
    out[i] = y0;
    x2 = x1;
    x1 = x0;
    y2 = y1;
    y1 = y0;
  }
  return out;
}

function applyKWeighting(mono, sampleRate) {
  const shelved = applyBiquad(mono, biquadCoeffsHighShelf(sampleRate, 1500, 4, Math.SQRT1_2));
  return applyBiquad(shelved, biquadCoeffsHighPass(sampleRate, 80, Math.SQRT1_2));
}

// Ungegatete Ganzsong-RMS zieht den Durchschnitt bei jedem Track mit Intro/Outro/Pausen
// systematisch nach unten (fast jeder Song hat davon etwas) - das fuehrte dazu, dass praktisch
// jeder Track als "zu leise" markiert wurde, unabhaengig vom tatsaechlichen Master. Eine grobe
// Annaeherung an gegatete Lautheit (aehnlich dem Prinzip hinter LUFS-Messung, inkl. K-Gewichtung)
// behebt den systematischen Bias: nur Passagen mit tatsaechlichem Signal zaehlen.
function computeGatedLoudnessDb(rawMono, sampleRate) {
  const mono = applyKWeighting(rawMono, sampleRate);
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

// Phasenkorrelation zwischen L/R: +1 = voll in Phase (perfekt mono-kompatibel), 0 = unkorreliert
// (nennenswerter Pegelverlust beim Mono-Summieren moeglich), -1 = gegenphasig (loescht sich beim
// Mono-Summieren teilweise/ganz aus). Genau das passiert auf Handylautsprechern/in vielen
// TikTok-Playern, die tatsaechlich mono wiedergeben - dort kann eine zu breit gezogene Hook
// dadurch schlicht verschwinden. Muss VOR dem Runterrechnen auf Mono berechnet werden, deshalb
// separat uebergeben statt aus dem bereits gemischten Signal.
function computePhaseCorrelation(buffer) {
  if (buffer.numberOfChannels < 2) return 1;
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);
  const length = left.length;
  const stride = Math.max(1, Math.floor(length / 200000));
  let sumLR = 0;
  let sumLL = 0;
  let sumRR = 0;
  for (let i = 0; i < length; i += stride) {
    const l = left[i];
    const r = right[i];
    sumLR += l * r;
    sumLL += l * l;
    sumRR += r * r;
  }
  const denom = Math.sqrt(sumLL * sumRR);
  if (denom < 1e-9) return 1;
  return Math.max(-1, Math.min(1, sumLR / denom));
}

// Naeherung an True Peak (ITU-R BS.1770): Sample-Peak (einfach das lauteste Sample) uebersieht
// Ueberschreitungen, die erst zwischen zwei Samples bei der D/A-Wandlung entstehen (Inter-Sample-
// Peaks) - kommt bei stark limitierten/lauten Masters vor. 4x-Oversampling per linearer
// Interpolation findet die meisten davon; kein vollwertiger bandbegrenzter Oversampler wie in
// professionellen Metering-Tools, aber reicht, um sie von echten Vollausschlaegen zu unterscheiden.
function computeTruePeakDb(mono) {
  const OVERSAMPLE = 4;
  const length = mono.length;
  let truePeak = 0;
  for (let i = 0; i < length - 1; i++) {
    const a = mono[i];
    const b = mono[i + 1];
    const absA = Math.abs(a);
    if (absA > truePeak) truePeak = absA;
    for (let k = 1; k < OVERSAMPLE; k++) {
      const absInterp = Math.abs(a + ((b - a) * k) / OVERSAMPLE);
      if (absInterp > truePeak) truePeak = absInterp;
    }
  }
  if (length > 0) {
    const last = Math.abs(mono[length - 1]);
    if (last > truePeak) truePeak = last;
  }
  return 20 * Math.log10(truePeak || 1e-9);
}

function analyzeAudioBuffer(buffer) {
  const sampleRate = buffer.sampleRate;
  const numChannels = buffer.numberOfChannels;
  const length = buffer.length;
  const phaseCorrelation = computePhaseCorrelation(buffer);

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
  const truePeakDb = computeTruePeakDb(mono);

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
    sampleRate,
    peak,
    rms,
    clippingRatio,
    loudnessDb,
    crestFactorDb,
    truePeakDb,
    phaseCorrelation,
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
    // "&" wird beim Saeubern oben schon entfernt - "und"/"and" als eigene Woerter aber nicht.
    // Titel wie "Asozial & Echt" vs. eingetippt "Asozial und Echt" wuerden sonst nicht als
    // Treffer erkannt, obwohl inhaltlich dasselbe gemeint ist - beide Schreibweisen auf dieselbe
    // Form bringen, damit der Songtitel-im-Text-Abgleich das nicht als Nicht-Treffer wertet.
    .replace(/\b(und|and)\b/g, " ")
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
  // Wie oft der Titel tatsaechlich im Song vorkommt, nicht nur ob - Wiedererkennbarkeit haengt
  // an der Wiederholung, nicht nur an einer einzigen Erwaehnung irgendwo im Text.
  const titleOccurrences = titleInLyrics ? normLyrics.split(normTitle).length - 1 : 0;

  return {
    hasLyrics: true,
    hasTitle,
    hookLine,
    hookRepeatCount,
    titleInLyrics,
    titleOccurrences,
  };
}

/* ---------- Scoring ---------- */

// Genre-abhaengiger Idealwert statt einem starren 12.5 dB fuer alle: Hip-Hop/EDM-Masters liegen
// genretypisch im niedrigeren Crest-Factor-Bereich, ohne dass das technisch schlechter waere -
// ein fixer Wert wuerde das systematisch abstrafen. Von scoreTechnik und scoreDynamikumfang
// gemeinsam genutzt, damit beide vom selben genre-typischen Zielwert ausgehen.
function idealCrestForProfile(profile) {
  const fp = profile && profile.fingerprint;
  return fp ? (fp.crestRange[0] + fp.crestRange[1]) / 2 : 12.5;
}

function scoreTechnik(a, profile) {
  // Bewertung um einen Idealpunkt statt einem "Idealfenster" - ein flacher Bereich, in dem
  // jeder Wert 100% gibt, wirkt schnell unglaubwuerdig grob (fast jeder saubere Track landet
  // sonst exakt bei 100%). So gibt's fast nie eine glatte Bestnote, sondern einen nuancierten Wert.
  const clipPenalty = Math.min(60, a.clippingRatio * 2800);

  const idealCrest = idealCrestForProfile(profile);
  const crestDeviation = Math.abs(a.crestFactorDb - idealCrest);
  const crestPenalty = crestDeviation * crestDeviation * 0.22;

  return Math.max(0, Math.min(100, 100 - clipPenalty - crestPenalty));
}

// Eigene, staerker ausschlagende Kennzahl fuer den Dynamikumfang (nicht nur ein unsichtbarer
// Bestandteil des Technik-Scores) - genau dafuer gedacht, ueberkomprimierte/plattgedrueckte
// KI-Master klar erkennbar zu machen, statt im kombinierten Technik-Wert unterzugehen.
function scoreDynamikumfang(a, profile) {
  const idealCrest = idealCrestForProfile(profile);
  const deviation = Math.abs(a.crestFactorDb - idealCrest);
  return Math.max(0, Math.min(100, 100 - deviation * deviation * 0.6));
}

// Phasenkorrelation (-1..+1) auf einen 0-100-Score gemappt: +1 (voll in Phase) -> 100,
// 0 (unkorreliert) -> 50, -1 (gegenphasig) -> 0. Bewusst eine einfache lineare Zuordnung statt
// einer kurvigen Gewichtung - es gibt noch keine kalibrierten Referenzwerte aus echten Tracks
// fuer diese neue Kennzahl.
function scoreMonoCompat(correlation) {
  if (correlation == null) return null;
  return Math.round(Math.max(0, Math.min(100, ((correlation + 1) / 2) * 100)));
}

function scoreLautheit(a, loudnessTarget) {
  const diff = Math.abs(a.loudnessDb - loudnessTarget);
  let score = 100 - diff * 6;
  return Math.max(0, Math.min(100, score));
}

function scoreFrequenz(a, refs) {
  // Bandpercents aus 7 Baendern summieren sich immer auf 100% - liegt ein Band unter seinem
  // Referenzbereich, MUESSEN andere Baender rechnerisch darueber liegen. Eine unbegrenzt lineare
  // Strafe pro Band (frueher: +1.8 je Prozentpunkt Abweichung, ohne Deckel) hat sich dadurch bei
  // fast jedem echten Track ueber alle 7 Baender aufsummiert und den Score auf 0 gedrueckt - auch
  // bei Tracks, die nur in 2-3 Baendern spuerbar abweichen. Jetzt pro Band gedeckelt (sanft
  // abflachend statt hart abgeschnitten), damit ein einzelnes stark abweichendes Band nicht den
  // gesamten Score allein ruiniert.
  let penalty = 0;
  refs.forEach(([lo, hi], i) => {
    const val = a.bandPercents[i];
    const mid = (lo + hi) / 2;
    const halfWidth = (hi - lo) / 2 || 1;
    const dist = Math.abs(val - mid);
    if (dist <= halfWidth) {
      penalty += (dist / halfWidth) * 3;
    } else {
      const over = dist - halfWidth;
      penalty += 3 + 11 * (1 - Math.exp(-over / (halfWidth * 2)));
    }
  });
  return Math.max(0, Math.min(100, 100 - penalty));
}

function scoreHook(lyrics) {
  if (!lyrics.hasLyrics) return null;
  if (lyrics.hookRepeatCount >= 3) return 100;
  if (lyrics.hookRepeatCount === 2) return 70;
  return 30;
}

const TITLE_OCCURRENCES_FOR_FULL_SCORE = 6;

function scoreTitel(lyrics) {
  if (!lyrics.hasLyrics || !lyrics.hasTitle) return null;
  if (!lyrics.titleInLyrics) return 15;
  return Math.round(Math.min(100, (lyrics.titleOccurrences / TITLE_OCCURRENCES_FOR_FULL_SCORE) * 100));
}

// Buendelt alle Einzel-Scores + Gesamtscore an einer Stelle, damit die Erstanalyse
// (renderAnalysis) und die EQ-Live-Vorschau (updateEqPreview) exakt dieselbe Gewichtung nutzen -
// zwei getrennte Kopien derselben Formel waeren eine Quelle fuer leise auseinanderlaufende Werte.
function computeAllScores(audioMetrics, lyrics, profile) {
  const scores = {
    technik: scoreTechnik(audioMetrics, profile),
    lautheit: scoreLautheit(audioMetrics, profile.loudnessTarget),
    frequenz: scoreFrequenz(audioMetrics, profile.refs),
    hook: scoreHook(lyrics),
    titel: scoreTitel(lyrics),
    monoCompat: scoreMonoCompat(audioMetrics.phaseCorrelation),
    dynamikumfang: scoreDynamikumfang(audioMetrics, profile),
  };

  const weighted = [
    { score: scores.technik, weight: 18 },
    { score: scores.lautheit, weight: 12 },
    { score: scores.frequenz, weight: 20 },
    { score: scores.hook, weight: 25 },
    { score: scores.titel, weight: 25 },
  ].filter((x) => x.score !== null);

  const totalWeight = weighted.reduce((a, x) => a + x.weight, 0);
  const overallScore = Math.round(weighted.reduce((a, x) => a + x.score * x.weight, 0) / totalWeight);

  return { scores, overallScore };
}
