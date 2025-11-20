-- ============================================================================
-- UPDATE EXECUTIVE_APPOINTMENTS STATUS CONSTRAINT
-- Add new workflow states for activation process
-- ============================================================================

-- Note: PostgreSQL doesn't support ALTER COLUMN ... DROP CONSTRAINT directly
-- We need to drop and recreate the constraint if it exists
-- However, since the original migration doesn't show an explicit CHECK constraint,
-- we'll add a comment and ensure the application handles these statuses correctly

-- Add comment documenting all valid statuses
COMMENT ON COLUMN public.executive_appointments.status IS 
'Appointment status workflow: DRAFT -> SENT_TO_BOARD -> BOARD_ADOPTED -> AWAITING_SIGNATURES -> READY_FOR_SECRETARY_REVIEW -> SECRETARY_APPROVED -> ACTIVATING -> ACTIVE. Can also be REJECTED at any stage.';

-- Create a function to validate status transitions
CREATE OR REPLACE FUNCTION public.validate_appointment_status_transition(
  old_status TEXT,
  new_status TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Allow transitions to REJECTED from any state
  IF new_status = 'REJECTED' THEN
    RETURN TRUE;
  END IF;
  
  -- Define valid status transitions
  CASE old_status
    WHEN 'DRAFT' THEN
      RETURN new_status IN ('SENT_TO_BOARD', 'REJECTED');
    WHEN 'SENT_TO_BOARD' THEN
      RETURN new_status IN ('BOARD_ADOPTED', 'REJECTED');
    WHEN 'BOARD_ADOPTED' THEN
      RETURN new_status IN ('AWAITING_SIGNATURES', 'REJECTED');
    WHEN 'AWAITING_SIGNATURES' THEN
      RETURN new_status IN ('READY_FOR_SECRETARY_REVIEW', 'REJECTED');
    WHEN 'READY_FOR_SECRETARY_REVIEW' THEN
      RETURN new_status IN ('SECRETARY_APPROVED', 'REJECTED');
    WHEN 'SECRETARY_APPROVED' THEN
      RETURN new_status IN ('ACTIVATING', 'REJECTED');
    WHEN 'ACTIVATING' THEN
      RETURN new_status IN ('ACTIVE', 'REJECTED');
    WHEN 'ACTIVE' THEN
      RETURN new_status = 'ACTIVE'; -- Can't change from ACTIVE
    WHEN 'REJECTED' THEN
      RETURN FALSE; -- Can't transition from REJECTED
    ELSE
      RETURN TRUE; -- Allow other transitions for backward compatibility
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Note: We're not creating a trigger to enforce this automatically
-- The application code should validate status transitions
-- This function can be called from application code or triggers if needed

COMMENT ON FUNCTION public.validate_appointment_status_transition IS 
'Validates appointment status transitions according to workflow rules. Returns TRUE if transition is valid, FALSE otherwise.';

