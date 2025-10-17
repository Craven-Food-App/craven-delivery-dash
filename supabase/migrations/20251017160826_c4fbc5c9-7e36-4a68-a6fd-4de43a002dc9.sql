-- Create restaurant_report_templates table
CREATE TABLE public.restaurant_report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'sales', 'menu', 'customers', 'operations'
  sql_query TEXT NOT NULL, -- Parameterized SQL template
  default_columns JSONB NOT NULL DEFAULT '[]', -- Array of column definitions
  available_filters JSONB NOT NULL DEFAULT '[]', -- Available filter options
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create restaurant_reports table
CREATE TABLE public.restaurant_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.restaurant_report_templates(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  filters JSONB NOT NULL DEFAULT '{}', -- User-configured filters (date range, etc.)
  columns JSONB NOT NULL DEFAULT '[]', -- Selected columns to include
  format TEXT NOT NULL DEFAULT 'csv', -- 'csv', 'excel', 'pdf'
  is_scheduled BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create restaurant_report_schedules table
CREATE TABLE public.restaurant_report_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.restaurant_reports(id) ON DELETE CASCADE,
  frequency TEXT NOT NULL, -- 'daily', 'weekly', 'monthly'
  day_of_week INTEGER, -- 0-6 for weekly reports (0 = Sunday)
  day_of_month INTEGER, -- 1-31 for monthly reports
  time_of_day TIME NOT NULL DEFAULT '09:00:00', -- Time to send report
  email_recipients TEXT[] NOT NULL DEFAULT '{}', -- Email addresses to send to
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create restaurant_report_executions table
CREATE TABLE public.restaurant_report_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.restaurant_reports(id) ON DELETE CASCADE,
  schedule_id UUID REFERENCES public.restaurant_report_schedules(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  file_path TEXT, -- Storage path to generated file
  file_size_bytes INTEGER,
  row_count INTEGER,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.restaurant_report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_report_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_report_executions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for restaurant_report_templates
CREATE POLICY "Everyone can view active templates"
  ON public.restaurant_report_templates
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage templates"
  ON public.restaurant_report_templates
  FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for restaurant_reports
CREATE POLICY "Restaurant owners can view their reports"
  ON public.restaurant_reports
  FOR SELECT
  USING (restaurant_id IN (
    SELECT id FROM restaurants WHERE owner_id = auth.uid()
  ));

CREATE POLICY "Restaurant owners can create their reports"
  ON public.restaurant_reports
  FOR INSERT
  WITH CHECK (
    restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid())
    AND created_by = auth.uid()
  );

CREATE POLICY "Restaurant owners can update their reports"
  ON public.restaurant_reports
  FOR UPDATE
  USING (restaurant_id IN (
    SELECT id FROM restaurants WHERE owner_id = auth.uid()
  ));

CREATE POLICY "Restaurant owners can delete their reports"
  ON public.restaurant_reports
  FOR DELETE
  USING (restaurant_id IN (
    SELECT id FROM restaurants WHERE owner_id = auth.uid()
  ));

CREATE POLICY "Admins can view all reports"
  ON public.restaurant_reports
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for restaurant_report_schedules
CREATE POLICY "Restaurant owners can manage schedules for their reports"
  ON public.restaurant_report_schedules
  FOR ALL
  USING (report_id IN (
    SELECT r.id FROM restaurant_reports r
    JOIN restaurants rest ON r.restaurant_id = rest.id
    WHERE rest.owner_id = auth.uid()
  ));

CREATE POLICY "Admins can view all schedules"
  ON public.restaurant_report_schedules
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for restaurant_report_executions
CREATE POLICY "Restaurant owners can view executions for their reports"
  ON public.restaurant_report_executions
  FOR SELECT
  USING (report_id IN (
    SELECT r.id FROM restaurant_reports r
    JOIN restaurants rest ON r.restaurant_id = rest.id
    WHERE rest.owner_id = auth.uid()
  ));

CREATE POLICY "Admins can view all executions"
  ON public.restaurant_report_executions
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Create storage bucket for reports
INSERT INTO storage.buckets (id, name, public)
VALUES ('restaurant-reports', 'restaurant-reports', false)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for storage bucket
CREATE POLICY "Restaurant owners can view their reports"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'restaurant-reports'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM restaurants WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all reports"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'restaurant-reports'
    AND has_role(auth.uid(), 'admin')
  );

