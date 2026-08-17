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

function sideHtml(matchup, side, participant, audioUrl, photoUrl) {
  if (!participant) return '<div class="battle-side"><p class="name">Freilos</p></div>';

  const isWinner = matchup.winnerParticipantId === participant.id;
  const votedKey = VOTED_KEY_PREFIX + matchup.id;
  const alreadyVoted = Boolean(localStorage.getItem(votedKey));
  const canVote = matchup.votingOpen && !alreadyVoted && audioUrl;
  const votes = side === "a" ? matchup.votesA : matchup.votesB;

  return `
    <div class="battle-side">
      ${photoUrl ? `<img src="${escapeHtml(photoUrl)}" alt="${escapeHtml(participant.name)}" />` : ""}
      <p class="name">${escapeHtml(participant.name)}${isWinner ? ' <span class="battle-winner">Sieger</span>' : ""}</p>
      ${audioUrl ? `<audio controls src="${escapeHtml(audioUrl)}"></audio>` : '<p class="battle-msg">Noch kein Track eingereicht</p>'}
      ${canVote ? `<button type="button" class="battle-vote-btn" data-matchup="${matchup.id}" data-side="${side}">Für ${escapeHtml(participant.name)} stimmen</button>` : ""}
      ${votes !== null && votes !== undefined ? `<p class="battle-votes">${votes} Stimmen</p>` : ""}
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
        ${sideHtml(m, "a", m.participantA, m.audioA, m.photoA)}
        <div class="battle-vs-label">VS</div>
        ${sideHtml(m, "b", m.participantB, m.audioB, m.photoB)}
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

  const formData = new FormData();
  formData.append("matchupId", matchupId);
  formData.append("audio", audioInput.files[0]);
  formData.append("photo", photoInput.files[0]);

  btn.disabled = true;
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
