CREATE TABLE IF NOT EXISTS users (
 id BIGSERIAL PRIMARY KEY,
 name VARCHAR(120) NOT NULL,
 email VARCHAR(255) NOT NULL UNIQUE,
 password_hash TEXT NOT NULL,
 role VARCHAR(10) NOT NULL DEFAULT 'user' CHECK (role IN ('admin','user')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS incidents (
 id BIGSERIAL PRIMARY KEY,
 user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
 type VARCHAR(80) NOT NULL,
 location VARCHAR(255) NOT NULL,
 urgency VARCHAR(20) NOT NULL CHECK (urgency IN ('Low','Medium','High','Critical')),
 description TEXT NOT NULL,
 status VARCHAR(30) NOT NULL DEFAULT 'Under Review' CHECK (status IN ('Under Review','In Progress','Resolved')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS volunteers (
 id BIGSERIAL PRIMARY KEY,
 user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
 category VARCHAR(20) NOT NULL CHECK (category IN ('General','Trained')),
 location VARCHAR(255) NOT NULL,
 skills TEXT NOT NULL,
 phone VARCHAR(30) NOT NULL,
 training TEXT NOT NULL DEFAULT '',
 certificate TEXT NOT NULL DEFAULT '',
 availability VARCHAR(20) NOT NULL DEFAULT 'Available' CHECK (availability IN ('Available','Unavailable')),
 verification VARCHAR(40) NOT NULL DEFAULT 'Not Required' CHECK (verification IN ('Not Required','Pending Verification','Active - Verified','Rejected')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS verification_history (
 id BIGSERIAL PRIMARY KEY,
 volunteer_id BIGINT NOT NULL REFERENCES volunteers(id) ON DELETE CASCADE,
 reviewer_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
 decision VARCHAR(20) NOT NULL CHECK (decision IN ('Approved','Rejected')),
 reason TEXT NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS assignments (
 id BIGSERIAL PRIMARY KEY,
 incident_id BIGINT NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
 volunteer_id BIGINT NOT NULL REFERENCES volunteers(id) ON DELETE CASCADE,
 task VARCHAR(120) NOT NULL,
 instructions TEXT NOT NULL DEFAULT '',
 status VARCHAR(25) NOT NULL DEFAULT 'Notified' CHECK (status IN ('Notified','Accepted','In Progress','Completed')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS resources (
 id BIGSERIAL PRIMARY KEY,
 incident_id BIGINT NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
 resource VARCHAR(120) NOT NULL,
 quantity INTEGER NOT NULL CHECK (quantity > 0),
 priority VARCHAR(20) NOT NULL DEFAULT 'Normal' CHECK (priority IN ('Normal','High','Urgent')),
 notes TEXT NOT NULL DEFAULT '',
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS tickets (
 id BIGSERIAL PRIMARY KEY,
 user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 subject VARCHAR(180) NOT NULL,
 category VARCHAR(80) NOT NULL,
 message TEXT NOT NULL,
 status VARCHAR(25) NOT NULL DEFAULT 'Open' CHECK (status IN ('Open','In Progress','Resolved','Closed')),
 admin_reply TEXT NOT NULL DEFAULT '',
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS contact_messages (
 id BIGSERIAL PRIMARY KEY,
 name VARCHAR(120) NOT NULL,
 email VARCHAR(255) NOT NULL,
 subject VARCHAR(180) NOT NULL,
 message TEXT NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_incidents_user ON incidents(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_user ON tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_assignments_volunteer ON assignments(volunteer_id);
