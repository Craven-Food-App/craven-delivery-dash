-- Step 1: Clean up orphaned driver_sessions records
DELETE FROM driver_sessions 
WHERE driver_id NOT IN (SELECT id FROM driver_profiles);

-- Step 2: Add foreign key constraint for driver_sessions to driver_profiles
ALTER TABLE driver_sessions 
ADD CONSTRAINT fk_driver_sessions_driver_id 
FOREIGN KEY (driver_id) 
REFERENCES driver_profiles(id) 
ON DELETE CASCADE;

-- Step 3: Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_driver_sessions_driver_id 
ON driver_sessions(driver_id);

CREATE INDEX IF NOT EXISTS idx_driver_sessions_is_online 
ON driver_sessions(is_online);