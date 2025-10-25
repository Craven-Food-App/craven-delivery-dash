-- Fix remaining security warnings: Add search_path to remaining database functions

CREATE OR REPLACE FUNCTION public.generate_referral_code(p_user_id uuid, p_user_type text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_code TEXT;
  v_exists BOOLEAN;
  v_attempts INTEGER := 0;
BEGIN
  LOOP
    v_code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
    SELECT EXISTS(SELECT 1 FROM referral_codes WHERE code = v_code) INTO v_exists;
    
    IF NOT v_exists THEN
      INSERT INTO referral_codes (user_id, code, user_type)
      VALUES (p_user_id, v_code, p_user_type);
      RETURN v_code;
    END IF;
    
    v_attempts := v_attempts + 1;
    IF v_attempts > 10 THEN
      RAISE EXCEPTION 'Failed to generate unique referral code';
    END IF;
  END LOOP;
END;
$function$;

CREATE OR REPLACE FUNCTION public.has_active_subscription(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_subscriptions
    WHERE user_id = p_user_id
      AND status = 'active'
      AND (end_date IS NULL OR end_date > NOW())
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.apply_subscription_benefits(p_order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_order RECORD;
  v_subscription_id UUID;
  v_benefits JSONB;
  v_delivery_discount INTEGER := 0;
  v_service_fee_discount INTEGER := 0;
  v_min_amount INTEGER;
BEGIN
  SELECT * INTO v_order FROM orders WHERE id = p_order_id;
  IF NOT FOUND THEN
    RETURN '{"applied": false, "reason": "Order not found"}'::jsonb;
  END IF;
  
  SELECT us.id, sp.benefits 
  INTO v_subscription_id, v_benefits
  FROM user_subscriptions us
  JOIN subscription_plans sp ON sp.id = us.plan_id
  WHERE us.user_id = v_order.customer_id
    AND us.status = 'active'
    AND (us.end_date IS NULL OR us.end_date > NOW())
  LIMIT 1;
  
  IF v_subscription_id IS NULL THEN
    RETURN '{"applied": false, "reason": "No active subscription"}'::jsonb;
  END IF;
  
  v_min_amount := COALESCE((v_benefits->>'min_order_amount')::int, 0);
  IF v_order.total_amount < v_min_amount THEN
    RETURN jsonb_build_object('applied', false, 'reason', 'Order below minimum', 'min_amount', v_min_amount);
  END IF;
  
  IF COALESCE((v_benefits->>'free_delivery')::boolean, false) = true THEN
    v_delivery_discount := COALESCE(v_order.delivery_fee, 0);
  END IF;
  
  IF (v_benefits->>'reduced_service_fee') IS NOT NULL THEN
    v_service_fee_discount := COALESCE(v_order.service_fee, 0) * (v_benefits->>'reduced_service_fee')::int / 100;
  END IF;
  
  RETURN jsonb_build_object(
    'applied', true,
    'delivery_discount', v_delivery_discount,
    'service_fee_discount', v_service_fee_discount,
    'total_discount', v_delivery_discount + v_service_fee_discount
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.calculate_waitlist_position(driver_uuid uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  position INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO position
  FROM public.activation_queue aq
  JOIN public.craver_applications ca ON aq.driver_id = ca.id
  WHERE aq.region_id = (
    SELECT region_id FROM public.craver_applications WHERE id = driver_uuid
  )
  AND aq.priority_score > (
    SELECT priority_score FROM public.craver_applications WHERE id = driver_uuid
  );
  
  RETURN COALESCE(position, 1);
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_region_capacity_status(region_id_param integer)
RETURNS TABLE(region_name text, current_drivers bigint, capacity integer, status text, waitlist_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    r.name,
    COUNT(aq.driver_id)::BIGINT,
    r.active_quota,
    r.status,
    (SELECT COUNT(*) FROM public.activation_queue WHERE region_id = region_id_param)::BIGINT
  FROM public.regions r
  LEFT JOIN public.activation_queue aq ON r.id = aq.region_id
  WHERE r.id = region_id_param
  GROUP BY r.id, r.name, r.active_quota, r.status;
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM user_profiles
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_driver_queue_position(driver_uuid uuid)
RETURNS TABLE(queue_position bigint, total_in_region bigint, region_name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    calculate_waitlist_position(driver_uuid)::BIGINT as queue_position,
    COUNT(*)::BIGINT as total_in_region,
    r.name as region_name
  FROM public.activation_queue aq
  JOIN public.regions r ON aq.region_id = r.id
  WHERE aq.region_id = (
    SELECT region_id FROM public.craver_applications WHERE id = driver_uuid
  )
  GROUP BY r.name;
END;
$function$;