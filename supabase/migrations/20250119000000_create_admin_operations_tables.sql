-- =====================================================
-- ADMIN OPERATIONS TABLES MIGRATION
-- Creates all tables needed for admin portal operations
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. REFUND REQUESTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS refund_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  reason TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected', 'processed')) DEFAULT 'pending',
  type TEXT CHECK (type IN ('full', 'partial')) DEFAULT 'full',
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID REFERENCES profiles(id),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for refund_requests
CREATE INDEX IF NOT EXISTS idx_refund_requests_order_id ON refund_requests(order_id);
CREATE INDEX IF NOT EXISTS idx_refund_requests_customer_id ON refund_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_refund_requests_status ON refund_requests(status);
CREATE INDEX IF NOT EXISTS idx_refund_requests_created_at ON refund_requests(created_at DESC);

-- =====================================================
-- 2. DISPUTES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS disputes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  dispute_type TEXT NOT NULL CHECK (dispute_type IN (
    'order_issue', 'delivery_issue', 'payment_issue', 
    'quality_issue', 'missing_items', 'wrong_order', 
    'late_delivery', 'other'
  )),
  reported_by TEXT CHECK (reported_by IN ('customer', 'driver', 'restaurant')) NOT NULL,
  reporter_id UUID NOT NULL,
  status TEXT CHECK (status IN ('open', 'investigating', 'resolved', 'closed')) DEFAULT 'open',
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  description TEXT NOT NULL,
  resolution TEXT,
  evidence JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES profiles(id)
);

-- Create indexes for disputes
CREATE INDEX IF NOT EXISTS idx_disputes_order_id ON disputes(order_id);
CREATE INDEX IF NOT EXISTS idx_disputes_reporter_id ON disputes(reporter_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);
CREATE INDEX IF NOT EXISTS idx_disputes_priority ON disputes(priority);
CREATE INDEX IF NOT EXISTS idx_disputes_created_at ON disputes(created_at DESC);

-- =====================================================
-- 3. DISPUTE MESSAGES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS dispute_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dispute_id UUID REFERENCES disputes(id) ON DELETE CASCADE NOT NULL,
  sender_type TEXT CHECK (sender_type IN ('admin', 'customer', 'driver', 'restaurant')) NOT NULL,
  sender_id UUID NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for dispute_messages
CREATE INDEX IF NOT EXISTS idx_dispute_messages_dispute_id ON dispute_messages(dispute_id);
CREATE INDEX IF NOT EXISTS idx_dispute_messages_created_at ON dispute_messages(created_at);

-- =====================================================
-- 4. SUPPORT TICKETS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT CHECK (category IN (
    'order_issue', 'account', 'payment', 'technical', 'general'
  )) NOT NULL,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  status TEXT CHECK (status IN (
    'open', 'in_progress', 'waiting_customer', 'resolved', 'closed'
  )) DEFAULT 'open',
  assigned_to UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for support_tickets
