-- Fix trigger function that references non-existent orders.status column
-- Update to use orders.order_status instead
CREATE OR REPLACE FUNCTION public.update_driver_referral_on_delivery()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $function$
DECLARE
  driver_referral RECORD;
  delivery_count INT;
  settings_record RECORD;
BEGIN
  -- Fire only when an order transitions to delivered
  IF NEW.order_status = 'delivered' AND OLD.order_status != 'delivered' THEN
    -- Find referral for the assigned driver
    SELECT * INTO driver_referral 
    FROM referrals 
    WHERE referred_id = NEW.assigned_craver_id 
      AND referral_type = 'driver'
      AND status IN ('pending', 'completed')
    LIMIT 1;

    IF driver_referral IS NOT NULL THEN
      -- Recompute completed deliveries for the referee
      SELECT COUNT(*) INTO delivery_count
      FROM orders
      WHERE assigned_craver_id = NEW.assigned_craver_id 
        AND order_status = 'delivered';

      UPDATE referrals
      SET referee_completed_deliveries = delivery_count
      WHERE id = driver_referral.id;

      -- Get referral settings
      SELECT * INTO settings_record 
      FROM referral_settings 
      WHERE referral_type = 'driver' AND is_active = true 
      LIMIT 1;

      IF settings_record IS NOT NULL THEN
        -- Milestone 1
        IF delivery_count >= settings_record.milestone_1_delivery_count 
           AND NOT driver_referral.milestone_1_paid THEN
          PERFORM process_driver_referral_milestone(driver_referral.id, 1);
        END IF;

        -- Milestone 2
        IF delivery_count >= settings_record.milestone_2_delivery_count 
           AND NOT driver_referral.milestone_2_paid THEN
          PERFORM process_driver_referral_milestone(driver_referral.id, 2);
        END IF;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;