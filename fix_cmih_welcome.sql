-- Manual SQL to fix CMIH Kitchen welcome screen
-- Run this in Supabase SQL Editor

-- First, check current status
SELECT name, merchant_welcome_shown, merchant_welcome_shown_at 
FROM restaurants 
WHERE name = 'CMIH Kitchen';

-- Set merchant_welcome_shown to FALSE for CMIH Kitchen
UPDATE restaurants 
SET merchant_welcome_shown = FALSE,
    merchant_welcome_shown_at = NULL
WHERE name = 'CMIH Kitchen';

-- Verify the change
SELECT name, merchant_welcome_shown, merchant_welcome_shown_at 
FROM restaurants 
WHERE name = 'CMIH Kitchen';
