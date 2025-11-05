-- Add officer-specific fields to exec_users table
ALTER TABLE exec_users 
  ADD COLUMN IF NOT EXISTS appointment_date DATE,
  ADD COLUMN IF NOT EXISTS board_resolution_id UUID REFERENCES board_resolutions(id),
  ADD COLUMN IF NOT EXISTS officer_status TEXT DEFAULT 'appointed' CHECK (officer_status IN ('appointed', 'active', 'resigned', 'removed')),
  ADD COLUMN IF NOT EXISTS is_also_employee BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS linked_employee_id UUID REFERENCES employees(id);

-- Add comment explaining the separation
COMMENT ON COLUMN exec_users.is_also_employee IS 'True if officer also has employee status with active salary. Officers start as equity-only until funding.';
COMMENT ON COLUMN exec_users.linked_employee_id IS 'Links to employees table if officer converted to employee post-funding';
COMMENT ON COLUMN exec_users.officer_status IS 'Officer appointment status - tracks board appointment lifecycle';
COMMENT ON COLUMN exec_users.appointment_date IS 'Date officer was appointed by board resolution';

-- Create index for officer status queries
CREATE INDEX IF NOT EXISTS idx_exec_users_officer_status ON exec_users(officer_status);
CREATE INDEX IF NOT EXISTS idx_exec_users_appointment_date ON exec_users(appointment_date);