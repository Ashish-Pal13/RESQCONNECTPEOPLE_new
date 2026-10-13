ALTER TABLE assignments ADD COLUMN IF NOT EXISTS status_reason VARCHAR(255) NOT NULL DEFAULT '';
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
UPDATE assignments SET updated_at = created_at WHERE updated_at IS NULL;
ALTER TABLE assignments ALTER COLUMN updated_at SET DEFAULT NOW();
ALTER TABLE assignments ALTER COLUMN updated_at SET NOT NULL;
DO $$
DECLARE
 c record;
BEGIN
 FOR c IN
  SELECT conname FROM pg_constraint
   WHERE conrelid = 'assignments'::regclass AND contype = 'c' AND pg_get_constraintdef(oid) ILIKE '%status%'
 LOOP
  EXECUTE format('ALTER TABLE assignments DROP CONSTRAINT %I', c.conname);
 END LOOP;
END $$;
ALTER TABLE assignments ADD CONSTRAINT assignments_status_check CHECK (status IN ('Notified','Accepted','In Progress','Completed','Declined','Cancelled'));
DROP INDEX IF EXISTS uq_assignments_incident_volunteer_active;
CREATE UNIQUE INDEX uq_assignments_incident_volunteer_active ON assignments(incident_id, volunteer_id) WHERE duplicate_of IS NULL AND status NOT IN ('Declined','Cancelled');
UPDATE assignments a
   SET status = 'Cancelled', status_reason = 'Incident INC-' || i.id || ' was already resolved', updated_at = NOW()
  FROM incidents i
 WHERE i.id = a.incident_id AND i.status = 'Resolved' AND a.status IN ('Notified','Accepted','In Progress');
CREATE INDEX IF NOT EXISTS idx_assignments_status ON assignments(status);
CREATE INDEX IF NOT EXISTS idx_assignments_created ON assignments(created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_resources_created ON resources(created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_created ON tickets(created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_volunteers_created ON volunteers(created_at DESC, id DESC);
