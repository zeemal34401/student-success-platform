-- Faculty / staff invitation tokens for secure onboarding

ALTER TABLE users ADD COLUMN invite_token_hash TEXT;
ALTER TABLE users ADD COLUMN invite_expires_at TEXT;
ALTER TABLE users ADD COLUMN invited_at TEXT;
ALTER TABLE users ADD COLUMN invited_by TEXT REFERENCES users(id);
ALTER TABLE users ADD COLUMN password_set_at TEXT;
ALTER TABLE users ADD COLUMN work_email TEXT;

CREATE INDEX IF NOT EXISTS idx_users_invite_token_hash ON users(invite_token_hash);
