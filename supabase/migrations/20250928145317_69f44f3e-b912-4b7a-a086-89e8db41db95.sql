-- Add default notification sound if none exists
DO $$
BEGIN
  -- Check if any notification settings exist
  IF NOT EXISTS (SELECT 1 FROM public.notification_settings WHERE is_active = true) THEN
    -- Insert default notification sound
    INSERT INTO public.notification_settings (
      name,
      description,
      sound_file,
      duration_ms,
      repeat_count,
      repeat_interval_ms,
      is_active,
      is_default
    ) VALUES (
      'Default Alert',
      'Built-in default notification sound',
      '/notification.mp3',
      3000,
      2,
      300,
      true,
      true
    );
  END IF;
END $$;