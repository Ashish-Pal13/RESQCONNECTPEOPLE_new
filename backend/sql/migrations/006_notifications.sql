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
