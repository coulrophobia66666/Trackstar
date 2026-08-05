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
  has_bought_credits INTEGER NOT NULL DEFAULT 0 -- 1 sobald das Credits-Paket mind. einmal gekauft wurde (fuer den Pro-Upgrade-Rabatt)
);

-- Falls die Tabelle "users" schon existiert (Datenbank vor dieser Aenderung angelegt),
-- diese Zeile EINMALIG zusaetzlich in der D1-Console ausfuehren:
-- ALTER TABLE users ADD COLUMN has_bought_credits INTEGER NOT NULL DEFAULT 0;

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
  fazit TEXT
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
