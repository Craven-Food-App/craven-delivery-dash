-- Create ms365_email_accounts table
CREATE TABLE IF NOT EXISTS ms365_email_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_address TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  ms365_user_id TEXT,
  ms365_user_principal_name TEXT,
  mailbox_type TEXT NOT NULL DEFAULT 'user',
  role_alias TEXT,
  provisioning_status TEXT NOT NULL DEFAULT 'pending',
  provisioned_at TIMESTAMP WITH TIME ZONE,
  access_level INTEGER DEFAULT 5,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on ms365_email_accounts
ALTER TABLE ms365_email_accounts ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read email accounts
CREATE POLICY "Allow authenticated users to read email accounts"
ON ms365_email_accounts FOR SELECT
TO authenticated
USING (true);

-- Allow service role full access
CREATE POLICY "Allow service role full access to email accounts"
ON ms365_email_accounts FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create email_logs table
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  email_type TEXT NOT NULL,
  subject TEXT NOT NULL,
  from_email TEXT NOT NULL,
  resend_email_id TEXT,
  status TEXT NOT NULL DEFAULT 'sent',
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on email_logs
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read email logs
CREATE POLICY "Allow authenticated users to read email logs"
ON email_logs FOR SELECT
TO authenticated
USING (true);

-- Allow service role to insert email logs
CREATE POLICY "Allow service role to insert email logs"
ON email_logs FOR INSERT
TO service_role
WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ms365_email_employee_id ON ms365_email_accounts(employee_id);
CREATE INDEX IF NOT EXISTS idx_ms365_email_address ON ms365_email_accounts(email_address);
CREATE INDEX IF NOT EXISTS idx_email_logs_employee_id ON email_logs(employee_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at DESC);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_ms365_email_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ms365_email_accounts_updated_at_trigger
BEFORE UPDATE ON ms365_email_accounts
FOR EACH ROW
EXECUTE FUNCTION update_ms365_email_accounts_updated_at();