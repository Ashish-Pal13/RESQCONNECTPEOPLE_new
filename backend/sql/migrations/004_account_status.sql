ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
UPDATE users SET is_active = FALSE WHERE password_hash = '!legacy-admin-locked';
