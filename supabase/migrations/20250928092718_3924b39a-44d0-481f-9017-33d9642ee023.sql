-- Fix the notification settings to use the correct sound file
UPDATE public.notification_settings 
SET sound_file = '/notification.mp3'
WHERE sound_file LIKE 'blob:%' OR sound_file = '';

-- Set the Standard Alert as the default since the blob URL is broken
UPDATE public.notification_settings 
SET is_default = false;

UPDATE public.notification_settings 
SET is_default = true 
WHERE name = 'Standard Alert';