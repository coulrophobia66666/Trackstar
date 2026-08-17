-- Overhertz D1-Schema: Konten, Sessions, Credits/Abo-Stand.
-- Einmalig im Cloudflare-Dashboard unter D1 -> Datenbank -> Console ausfuehren.

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free', -- free | pro | pro_annual
  credits INTEGER NOT NULL DEFAULT 0,
  checks_used_period INTEGER NOT NULL DEFAULT 0,
  plan_renews_at INTEGER,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  has_bought_credits INTEGER NOT NULL DEFAULT 0, -- 1 sobald das Credits-Paket mind. einmal gekauft wurde (fuer den Pro-Upgrade-Rabatt)
  email_verified_at INTEGER -- NULL = noch nicht bestaetigt (informativ, sperrt nichts - siehe email_verifications)
);

-- Falls die Tabelle "users" schon existiert (Datenbank vor dieser Aenderung angelegt),
-- diese Zeilen EINMALIG zusaetzlich in der D1-Console ausfuehren:
-- ALTER TABLE users ADD COLUMN has_bought_credits INTEGER NOT NULL DEFAULT 0;
-- ALTER TABLE users ADD COLUMN email_verified_at INTEGER;
-- Bestandskonten gelten rueckwirkend als verifiziert (kein Aussperren/Nerven fuer alte Nutzer -
-- nur neue Registrierungen durchlaufen den Verifizierungs-Flow):
-- UPDATE users SET email_verified_at = strftime('%s','now') * 1000 WHERE email_verified_at IS NULL;

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

