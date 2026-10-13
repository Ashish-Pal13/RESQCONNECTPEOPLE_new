CREATE INDEX IF NOT EXISTS idx_users_role_created ON users(role, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_created ON incidents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_volunteers_verification ON volunteers(verification);
CREATE INDEX IF NOT EXISTS idx_assignments_incident ON assignments(incident_id);
CREATE INDEX IF NOT EXISTS idx_resources_incident ON resources(incident_id);
CREATE INDEX IF NOT EXISTS idx_verification_history_volunteer ON verification_history(volunteer_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
