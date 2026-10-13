ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS phone VARCHAR(16);
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS phone_country VARCHAR(5);
DO $$
BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contact_messages_phone_format') THEN
  ALTER TABLE contact_messages ADD CONSTRAINT contact_messages_phone_format CHECK (phone IS NULL OR phone ~ '^\+[1-9][0-9]{6,14}$');
 END IF;
END $$;
