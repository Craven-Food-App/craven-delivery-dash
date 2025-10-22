-- Add waitlist columns to craver_applications table
ALTER TABLE craver_applications 
ADD COLUMN IF NOT EXISTS waitlist_joined_at timestamptz,
ADD COLUMN IF NOT EXISTS waitlist_position integer,
ADD COLUMN IF NOT EXISTS waitlist_priority_score integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS waitlist_notes text;

-- Create function to auto-calculate waitlist position
CREATE OR REPLACE FUNCTION calculate_waitlist_position()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'waitlist' THEN
    NEW.waitlist_position := (
      SELECT COUNT(*) + 1
      FROM craver_applications
      WHERE status = 'waitlist'
      AND city = NEW.city
      AND state = NEW.state
      AND created_at < NEW.created_at
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for waitlist position
DROP TRIGGER IF EXISTS set_waitlist_position ON craver_applications;
CREATE TRIGGER set_waitlist_position
BEFORE INSERT OR UPDATE ON craver_applications
FOR EACH ROW
WHEN (NEW.status = 'waitlist')
EXECUTE FUNCTION calculate_waitlist_position();