CREATE INDEX IF NOT EXISTS idx_support_tickets_customer_id ON support_tickets(customer_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned_to ON support_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON support_tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_ticket_number ON support_tickets(ticket_number);

-- Function to generate ticket numbers
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  counter INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO counter FROM support_tickets;
  new_number := 'TKT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(counter::TEXT, 5, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate ticket numbers
CREATE OR REPLACE FUNCTION set_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ticket_number IS NULL OR NEW.ticket_number = '' THEN
    NEW.ticket_number := generate_ticket_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_ticket_number ON support_tickets;
CREATE TRIGGER trigger_set_ticket_number
  BEFORE INSERT ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION set_ticket_number();

-- =====================================================
-- 5. TICKET MESSAGES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS ticket_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE NOT NULL,
  sender_type TEXT CHECK (sender_type IN ('customer', 'admin')) NOT NULL,
  sender_id UUID NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for ticket_messages
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id ON ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_created_at ON ticket_messages(created_at);

-- =====================================================
-- 6. ADMIN AUDIT LOGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES profiles(id) ON DELETE SET NULL NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for admin_audit_logs
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_id ON admin_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action ON admin_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_entity_type ON admin_audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON admin_audit_logs(created_at DESC);

-- =====================================================
-- 7. ADD COLUMNS TO PROFILES TABLE
-- =====================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'active';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspension_reason TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspension_until TIMESTAMP WITH TIME ZONE;

-- Create index for account_status
CREATE INDEX IF NOT EXISTS idx_profiles_account_status ON profiles(account_status);

-- =====================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE refund_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispute_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view all refund requests" ON refund_requests;
DROP POLICY IF EXISTS "Admins can manage refund requests" ON refund_requests;
DROP POLICY IF EXISTS "Admins can view all disputes" ON disputes;
DROP POLICY IF EXISTS "Admins can manage disputes" ON disputes;
DROP POLICY IF EXISTS "Admins can view dispute messages" ON dispute_messages;
DROP POLICY IF EXISTS "Admins can manage dispute messages" ON dispute_messages;
DROP POLICY IF EXISTS "Admins can view all support tickets" ON support_tickets;
DROP POLICY IF EXISTS "Admins can manage support tickets" ON support_tickets;
DROP POLICY IF EXISTS "Admins can view ticket messages" ON ticket_messages;
DROP POLICY IF EXISTS "Admins can manage ticket messages" ON ticket_messages;
DROP POLICY IF EXISTS "Admins can view audit logs" ON admin_audit_logs;
DROP POLICY IF EXISTS "Admins can create audit logs" ON admin_audit_logs;

-- Create policies for refund_requests
CREATE POLICY "Admins can view all refund requests"
  ON refund_requests FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage refund requests"
  ON refund_requests FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for disputes
CREATE POLICY "Admins can view all disputes"
  ON disputes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage disputes"
  ON disputes FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for dispute_messages
CREATE POLICY "Admins can view dispute messages"
  ON dispute_messages FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage dispute messages"
  ON dispute_messages FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for support_tickets
CREATE POLICY "Admins can view all support tickets"
  ON support_tickets FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage support tickets"
  ON support_tickets FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for ticket_messages
CREATE POLICY "Admins can view ticket messages"
  ON ticket_messages FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage ticket messages"
  ON ticket_messages FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for admin_audit_logs
CREATE POLICY "Admins can view audit logs"
  ON admin_audit_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can create audit logs"
  ON admin_audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- =====================================================
-- 9. UPDATE TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_refund_requests_updated_at ON refund_requests;
CREATE TRIGGER update_refund_requests_updated_at
  BEFORE UPDATE ON refund_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_disputes_updated_at ON disputes;
CREATE TRIGGER update_disputes_updated_at
  BEFORE UPDATE ON disputes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_support_tickets_updated_at ON support_tickets;
CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 10. SAMPLE DATA (OPTIONAL - FOR TESTING)
-- =====================================================

-- Uncomment below to insert sample data for testing

/*
-- Sample refund request
INSERT INTO refund_requests (order_id, customer_id, amount_cents, reason, type)
SELECT 
  o.id,
  o.customer_id,
  o.total_cents,
  'Item was damaged during delivery',
  'full'
FROM orders o
LIMIT 1
ON CONFLICT DO NOTHING;

-- Sample dispute
INSERT INTO disputes (dispute_type, reported_by, reporter_id, description, priority)
VALUES (
  'delivery_issue',
  'customer',
  (SELECT id FROM profiles LIMIT 1),
  'Order was delivered to wrong address',
  'high'
)
ON CONFLICT DO NOTHING;

-- Sample support ticket
INSERT INTO support_tickets (customer_id, subject, description, category, priority)
VALUES (
  (SELECT id FROM profiles LIMIT 1),
  'Cannot access my account',
  'I forgot my password and the reset email is not arriving',
  'account',
  'medium'
)
ON CONFLICT DO NOTHING;
*/

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

COMMENT ON TABLE refund_requests IS 'Stores customer refund requests for orders';
COMMENT ON TABLE disputes IS 'Tracks disputes between customers, drivers, and restaurants';
COMMENT ON TABLE dispute_messages IS 'Messages exchanged during dispute resolution';
COMMENT ON TABLE support_tickets IS 'Customer support ticket system';
COMMENT ON TABLE ticket_messages IS 'Messages exchanged in support tickets';
COMMENT ON TABLE admin_audit_logs IS 'Logs all administrative actions for compliance';

-- Print success message
DO $$
BEGIN
  RAISE NOTICE 'Admin operations tables created successfully!';
  RAISE NOTICE 'Tables created: refund_requests, disputes, dispute_messages, support_tickets, ticket_messages, admin_audit_logs';
  RAISE NOTICE 'RLS policies enabled for all tables';
  RAISE NOTICE 'Indexes created for optimal performance';
END $$;
