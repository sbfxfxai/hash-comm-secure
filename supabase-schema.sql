-- BitComm Supabase Database Schema
-- Run this in your Supabase SQL Editor to set up the database

-- Create premium_identities table
CREATE TABLE IF NOT EXISTS premium_identities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  public_key TEXT NOT NULL,
  encrypted_private_key TEXT NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  verification_method VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Create device_sync table
CREATE TABLE IF NOT EXISTS device_sync (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  identity_id UUID REFERENCES premium_identities(id) ON DELETE CASCADE,
  device_id VARCHAR(255) NOT NULL,
  device_name VARCHAR(255),
  encrypted_data TEXT,
  last_sync TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, device_id, identity_id)
);

-- Create compliance_reports table
CREATE TABLE IF NOT EXISTS compliance_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  report_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  file_url TEXT
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type VARCHAR(50) NOT NULL DEFAULT 'free',
  status VARCHAR(20) DEFAULT 'active',
  stripe_subscription_id VARCHAR(255),
  stripe_customer_id VARCHAR(255),
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE premium_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_sync ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Premium identities: Users can only access their own identities
CREATE POLICY "Users can view their own premium identities" ON premium_identities
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own premium identities" ON premium_identities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own premium identities" ON premium_identities
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own premium identities" ON premium_identities
  FOR DELETE USING (auth.uid() = user_id);

-- Device sync: Users can only access their own device sync data
CREATE POLICY "Users can view their own device sync data" ON device_sync
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own device sync data" ON device_sync
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own device sync data" ON device_sync
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own device sync data" ON device_sync
  FOR DELETE USING (auth.uid() = user_id);

-- Compliance reports: Users can only access their own reports
CREATE POLICY "Users can view their own compliance reports" ON compliance_reports
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own compliance reports" ON compliance_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Subscriptions: Users can only access their own subscription data
CREATE POLICY "Users can view their own subscription" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription" ON subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_premium_identities_user_id ON premium_identities(user_id);
CREATE INDEX IF NOT EXISTS idx_premium_identities_verified ON premium_identities(is_verified);
CREATE INDEX IF NOT EXISTS idx_device_sync_user_id ON device_sync(user_id);
CREATE INDEX IF NOT EXISTS idx_device_sync_identity_id ON device_sync(identity_id);
CREATE INDEX IF NOT EXISTS idx_compliance_reports_user_id ON compliance_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_premium_identities_updated_at BEFORE UPDATE ON premium_identities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
