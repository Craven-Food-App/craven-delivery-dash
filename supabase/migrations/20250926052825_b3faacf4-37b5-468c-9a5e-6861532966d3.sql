-- Create notification_settings table for admin-configurable notifications
CREATE TABLE public.notification_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  sound_file TEXT NOT NULL,
  duration_ms INTEGER NOT NULL DEFAULT 3000,
  repeat_count INTEGER NOT NULL DEFAULT 1,
  repeat_interval_ms INTEGER NOT NULL DEFAULT 1000,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for notification settings
CREATE POLICY "Everyone can view notification settings" 
ON public.notification_settings 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage notification settings" 
ON public.notification_settings 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = auth.uid() AND role = 'admin'
));

-- Create user_notification_preferences table
CREATE TABLE public.user_notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  notification_setting_id UUID NOT NULL REFERENCES public.notification_settings(id),
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, notification_setting_id)
);

-- Enable RLS
ALTER TABLE public.user_notification_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies for user notification preferences
CREATE POLICY "Users can manage their own notification preferences" 
ON public.user_notification_preferences 
FOR ALL 
USING (auth.uid() = user_id);

-- Insert default notification options
INSERT INTO public.notification_settings (name, description, sound_file, duration_ms, repeat_count, repeat_interval_ms, is_default) VALUES
('Standard Alert', 'Standard notification sound', '/notification.mp3', 3000, 1, 1000, true),
('Urgent Alert', 'Louder, repeated notification for urgent orders', '/notification.mp3', 2000, 3, 500, false),
('Gentle Chime', 'Soft notification sound', '/notification.mp3', 1500, 1, 1000, false),
('Persistent Buzz', 'Continuous notification until dismissed', '/notification.mp3', 1000, 5, 800, false);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_notification_settings_updated_at
BEFORE UPDATE ON public.notification_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_notification_preferences_updated_at
BEFORE UPDATE ON public.user_notification_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();