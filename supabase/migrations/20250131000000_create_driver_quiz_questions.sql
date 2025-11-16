-- Create driver_quiz_questions table for managing quiz questions
CREATE TABLE IF NOT EXISTS public.driver_quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer TEXT NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
  points INTEGER NOT NULL DEFAULT 1 CHECK (points IN (1, 2)),
  section TEXT NOT NULL CHECK (section IN ('basic_operations', 'safety_procedures')),
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.driver_quiz_questions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can manage quiz questions"
ON public.driver_quiz_questions
FOR ALL
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

CREATE POLICY "Everyone can view active quiz questions"
ON public.driver_quiz_questions
FOR SELECT
USING (is_active = true);

-- Trigger to keep updated_at fresh
CREATE OR REPLACE FUNCTION public.update_quiz_questions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_driver_quiz_questions_updated_at ON public.driver_quiz_questions;
CREATE TRIGGER trg_driver_quiz_questions_updated_at
BEFORE UPDATE ON public.driver_quiz_questions
FOR EACH ROW
EXECUTE FUNCTION public.update_quiz_questions_updated_at();

-- Insert default quiz questions (15 questions, 25 points total)
INSERT INTO public.driver_quiz_questions (question_text, option_a, option_b, option_c, option_d, correct_answer, points, section, display_order) VALUES
-- Section 1: Basic Operations (1 point each - 7 questions)
('What is the official Crave''n driver app used for?', 'Social media', 'Order delivery & communication with customers', 'Restaurant payments', 'Bank transfers', 'B', 1, 'basic_operations', 1),
('When should you mark an order as "Picked Up"?', 'When you arrive at the restaurant', 'After you receive the sealed order from staff', 'Only after you text the customer', 'After delivery', 'B', 1, 'basic_operations', 2),
('Drivers must keep the Crave''n Driver App:', 'Open and active during all deliveries', 'Closed to save battery', 'Only open when delivering after 5 PM', 'Open only for long-distance orders', 'A', 1, 'basic_operations', 3),
('If you cannot find the customer''s address, what do you do first?', 'Cancel the order', 'Contact Crave''n support', 'Call or message the customer through the app', 'Drive back to the restaurant', 'C', 1, 'basic_operations', 4),
('When handling food bags, drivers should:', 'Open the bags to double-check the food', 'Keep the bags sealed and never open them', 'Shake the bags to check for drinks', 'Leave bags on the car floor', 'B', 1, 'basic_operations', 5),
('If a customer is rude or confrontational, the correct response is:', 'Argue back', 'Ignore them and walk away', 'Stay professional and report the issue through Crave''n support', 'Ask for cash compensation', 'C', 1, 'basic_operations', 6),
('How early should a driver arrive for a scheduled shift or scheduled block?', '10 minutes early', 'Exactly at the start time', '30 minutes early', 'Any time as long as you pick up orders', 'A', 1, 'basic_operations', 7),
-- Section 2: Safety & Procedures (2 points each - 8 questions)
('What should drivers always do before starting a shift?', 'Turn on hazard lights', 'Complete a vehicle and phone battery check', 'Vacuum the car', 'Set the phone to airplane mode', 'B', 2, 'safety_procedures', 8),
('A sealed bag from the restaurant must be delivered:', 'Exactly as received — never opened or altered', 'Opened to confirm contents', 'With added condiments', 'With a handwritten note', 'A', 2, 'safety_procedures', 9),
('If the app freezes while delivering an active order, what''s the correct action?', 'Restart your phone immediately', 'Close the app and reopen it', 'Hard reset your account', 'Cancel the order', 'B', 2, 'safety_procedures', 10),
('Crave''n''s "No Contact Delivery" requires drivers to:', 'Leave the order, knock, step back, and confirm via photo', 'Hand the order directly to the customer', 'Call the customer before arriving', 'Leave it anywhere visible', 'A', 2, 'safety_procedures', 11),
('If food spills inside the bag during delivery, you should:', 'Deliver it anyway', 'Try to fix it yourself', 'Contact support and follow instructions', 'Sell the food', 'C', 2, 'safety_procedures', 12),
('When driving with hot or liquid items, the bags must be placed:', 'On the dashboard', 'On the passenger seat', 'Securely in an upright position away from falling', 'On your lap for safety', 'C', 2, 'safety_procedures', 13),
('Drivers are required to use an insulated delivery bag because:', 'It looks more professional', 'It keeps food at safe temperatures and prevents complaints', 'It holds your personal food', 'It''s optional but recommended', 'B', 2, 'safety_procedures', 14),
('If a driver witnesses unsafe behavior at a restaurant or customer location, they should:', 'Film it', 'Ignore it', 'Report it to Crave''n through the incident form', 'Post it on social media', 'C', 2, 'safety_procedures', 15)
ON CONFLICT DO NOTHING;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_driver_quiz_questions_active_order ON public.driver_quiz_questions(is_active, display_order);

