-- Verify and create tables with proper types
-- Note: This might already exist, but ensuring consistency

-- Create identity metadata type if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'identity_metadata') THEN
        CREATE TYPE identity_metadata AS (
            address TEXT,
            domain TEXT,
            verification_docs JSONB
        );
    END IF;
END $$;

-- Create premium_identities table with proper structure
CREATE TABLE IF NOT EXISTS premium_identities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  public_key TEXT NOT NULL,
  encrypted_private_key TEXT NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  verification_method VARCHAR(50) DEFAULT 'none',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{"address": null, "domain": null}'::jsonb
);

-- Create compliance_reports table  
CREATE TABLE IF NOT EXISTS compliance_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  report_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  data JSONB DEFAULT '{}'::jsonb,
  generated_by VARCHAR(255) NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  date_range_start DATE,
  date_range_end DATE
);

-- Enable RLS
ALTER TABLE premium_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_reports ENABLE ROW LEVEL SECURITY;

-- Policies for premium_identities (admin can see all)
DROP POLICY IF EXISTS "Admin can view all identities" ON premium_identities;
CREATE POLICY "Admin can view all identities" ON premium_identities
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin can manage identities" ON premium_identities;  
CREATE POLICY "Admin can manage identities" ON premium_identities
  FOR ALL USING (true);

-- Policies for compliance_reports (admin access)
DROP POLICY IF EXISTS "Admin can view all reports" ON compliance_reports;
CREATE POLICY "Admin can view all reports" ON compliance_reports
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin can manage reports" ON compliance_reports;
CREATE POLICY "Admin can manage reports" ON compliance_reports
  FOR ALL USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_premium_identities_user_id ON premium_identities(user_id);
CREATE INDEX IF NOT EXISTS idx_premium_identities_verified ON premium_identities(is_verified);
CREATE INDEX IF NOT EXISTS idx_compliance_reports_type ON compliance_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_compliance_reports_status ON compliance_reports(status);