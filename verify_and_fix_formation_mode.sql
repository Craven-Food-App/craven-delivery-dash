-- ============================================================================
-- VERIFY AND FIX FORMATION MODE FOR TORRANCE STROMAN
-- This script checks if formation_mode column exists and enables it
-- ============================================================================

-- First, ensure the migration has been applied (add columns if they don't exist)
ALTER TABLE public.executive_appointments
ADD COLUMN IF NOT EXISTS formation_mode BOOLEAN DEFAULT false;

ALTER TABLE public.executive_appointments
ADD COLUMN IF NOT EXISTS pre_incorporation_consent_url TEXT;

-- Check current state
SELECT 
  id,
  proposed_officer_name,
  proposed_officer_email,
  proposed_title,
  status,
  formation_mode,
  pre_incorporation_consent_url,
  created_at
FROM public.executive_appointments
WHERE proposed_officer_email = 'tstroman.ceo@cravenusa.com'
  AND proposed_officer_name ILIKE '%Torrance%Stroman%'
ORDER BY created_at DESC;

-- Enable formation_mode for Torrance Stroman (fix typo in name too)
UPDATE public.executive_appointments
SET 
  formation_mode = true,
  updated_at = now()
WHERE (proposed_officer_email = 'tstroman.ceo@cravenusa.com'
  OR proposed_officer_email = 'tstroman.ceo@cravenusa.com')
  AND (proposed_officer_name ILIKE '%Torrance%Stroman%' 
    OR proposed_officer_name ILIKE '%Torrace%Stroman%');

-- Verify the update
SELECT 
  id,
  proposed_officer_name,
  proposed_officer_email,
  formation_mode,
  pre_incorporation_consent_url,
  status
FROM public.executive_appointments
WHERE proposed_officer_email = 'tstroman.ceo@cravenusa.com'
  AND proposed_officer_name ILIKE '%Torrance%Stroman%';

