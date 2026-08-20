// Overhertz Battle-Rap-Contest - eigenstaendige Seite/Skript statt Teil von app.js, damit dieses
// Nischen-Feature das grosse, bereits gut getestete Haupt-Skript nicht anfasst/riskiert. Nutzt
// denselben Login-Token wie app.js (gleicher Origin, gleicher localStorage-Key), damit ein Login
// auf der Hauptseite hier automatisch mitgilt.

const WORKER_BASE = "https://trackstar.coulrophobia66666.workers.dev/";
const TOKEN_KEY = "overhertz_token";
const VOTER_KEY = "overhertz_battle_voter_id";
const VOTED_KEY_PREFIX = "overhertz_battle_voted_";
const BATTLE_SLUG = "battle-rap-contest";

function getToken() {
  return localStorage.getItem(TOKEN_KEY) || "";
}

function getVoterFingerprint() {
  let id = localStorage.getItem(VOTER_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(VOTER_KEY, id);
  }
  return id;
}

async function apiFetch(path, options = {}) {
  const headers = Object.assign({}, options.headers || {});
  const token = getToken();
  if (token) headers["Authorization"] = "Bearer " + token;
  if (options.body && !(options.body instanceof FormData) && !headers["content-type"]) {
    headers["content-type"] = "application/json";
  }
  let res;
  try {
    res = await fetch(WORKER_BASE + path, Object.assign({}, options, { headers }));
  } catch {
    return { ok: false, status: 0, data: { error: "Server nicht erreichbar." } };
  }
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

function formatDeadline(ms) {
  return new Date(ms).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// Die vom Worker gelieferten Media-Pfade (z.B. "/battle-media/...") sind relativ zur
// Worker-Domain, nicht zur Website-Domain, auf der diese Seite laeuft - deshalb hier explizit
// mit WORKER_BASE zusammensetzen statt den Pfad direkt als src zu verwenden.
function mediaUrl(path) {
  if (!path) return "";
  return WORKER_BASE.replace(/\/$/, "") + path;
}

const ROUND_NAMES = { 0: "Anmeldephase", 1: "Runde der 32", 2: "Achtelfinale", 3: "Viertelfinale", 4: "Halbfinale", 5: "Finale" };

let currentState = null;

async function loadState() {
  const statusBar = document.getElementById("battle-status-bar");
  const registerBlock = document.getElementById("battle-register-block");
  const loginHint = document.getElementById("battle-login-hint");
  const matchupsEl = document.getElementById("battle-matchups");
  const emptyMsg = document.getElementById("battle-empty-msg");

  const { ok, data } = await apiFetch(`battle/${BATTLE_SLUG}/state`, { method: "GET" });

  if (!ok) {
    emptyMsg.hidden = false;
    emptyMsg.textContent = data.error || "Aktuell läuft kein Battle.";
    statusBar.hidden = true;
    registerBlock.hidden = true;
    loginHint.hidden = true;
    matchupsEl.innerHTML = "";
    return;
  }

  currentState = data;
  emptyMsg.hidden = true;

  statusBar.hidden = false;
  const statusLabel =
    data.battle.status === "registration"
      ? "Anmeldung läuft"
      : data.battle.status === "finished"
      ? "Beendet"
      : escapeHtml(ROUND_NAMES[data.battle.roundNumber] || "Runde " + data.battle.roundNumber);
  statusBar.innerHTML = `<strong>${escapeHtml(data.battle.title)}</strong> – Status: ${statusLabel}`;

  const token = getToken();
  if (!token) {
    loginHint.hidden = false;
    registerBlock.hidden = true;
  } else {
    loginHint.hidden = true;
    registerBlock.hidden = !(data.battle.status === "registration" && !data.myRegistered);
  }

  renderMatchups(data.matchups);
}

function sideHtml(matchup, side, participant, audioUrl, photoUrl, score) {
  if (!participant) return '<div class="battle-side"><p class="name">Freilos</p></div>';

  const isWinner = matchup.winnerParticipantId === participant.id;
  const votedKey = VOTED_KEY_PREFIX + matchup.id;
  const alreadyVoted = Boolean(localStorage.getItem(votedKey));
  const canVote = matchup.votingOpen && !alreadyVoted && audioUrl;
  const votes = side === "a" ? matchup.votesA : matchup.votesB;

  return `
    <div class="battle-side">
      ${photoUrl ? `<img src="${escapeHtml(mediaUrl(photoUrl))}" alt="${escapeHtml(participant.name)}" />` : ""}
      <p class="name">${escapeHtml(participant.name)}${isWinner ? ' <span class="battle-winner">Sieger</span>' : ""}</p>
      ${audioUrl ? `<audio controls src="${escapeHtml(mediaUrl(audioUrl))}"></audio>` : '<p class="battle-msg">Noch kein Track eingereicht</p>'}
      ${score != null ? `<p class="battle-score">Sound-Score: ${score}/100</p>` : ""}
      ${canVote ? `<button type="button" class="battle-vote-btn" data-matchup="${matchup.id}" data-side="${side}">Für ${escapeHtml(participant.name)} stimmen</button>` : ""}
      ${votes !== null && votes !== undefined ? `<p class="battle-votes">${votes} Stimmen</p>` : ""}
      ${audioUrl ? `<button type="button" class="battle-share-btn" data-matchup="${matchup.id}" data-side="${side}">Teilen</button>` : ""}
    </div>`;
}

function renderMatchups(matchups) {
  const matchupsEl = document.getElementById("battle-matchups");
  matchupsEl.innerHTML = "";
  if (!matchups.length) {
    matchupsEl.innerHTML = '<p class="battle-msg">Die Matchups werden bald veröffentlicht.</p>';
    return;
  }

  const now = Date.now();
  for (const m of matchups) {
    const card = document.createElement("div");
    card.className = "battle-matchup";
    const isBye = !m.participantB;

    let deadlineText;
    if (isBye) deadlineText = "Freilos – zieht automatisch weiter";
    else if (now < m.submissionDeadline) deadlineText = "Einreichungsfrist: " + formatDeadline(m.submissionDeadline);
    else if (now < m.voteDeadline) deadlineText = "Abstimmung bis: " + formatDeadline(m.voteDeadline);
    else deadlineText = "Abstimmung beendet";

    card.innerHTML = `
      <div class="battle-matchup-vs">
        ${sideHtml(m, "a", m.participantA, m.audioA, m.photoA, m.scoreA)}
        <div class="battle-vs-label">VS</div>
        ${sideHtml(m, "b", m.participantB, m.audioB, m.photoB, m.scoreB)}
      </div>
      <p class="battle-deadline">${deadlineText}</p>
    `;

    if (!isBye && currentState.myParticipantId && now < m.submissionDeadline) {
      let mySide = null;
      if (m.participantA && m.participantA.id === currentState.myParticipantId) mySide = "a";
      else if (m.participantB && m.participantB.id === currentState.myParticipantId) mySide = "b";
      if (mySide) {
        const alreadySubmitted = mySide === "a" ? Boolean(m.audioA) : Boolean(m.audioB);
        const submitBlock = document.createElement("div");
        submitBlock.className = "battle-submit-block";
        submitBlock.innerHTML = `
          <p>${alreadySubmitted ? "Du kannst deinen Track/dein Bild bis zur Frist noch ersetzen:" : "Dein Diss-Track ist fällig:"}</p>
          <label>Track (MP3/WAV/OGG/FLAC, max. 25 MB)</label>
          <input type="file" class="battle-audio-input" accept="audio/*" />
          <label>Bild (JPG/PNG/WebP, max. 8 MB)</label>
          <input type="file" class="battle-photo-input" accept="image/*" />
          <button type="button" class="battle-submit-btn" data-matchup="${m.id}">Einreichen</button>
          <p class="battle-msg battle-submit-msg"></p>
        `;
        card.appendChild(submitBlock);
      }
    }

    matchupsEl.appendChild(card);
  }

  matchupsEl.querySelectorAll(".battle-vote-btn").forEach((btn) => btn.addEventListener("click", onVoteClick));
  matchupsEl.querySelectorAll(".battle-submit-btn").forEach((btn) => btn.addEventListener("click", onSubmitClick));
  matchupsEl.querySelectorAll(".battle-share-btn").forEach((btn) => btn.addEventListener("click", onShareClick));
}

async function onVoteClick(e) {
  const btn = e.currentTarget;
  const matchupId = btn.dataset.matchup;
  const side = btn.dataset.side;
  btn.disabled = true;
  const { ok, data } = await apiFetch("battle/vote", {
    method: "POST",
    body: JSON.stringify({ matchupId, side, voterFingerprint: getVoterFingerprint() }),
  });
  if (ok) {
    localStorage.setItem(VOTED_KEY_PREFIX + matchupId, "1");
    await loadState();
  } else {
    btn.disabled = false;
    alert(data.error || "Abstimmung fehlgeschlagen.");
  }
}

async function onSubmitClick(e) {
  const btn = e.currentTarget;
  const matchupId = btn.dataset.matchup;
  const block = btn.closest(".battle-submit-block");
  const audioInput = block.querySelector(".battle-audio-input");
  const photoInput = block.querySelector(".battle-photo-input");
  const msgEl = block.querySelector(".battle-submit-msg");
  msgEl.textContent = "";
  msgEl.className = "battle-msg battle-submit-msg";

  if (!audioInput.files[0] || !photoInput.files[0]) {
    msgEl.textContent = "Bitte Track und Bild auswählen.";
    msgEl.classList.add("error");
    return;
  }

  btn.disabled = true;
  btn.textContent = "Analysiere...";

  // Sound-Score direkt im Browser berechnen (dieselbe Analyse/Bewertung wie der Kurzcheck auf der
  // Hauptseite, aus website/audio-core.js) und mit hochladen - der Worker kann Audio inhaltlich
  // nicht auswerten (keine Web-Audio-API in der Workers-Runtime). Kein Songtext/Genre bei
  // Battle-Einreichungen erfasst, deshalb Allgemein-Profil + leere Lyrics (wie auf der
  // Hauptseite ohne Eingabe), Hook/Titel-Teilscores dadurch automatisch ausgeklammert.
  let soundScore = null;
  try {
    const arrayBuffer = await audioInput.files[0].arrayBuffer();
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioCtx();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
    const audioMetrics = analyzeAudioBuffer(audioBuffer);
    const lyrics = analyzeLyrics("", "");
    const profile = genreProfile("");
    const { scores } = computeAllScores(audioMetrics, lyrics, profile);
    const combined = combineScores([scores.technik, scores.frequenz, scores.lautheit]);
    if (combined != null) soundScore = Math.round(combined);
  } catch {
    // Score ist ein Bonus, kein Blocker fuers Einreichen - schlaegt die lokale Analyse fehl
    // (z.B. ein Format, das der Browser nicht dekodieren kann), wird einfach kein Score
    // mitgeschickt.
  }

  const formData = new FormData();
  formData.append("matchupId", matchupId);
  formData.append("audio", audioInput.files[0]);
  formData.append("photo", photoInput.files[0]);
  if (soundScore != null) formData.append("soundScore", String(soundScore));

  btn.textContent = "Lädt hoch...";
  const { ok, data } = await apiFetch("battle/submit", { method: "POST", body: formData });
  btn.disabled = false;
  btn.textContent = "Einreichen";

  if (ok) {
    msgEl.textContent = "Eingereicht!";
    msgEl.classList.add("success");
    await loadState();
  } else {
    msgEl.textContent = data.error || "Einreichung fehlgeschlagen.";
    msgEl.classList.add("error");
  }
}

/* ---------- Share-Karte ("Votet fuer mich") ----------
   Eigene, einfache Canvas-Zeichnung im selben visuellen Stil wie das Share-Bild der Hauptseite
   (buildShareCardBlob in app.js) - bewusst hier dupliziert statt aus app.js importiert, battle.js
   bleibt eigenstaendig (siehe Kommentar am Dateianfang) und hat kein t()-i18n-System. */

function loadImageAsync(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function wrapLines(ctx, text, maxWidth) {
  const words = text.split(" ");
  const lines = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(test).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

async function buildBattleShareCardBlob(name, opponentName, score) {
  try {
    await document.fonts.ready;
  } catch {
    /* Font-Ladefehler ignorieren - Canvas faellt dann auf eine System-Schrift zurueck */
  }

  const width = 1080;
  const height = 1200;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, "#07080c");
  bgGrad.addColorStop(1, "#0b0e14");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  const glow = ctx.createRadialGradient(width / 2, height * 0.4, 40, width / 2, height * 0.4, height * 0.55);
  glow.addColorStop(0, "rgba(205, 168, 107, 0.18)");
  glow.addColorStop(1, "rgba(205, 168, 107, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "center";

  let logoImg = null;
  try {
    logoImg = await loadImageAsync("logo.svg");
  } catch {
    /* Logo ist ein Bonus, kein Blocker fuers restliche Bild */
  }
  if (logoImg) ctx.drawImage(logoImg, width / 2 - 28, 90, 56, 56);
  ctx.font = "700 32px Manrope, sans-serif";
  ctx.fillStyle = "#cda86b";
  ctx.fillText("OVERHERTZ BATTLE-RAP-CONTEST", width / 2, logoImg ? 190 : 140);

  ctx.font = "700 62px Fraunces, serif";
  ctx.fillStyle = "#f5f0e6";
  ctx.fillText(name, width / 2, 300);

  ctx.font = "500 34px Manrope, sans-serif";
  ctx.fillStyle = "rgba(183, 178, 166, 0.9)";
  ctx.fillText("VS " + (opponentName || "?"), width / 2, 355);

  if (score != null) {
    ctx.font = "600 30px Manrope, sans-serif";
    ctx.fillStyle = "#cda86b";
    ctx.fillText("SOUND-SCORE", width / 2, 490);
    ctx.font = "700 200px Fraunces, serif";
    ctx.fillStyle = "#f0d19c";
    ctx.fillText(String(score), width / 2, 700);
    ctx.font = "600 38px Fraunces, serif";
    ctx.fillStyle = "rgba(245, 240, 230, 0.7)";
    ctx.fillText("/100", width / 2, 755);
  }

  ctx.strokeStyle = "rgba(255, 255, 255, 0.14)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(width / 2 - 90, 840);
  ctx.lineTo(width / 2 + 90, 840);
  ctx.stroke();

  ctx.font = "700 40px Manrope, sans-serif";
  ctx.fillStyle = "#f5f0e6";
  wrapLines(ctx, "Jetzt für " + name + " abstimmen!", width - 240).forEach((l, i) => ctx.fillText(l, width / 2, 910 + i * 50));

  ctx.font = "500 28px Manrope, sans-serif";
  ctx.fillStyle = "#cda86b";
  ctx.fillText("overhertz.app/battle.html", width / 2, 1010);

  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

async function onShareClick(e) {
  const btn = e.currentTarget;
  const matchupId = btn.dataset.matchup;
  const side = btn.dataset.side;
  if (!currentState) return;
  const matchup = currentState.matchups.find((m) => m.id === matchupId);
  if (!matchup) return;
  const participant = side === "a" ? matchup.participantA : matchup.participantB;
  const opponent = side === "a" ? matchup.participantB : matchup.participantA;
  const score = side === "a" ? matchup.scoreA : matchup.scoreB;
  if (!participant) return;

  const shareText =
    `${participant.name} tritt beim Overhertz Battle-Rap-Contest an` +
    (opponent ? ` gegen ${opponent.name}` : "") +
    (score != null ? ` (Sound-Score ${score}/100)` : "") +
    " - jetzt abstimmen:";
  const shareUrl = window.location.origin + window.location.pathname;
  const combined = `${shareText} ${shareUrl}`;

  let imageBlob = null;
  try {
    imageBlob = await buildBattleShareCardBlob(participant.name, opponent ? opponent.name : null, score);
  } catch {
    /* Bild ist ein Bonus, kein Blocker fuers Teilen selbst */
  }

  try {
    if (navigator.share) {
      const file = imageBlob ? new File([imageBlob], "overhertz-battle.png", { type: "image/png" }) : null;
      if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ text: combined, files: [file] });
      } else {
        await navigator.share({ text: combined });
      }
      return;
    }
    await navigator.clipboard.writeText(combined);
    if (imageBlob) downloadBlob(imageBlob, "overhertz-battle.png");
  } catch {
    /* Abbruch durch Nutzer (z.B. Share-Dialog geschlossen) oder Clipboard nicht verfuegbar -
       kein kritischer Vorgang. */
  }
}

document.getElementById("battle-register-btn").addEventListener("click", async () => {
  const nameInput = document.getElementById("battle-artist-name");
  const msgEl = document.getElementById("battle-register-msg");
  const artistName = nameInput.value.trim();
  msgEl.textContent = "";
  msgEl.className = "battle-msg";
  if (!artistName) {
    msgEl.textContent = "Bitte einen Künstlernamen eingeben.";
    msgEl.classList.add("error");
    return;
  }
  if (!currentState || !currentState.battle) return;

  const { ok, data } = await apiFetch("battle/register", {
    method: "POST",
    body: JSON.stringify({ battleId: currentState.battle.id, artistName }),
  });
  if (ok) {
    msgEl.textContent = "Angemeldet! Viel Erfolg.";
    msgEl.classList.add("success");
    await loadState();
  } else {
    msgEl.textContent = data.error || "Anmeldung fehlgeschlagen.";
    msgEl.classList.add("error");
  }
});

loadState();
