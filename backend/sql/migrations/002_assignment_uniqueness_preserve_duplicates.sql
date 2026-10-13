ALTER TABLE assignments ADD COLUMN IF NOT EXISTS duplicate_of BIGINT REFERENCES assignments(id);
UPDATE assignments a
   SET duplicate_of = d.keep_id
  FROM (SELECT id, MIN(id) OVER (PARTITION BY incident_id, volunteer_id) AS keep_id FROM assignments) d
 WHERE a.id = d.id AND d.keep_id <> a.id AND a.duplicate_of IS NULL;
DROP INDEX IF EXISTS uq_assignments_incident_volunteer;
CREATE UNIQUE INDEX IF NOT EXISTS uq_assignments_incident_volunteer_active ON assignments(incident_id, volunteer_id) WHERE duplicate_of IS NULL;
CREATE INDEX IF NOT EXISTS idx_assignments_duplicate_of ON assignments(duplicate_of) WHERE duplicate_of IS NOT NULL;
CREATE OR REPLACE VIEW assignment_duplicates_review AS
SELECT d.id AS duplicate_assignment_id, d.duplicate_of AS kept_assignment_id, d.incident_id, d.volunteer_id,
       d.task AS duplicate_task, k.task AS kept_task, d.status AS duplicate_status, k.status AS kept_status,
       d.created_at AS duplicate_created_at, k.created_at AS kept_created_at
  FROM assignments d JOIN assignments k ON k.id = d.duplicate_of
 WHERE d.duplicate_of IS NOT NULL;
