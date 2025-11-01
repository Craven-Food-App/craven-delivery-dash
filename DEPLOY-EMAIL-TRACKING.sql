-- Email Tracking System
-- Run this in Supabase SQL Editor

-- Email Logs table for tracking all sent emails
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  recipient_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Email details
  email_type TEXT NOT NULL CHECK (email_type IN (
    'offer_letter',
    'portal_access',
    'hiring_packet',
    'board_resolution',
    'equity_agreement',
    'background_check',
    'driver_welcome',
    'restaurant_welcome',
    'customer_welcome',
    'approval',
    'rejection',
    'waitlist',
    'ms365_welcome',
    'other'
  )),
  subject TEXT NOT NULL,
  from_email TEXT NOT NULL,
  
  -- Tracking
  resend_email_id TEXT UNIQUE,
  status TEXT CHECK (status IN ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed')) DEFAULT 'sent',
  
  -- Metadata
  employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  hiring_packet_id UUID REFERENCES public.hiring_packets(id) ON DELETE SET NULL,
  executive_signature_id UUID REFERENCES public.executive_signatures(id) ON DELETE SET NULL,
  
  -- Timestamps
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  delivered_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  
  -- Error tracking
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- RLS: CEO and admins can view all emails
DROP POLICY IF EXISTS "Admins can view all email logs" ON public.email_logs;
CREATE POLICY "Admins can view all email logs"
ON public.email_logs FOR SELECT
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid() AND role IN ('ceo', 'cfo', 'coo', 'cto')) OR
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON public.email_logs(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_type ON public.email_logs(email_type);
CREATE INDEX IF NOT EXISTS idx_email_logs_employee ON public.email_logs(employee_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON public.email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON public.email_logs(sent_at DESC);

-- Microsoft 365 Email Provisioning Tracking
CREATE TABLE IF NOT EXISTS public.ms365_email_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  
  -- Email details
  email_address TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  
  -- M365 metadata
  ms365_user_id TEXT,
  ms365_user_principal_name TEXT,
  mailbox_type TEXT CHECK (mailbox_type IN ('user', 'role_alias', 'shared')) DEFAULT 'user',
  role_alias TEXT, -- e.g., 'ceo@cravenusa.com'
  
  -- Provisioning status
  provisioning_status TEXT CHECK (provisioning_status IN ('pending', 'provisioning', 'active', 'failed', 'suspended', 'deleted')) DEFAULT 'pending',
  provisioned_at TIMESTAMP WITH TIME ZONE,
  suspended_at TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  provisioning_error TEXT,
  
  -- License info
  license_assigned BOOLEAN DEFAULT false,
  license_sku TEXT,
  
  -- Access
  access_level INTEGER DEFAULT 1 CHECK (access_level >= 1 AND access_level <= 10),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.ms365_email_accounts ENABLE ROW LEVEL SECURITY;

-- RLS: CEO and admins can view all M365 accounts
DROP POLICY IF EXISTS "Admins can view all M365 accounts" ON public.ms365_email_accounts;
CREATE POLICY "Admins can view all M365 accounts"
ON public.ms365_email_accounts FOR SELECT
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid() AND role IN ('ceo', 'cfo', 'coo', 'cto')) OR
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ms365_email ON public.ms365_email_accounts(email_address);
CREATE INDEX IF NOT EXISTS idx_ms365_employee ON public.ms365_email_accounts(employee_id);
CREATE INDEX IF NOT EXISTS idx_ms365_status ON public.ms365_email_accounts(provisioning_status);
CREATE INDEX IF NOT EXISTS idx_ms365_provisioned ON public.ms365_email_accounts(provisioned_at DESC);