-- Insert default report templates
INSERT INTO public.restaurant_report_templates (name, description, category, sql_query, default_columns, available_filters) VALUES
(
  'Daily Sales Summary',
  'Overview of daily sales, orders, and revenue',
  'sales',
  'SELECT DATE(created_at) as date, COUNT(*) as order_count, SUM(total_cents)/100.0 as total_sales, AVG(total_cents)/100.0 as avg_order_value FROM orders WHERE restaurant_id = $1 AND created_at >= $2 AND created_at <= $3 GROUP BY DATE(created_at) ORDER BY date DESC',
  '["date", "order_count", "total_sales", "avg_order_value"]',
  '["date_range"]'
),
(
  'Menu Performance',
  'Performance metrics for menu items',
  'menu',
  'SELECT mi.name, mi.category_id, COUNT(oi.id) as times_ordered, SUM(oi.quantity) as total_quantity, SUM(oi.price_cents * oi.quantity)/100.0 as total_revenue FROM menu_items mi LEFT JOIN order_items oi ON mi.id = oi.menu_item_id LEFT JOIN orders o ON oi.order_id = o.id WHERE mi.restaurant_id = $1 AND o.created_at >= $2 AND o.created_at <= $3 GROUP BY mi.id, mi.name, mi.category_id ORDER BY total_revenue DESC',
  '["name", "category_id", "times_ordered", "total_quantity", "total_revenue"]',
  '["date_range", "category"]'
),
(
  'Peak Hours Analysis',
  'Order volume by hour of day',
  'operations',
  'SELECT EXTRACT(HOUR FROM created_at) as hour, COUNT(*) as order_count, SUM(total_cents)/100.0 as revenue FROM orders WHERE restaurant_id = $1 AND created_at >= $2 AND created_at <= $3 GROUP BY EXTRACT(HOUR FROM created_at) ORDER BY hour',
  '["hour", "order_count", "revenue"]',
  '["date_range"]'
),
(
  'Customer Insights',
  'Customer ordering patterns and preferences',
  'customers',
  'SELECT customer_name, customer_phone, COUNT(*) as order_count, SUM(total_cents)/100.0 as total_spent, AVG(total_cents)/100.0 as avg_order_value, MAX(created_at) as last_order_date FROM orders WHERE restaurant_id = $1 AND created_at >= $2 AND created_at <= $3 AND customer_id IS NOT NULL GROUP BY customer_id, customer_name, customer_phone ORDER BY total_spent DESC',
  '["customer_name", "customer_phone", "order_count", "total_spent", "avg_order_value", "last_order_date"]',
  '["date_range", "min_orders"]'
),
(
  'Financial Breakdown',
  'Detailed financial breakdown including fees and commissions',
  'sales',
  'SELECT DATE(created_at) as date, COUNT(*) as orders, SUM(subtotal_cents)/100.0 as subtotal, SUM(tax_cents)/100.0 as tax, SUM(delivery_fee_cents)/100.0 as delivery_fees, SUM(tip_cents)/100.0 as tips, SUM(total_cents)/100.0 as total FROM orders WHERE restaurant_id = $1 AND created_at >= $2 AND created_at <= $3 GROUP BY DATE(created_at) ORDER BY date DESC',
  '["date", "orders", "subtotal", "tax", "delivery_fees", "tips", "total"]',
  '["date_range"]'
);

-- Create update trigger
CREATE TRIGGER update_restaurant_reports_updated_at
  BEFORE UPDATE ON public.restaurant_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_restaurant_report_schedules_updated_at
  BEFORE UPDATE ON public.restaurant_report_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_restaurant_report_templates_updated_at
  BEFORE UPDATE ON public.restaurant_report_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();