CREATE TABLE IF NOT EXISTS password_resets (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_password_resets_user ON password_resets(user_id);

-- Token fuer die (informative, nicht blockierende) E-Mail-Bestaetigung nach der Registrierung -
-- gleiches Muster wie password_resets, nur mit laengerer Gueltigkeit (weniger sicherheitskritisch,
-- soll niemanden aussperren, der die Mail erst spaeter liest).
CREATE TABLE IF NOT EXISTS email_verifications (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_email_verifications_user ON email_verifications(user_id);

CREATE TABLE IF NOT EXISTS ratings (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  stars INTEGER NOT NULL,
  comment TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ratings_user ON ratings(user_id);

CREATE TABLE IF NOT EXISTS checks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  title TEXT,
  genre TEXT,
  overall_score INTEGER,
  classification TEXT,
  title_ideas TEXT, -- JSON-Array als Text
  improved_lyrics TEXT,
  tips TEXT, -- JSON-Array als Text
  fazit TEXT,
  next_prompt TEXT -- Stichwort-Zusatz fuers naechste KI-Musik-Prompt (Suno/Udio), siehe ###PROMPT### in songtext-worker.js
);

CREATE INDEX IF NOT EXISTS idx_checks_user ON checks(user_id);

-- Falls die Tabelle "checks" schon existiert (Datenbank vor dieser Aenderung angelegt), diese
-- Zeilen EINMALIG zusaetzlich in der D1-Console ausfuehren (fuer den Ergebnis-Verlauf/"Meine
-- Checks" - speichert das fertige Analyseergebnis kontogebunden, nicht die Audiodatei selbst):
-- ALTER TABLE checks ADD COLUMN title TEXT;
-- ALTER TABLE checks ADD COLUMN genre TEXT;
-- ALTER TABLE checks ADD COLUMN overall_score INTEGER;
-- ALTER TABLE checks ADD COLUMN classification TEXT;
-- ALTER TABLE checks ADD COLUMN title_ideas TEXT;
-- ALTER TABLE checks ADD COLUMN improved_lyrics TEXT;
-- ALTER TABLE checks ADD COLUMN tips TEXT;
-- ALTER TABLE checks ADD COLUMN fazit TEXT;
-- ALTER TABLE checks ADD COLUMN next_prompt TEXT;

-- Anonyme Rohmesswerte je Check, bewusst getrennt von der user-gebundenen "checks"-Tabelle:
-- kein user_id, kein Songtitel, keine Audiodatei - nur Zahlen + Genre-Slug. Grundlage fuer die
-- Genre-Statistik-Seiten (siehe genre_stats). Speichert die Messwerte, nicht das Urteil (kein
-- Score/keine Ampel) - Perzentile lassen sich nur aus den Rohzahlen berechnen. Komplett getrennt
-- von der eigentlichen Bewertungslogik (GENRE_PROFILES) gehalten, damit sich Referenzwerte nicht
-- selbstreferenziell an den eigenen (teils unfertigen) Nutzer-Uploads "kalibrieren".
CREATE TABLE IF NOT EXISTS check_results (
  id TEXT PRIMARY KEY,
  genre_slug TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  is_seed INTEGER NOT NULL DEFAULT 0, -- 1 = manuell per Backfill-Skript eingespielt, nicht organisch von einem Kunden

  -- Frequenzbaender, Energieanteil in % (7 Baender, siehe FREQ_BANDS in website/app.js)
  band_subbass REAL,
  band_bass REAL,
  band_lowmid REAL,
  band_mid REAL,
  band_highmid REAL,
  band_presence REAL,
  band_brilliance REAL,

  loudness_db REAL,
  true_peak_db REAL,
  crest_factor_db REAL,
  phase_correlation REAL,

  intro_silence_ms REAL,
  outro_ends_abruptly INTEGER, -- 0/1

  duration_s REAL,
  sample_rate INTEGER,
  bit_depth INTEGER, -- NULL bei komprimierten Formaten (nur aus WAV-Header auslesbar)

  metadata_violation_count INTEGER, -- Anzahl Formatcheck-Auffaelligkeiten am Titel (ALL CAPS, Emoji, feat.-Format, Sonderzeichen)
  title_occurrences INTEGER -- wie oft der Songtitel im Songtext vorkommt
);

CREATE INDEX IF NOT EXISTS idx_check_results_genre ON check_results(genre_slug);

-- Vorberechnete Kennzahlen je Genre, nachts per Cron Trigger aus check_results aggregiert (siehe
-- worker/songtext-worker.js, scheduled-Handler). Die Genre-Seiten lesen nur aus dieser Tabelle -
-- keine Live-Berechnung bei jedem Seitenaufruf, trennt Sammeln von Auswerten.
CREATE TABLE IF NOT EXISTS genre_stats (
  genre_slug TEXT PRIMARY KEY,
  updated_at INTEGER NOT NULL,
  track_count INTEGER NOT NULL,
  stats_json TEXT NOT NULL -- JSON: Median/Perzentile je Messwert, Anteil auffaelliger Tracks je Kategorie, haeufigstes Problem
);

-- Anonyme Trichter-Ereignisse (Kurzcheck fertig / Vollanalyse angeklickt / Checkout gestartet) -
-- reine Zaehler mit Zeitstempel, bewusst OHNE Kennung pro Person/Geraet/Sitzung (keine Cookies,
-- keine IP, kein user_id). Zweck: sehen, an welcher Stelle im Trichter Besucher abspringen, ohne
-- dafuer personenbezogene Daten zu speichern. Auswertung per SQL in der D1-Console, z.B.:
-- SELECT event_name, COUNT(*) FROM funnel_events WHERE created_at > (strftime('%s','now') - 7*24*3600) * 1000 GROUP BY event_name;
CREATE TABLE IF NOT EXISTS funnel_events (
  id TEXT PRIMARY KEY,
  event_name TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_funnel_events_name_time ON funnel_events(event_name, created_at);

-- Verarbeitete Stripe-Webhook-Ereignis-IDs - Stripe garantiert nur "mindestens einmal"-Zustellung,
-- ohne das hier wuerde ein erneut zugestelltes checkout.session.completed-Ereignis Credits/Abo
-- ein zweites Mal gutschreiben. Siehe handleStripeWebhook in songtext-worker.js.
CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  event_id TEXT PRIMARY KEY,
  processed_at INTEGER NOT NULL
);

-- Battle-Rap-Wettbewerb (Turnierbaum mit Publikumsabstimmung, Preisgeld gesponsert von
-- Nachtfahrt Records). Ein Konto = ein Startplatz pro Battle (UNIQUE-Index unten). Medien (Track +
-- Bild je Einreichung) liegen in R2 (Binding BATTLE_MEDIA), hier nur die Objekt-Keys.
CREATE TABLE IF NOT EXISTS battles (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'registration', -- registration | active | finished
  max_participants INTEGER NOT NULL DEFAULT 32,
  round_number INTEGER NOT NULL DEFAULT 0, -- 0 = noch keine Runde gestartet (Anmeldephase)
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS battle_participants (
  id TEXT PRIMARY KEY,
  battle_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  artist_name TEXT NOT NULL,
  registered_at INTEGER NOT NULL,
  eliminated_round INTEGER -- NULL solange noch im Turnier
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_battle_participant_unique ON battle_participants(battle_id, user_id);

-- Ein Matchup pro Duell/Runde. participant_b_id NULL = Freilos (zieht automatisch weiter, kein
-- Einreichungs-/Abstimm-Zyklus noetig fuer dieses Matchup).
CREATE TABLE IF NOT EXISTS battle_matchups (
  id TEXT PRIMARY KEY,
  battle_id TEXT NOT NULL,
  round_number INTEGER NOT NULL,
  participant_a_id TEXT NOT NULL,
  participant_b_id TEXT,
  submission_a_key TEXT, -- R2-Objekt-Key Audio
  submission_b_key TEXT,
  photo_a_key TEXT, -- R2-Objekt-Key Bild
  photo_b_key TEXT,
  votes_a INTEGER NOT NULL DEFAULT 0,
  votes_b INTEGER NOT NULL DEFAULT 0,
  winner_participant_id TEXT,
  submission_deadline INTEGER NOT NULL,
  vote_deadline INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_battle_matchups_battle_round ON battle_matchups(battle_id, round_number);

-- voter_fingerprint: zufaellige, client-seitig per crypto.randomUUID() erzeugte ID aus
-- localStorage - keine IP/kein Personenbezug, verhindert nur technisch Mehrfachstimmen vom
-- selben Browser (siehe Teilnahmebedingungen).
CREATE TABLE IF NOT EXISTS battle_votes (
  id TEXT PRIMARY KEY,
  matchup_id TEXT NOT NULL,
  voter_fingerprint TEXT NOT NULL,
  voted_for TEXT NOT NULL, -- 'a' | 'b'
  created_at INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_battle_votes_unique ON battle_votes(matchup_id, voter_fingerprint);

-- Falls die obigen Battle-Tabellen erst nachtraeglich zu einer bestehenden Datenbank
-- hinzugefuegt wurden: CREATE TABLE IF NOT EXISTS erfasst das automatisch beim naechsten
-- Schema-Lauf, hier ist (anders als bei den anderen Tabellen oben) keine manuelle ALTER TABLE
-- noetig, da alle Spalten von Anfang an Teil der Tabellendefinition sind.
