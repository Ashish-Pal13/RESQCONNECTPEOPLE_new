CREATE TABLE IF NOT EXISTS users (
 id BIGSERIAL PRIMARY KEY,
 name VARCHAR(120) NOT NULL,
 email VARCHAR(255) NOT NULL UNIQUE,
 password_hash TEXT NOT NULL,
 username VARCHAR(60),
 is_active BOOLEAN NOT NULL DEFAULT TRUE,
 role VARCHAR(20) NOT NULL DEFAULT 'user' CONSTRAINT users_role_check CHECK (role IN ('coordinator','verifier','user')),
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
 status VARCHAR(25) NOT NULL DEFAULT 'Notified' CONSTRAINT assignments_status_check CHECK (status IN ('Notified','Accepted','In Progress','Completed','Declined','Cancelled')),
 status_reason VARCHAR(255) NOT NULL DEFAULT '',
 duplicate_of BIGINT REFERENCES assignments(id),
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
 phone VARCHAR(16) CONSTRAINT contact_messages_phone_format CHECK (phone IS NULL OR phone ~ '^\+[1-9][0-9]{6,14}$'),
 phone_country VARCHAR(5),
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_incidents_user ON incidents(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_user ON tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_assignments_volunteer ON assignments(volunteer_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role_created ON users(role, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_created ON incidents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_volunteers_verification ON volunteers(verification);
CREATE INDEX IF NOT EXISTS idx_assignments_incident ON assignments(incident_id);
CREATE INDEX IF NOT EXISTS idx_resources_incident ON resources(incident_id);
CREATE INDEX IF NOT EXISTS idx_verification_history_volunteer ON verification_history(volunteer_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE UNIQUE INDEX IF NOT EXISTS uq_assignments_incident_volunteer_active ON assignments(incident_id, volunteer_id) WHERE duplicate_of IS NULL AND status NOT IN ('Declined','Cancelled');
CREATE INDEX IF NOT EXISTS idx_assignments_status ON assignments(status);
CREATE INDEX IF NOT EXISTS idx_assignments_created ON assignments(created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_resources_created ON resources(created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_created ON tickets(created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_volunteers_created ON volunteers(created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_assignments_duplicate_of ON assignments(duplicate_of) WHERE duplicate_of IS NOT NULL;
CREATE OR REPLACE VIEW assignment_duplicates_review AS
SELECT d.id AS duplicate_assignment_id, d.duplicate_of AS kept_assignment_id, d.incident_id, d.volunteer_id,
       d.task AS duplicate_task, k.task AS kept_task, d.status AS duplicate_status, k.status AS kept_status,
       d.created_at AS duplicate_created_at, k.created_at AS kept_created_at
  FROM assignments d JOIN assignments k ON k.id = d.duplicate_of
 WHERE d.duplicate_of IS NOT NULL;
CREATE TABLE IF NOT EXISTS notifications (
 id BIGSERIAL PRIMARY KEY,
 recipient_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 type VARCHAR(40) NOT NULL,
 title VARCHAR(160) NOT NULL,
 message TEXT NOT NULL DEFAULT '',
 link VARCHAR(255) NOT NULL DEFAULT '',
 is_read BOOLEAN NOT NULL DEFAULT FALSE,
 read_at TIMESTAMPTZ,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_created ON notifications(recipient_id, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_unread ON notifications(recipient_id) WHERE NOT is_read;
