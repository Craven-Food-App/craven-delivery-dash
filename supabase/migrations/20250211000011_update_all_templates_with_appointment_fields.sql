-- Update all document templates to include placeholders from the new appointment form
-- This ensures all templates can access appointment form data when generating documents
-- The new appointment form fields are merged with existing placeholders for each template

-- Define the new appointment form placeholders to add
DO $$
DECLARE
  new_placeholders jsonb := '["proposed_officer_name", "full_name", "executive_name", "officer_name", "name", "proposed_officer_email", "email", "proposed_officer_phone", "phone", "proposed_title", "title", "role", "position", "position_title", "executive_title", "department", "reporting_to", "effective_date", "date", "appointment_date", "appointment_type", "board_meeting_date", "annual_salary", "annual_base_salary", "base_salary", "salary", "annual_bonus_percentage", "bonus_percentage", "performance_bonus", "benefits", "compensation_description", "equity_percentage", "equity_percent", "share_count", "shares_issued", "number_of_shares", "vesting_schedule", "exercise_price", "equity_included", "authority_granted", "term_length_months", "term_end", "resolution_number", "resolution_date", "notes"]'::jsonb;
  template_record RECORD;
BEGIN
  -- Update all templates in the database
  FOR template_record IN 
    SELECT template_key, placeholders 
    FROM public.document_templates
  LOOP
    -- Merge existing placeholders with new appointment form placeholders
    UPDATE public.document_templates
    SET 
      placeholders = (
        SELECT jsonb_agg(DISTINCT value ORDER BY value)
        FROM jsonb_array_elements_text(
          COALESCE(template_record.placeholders, '[]'::jsonb) || new_placeholders
        )
      ),
      updated_at = now()
    WHERE template_key = template_record.template_key;
  END LOOP;
END $$;

