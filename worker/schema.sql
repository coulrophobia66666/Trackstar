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

CREATE TABLE IF NOT EXISTS checks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_checks_user ON checks(user_id);
