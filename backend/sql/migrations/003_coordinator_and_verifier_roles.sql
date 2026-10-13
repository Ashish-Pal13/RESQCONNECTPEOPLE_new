ALTER TABLE users ALTER COLUMN role TYPE VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(60);
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
CREATE UNIQUE INDEX IF NOT EXISTS uq_users_username ON users(username);
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
UPDATE users SET is_active = FALSE WHERE role = 'admin';
UPDATE users SET role = 'coordinator' WHERE role = 'admin';
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('coordinator','verifier','user'));
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'user';
