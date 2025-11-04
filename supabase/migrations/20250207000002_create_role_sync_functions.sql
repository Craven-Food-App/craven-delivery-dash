-- Role and Position Synchronization System
-- Creates standardized functions for C-level detection and role normalization
-- Ensures system-wide consistency in role/position handling

-- Function: Check if position is C-level executive
CREATE OR REPLACE FUNCTION public.is_c_level_position(position_text TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  IF position_text IS NULL OR position_text = '' THEN
    RETURN FALSE;
  END IF;
  
  RETURN LOWER(position_text) ~ '.*(chief|ceo|cfo|coo|cto|cmo|cro|cpo|cdo|chro|clo|cso|cxo|president|board member|advisor).*';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function: Normalize position to exec_users role
CREATE OR REPLACE FUNCTION public.position_to_exec_role(position_text TEXT)
RETURNS TEXT AS $$
DECLARE
  pos_lower TEXT;
BEGIN
  IF position_text IS NULL OR position_text = '' THEN
    RETURN NULL;
  END IF;
  
  pos_lower := LOWER(position_text);
  
  CASE
    WHEN pos_lower LIKE '%ceo%' OR pos_lower LIKE '%chief executive%' THEN 
      RETURN 'ceo';
    WHEN pos_lower LIKE '%cfo%' OR pos_lower LIKE '%chief financial%' THEN 
      RETURN 'cfo';
    WHEN pos_lower LIKE '%coo%' OR pos_lower LIKE '%chief operating%' THEN 
      RETURN 'coo';
    WHEN pos_lower LIKE '%cto%' OR pos_lower LIKE '%chief technology%' THEN 
      RETURN 'cto';
    WHEN pos_lower LIKE '%cmo%' OR pos_lower LIKE '%chief marketing%' THEN 
      RETURN 'board_member';
    WHEN pos_lower LIKE '%cro%' OR pos_lower LIKE '%chief revenue%' THEN 
      RETURN 'board_member';
    WHEN pos_lower LIKE '%cpo%' OR pos_lower LIKE '%chief product%' THEN 
      RETURN 'board_member';
    WHEN pos_lower LIKE '%cdo%' OR pos_lower LIKE '%chief data%' THEN 
      RETURN 'board_member';
    WHEN pos_lower LIKE '%chro%' OR pos_lower LIKE '%chief human%' THEN 
      RETURN 'board_member';
    WHEN pos_lower LIKE '%clo%' OR pos_lower LIKE '%chief legal%' THEN 
      RETURN 'board_member';
    WHEN pos_lower LIKE '%cso%' OR pos_lower LIKE '%chief security%' THEN 
      RETURN 'board_member';
    WHEN pos_lower LIKE '%cxo%' THEN 
      RETURN 'board_member';
    WHEN pos_lower LIKE '%president%' THEN 
      RETURN 'board_member';
    WHEN pos_lower LIKE '%board member%' OR pos_lower LIKE '%advisor%' THEN 
      RETURN 'board_member';
    ELSE 
      RETURN NULL;
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function: Get department name from department_id
CREATE OR REPLACE FUNCTION public.get_department_name(dept_id UUID)
RETURNS TEXT AS $$
DECLARE
  dept_name TEXT;
BEGIN
  IF dept_id IS NULL THEN
    RETURN 'Executive';
  END IF;
  
  SELECT name INTO dept_name 
  FROM public.departments 
  WHERE id = dept_id;
  
  RETURN COALESCE(dept_name, 'Executive');
END;
$$ LANGUAGE plpgsql STABLE;

-- Add comments for documentation
COMMENT ON FUNCTION public.is_c_level_position IS 'Determines if a position string represents a C-level executive role';
COMMENT ON FUNCTION public.position_to_exec_role IS 'Normalizes a position string to an exec_users role (ceo, cfo, coo, cto, or board_member)';
COMMENT ON FUNCTION public.get_department_name IS 'Gets department name from department_id, defaults to Executive';

