-- BitComm Phase 2 Monetization Database Schema
-- Run this in your Supabase SQL Editor to create the tables

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create custom types
CREATE TYPE verification_level AS ENUM ('basic', 'business', 'domain', 'enterprise');
CREATE TYPE report_type AS ENUM ('audit', 'activity', 'security', 'compliance');  
CREATE TYPE report_status AS ENUM ('generating', 'complete', 'failed');
CREATE TYPE subscription_status AS ENUM ('active', 'inactive', 'cancelled', 'past_due');
CREATE TYPE subscription_tier AS ENUM ('free', 'premium', 'business', 'enterprise');

-- 1. Premium Identities Table
CREATE TABLE premium_identities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT NOT NULL UNIQUE,
  public_key TEXT NOT NULL,
  private_key_encrypted TEXT NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  verification_level verification_level DEFAULT 'basic',
  verification_date TIMESTAMPTZ,
  domain TEXT,
  business_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Device Sync Table
CREATE TABLE device_sync (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  identity_id UUID REFERENCES premium_identities(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  device_name TEXT NOT NULL,
  encrypted_data TEXT NOT NULL,
  last_sync TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Compliance Reports Table  
CREATE TABLE compliance_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  report_type report_type NOT NULL,
  generated_by UUID REFERENCES auth.users(id),
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  date_range_start TIMESTAMPTZ NOT NULL,
  date_range_end TIMESTAMPTZ NOT NULL,
  data JSONB DEFAULT '{}',
  status report_status DEFAULT 'generating',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Subscriptions Table
CREATE TABLE subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tier subscription_tier DEFAULT 'free',
  status subscription_status DEFAULT 'active',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Usage Tracking Table
CREATE TABLE usage_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. User Profiles Table (Extended user info)
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  company_name TEXT,
  subscription_tier subscription_tier DEFAULT 'free',
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Audit Logs Table
CREATE TABLE audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Verification Requests Table
CREATE TABLE verification_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  identity_id UUID REFERENCES premium_identities(id) ON DELETE CASCADE,
  requested_level verification_level NOT NULL,
  business_name TEXT,
  domain TEXT,
  documentation_urls TEXT[],
  status TEXT DEFAULT 'pending',
  reviewer_id UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_premium_identities_user_id ON premium_identities(user_id);
CREATE INDEX idx_premium_identities_address ON premium_identities(address);
CREATE INDEX idx_premium_identities_verification ON premium_identities(is_verified, verification_level);

CREATE INDEX idx_device_sync_identity_id ON device_sync(identity_id);
CREATE INDEX idx_device_sync_device_id ON device_sync(device_id);

CREATE INDEX idx_compliance_reports_type ON compliance_reports(report_type);
CREATE INDEX idx_compliance_reports_date ON compliance_reports(generated_at);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe ON subscriptions(stripe_customer_id, stripe_subscription_id);

CREATE INDEX idx_usage_tracking_user_id ON usage_tracking(user_id);
CREATE INDEX idx_usage_tracking_event ON usage_tracking(event_type, timestamp);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action, created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE premium_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_sync ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Premium Identities
CREATE POLICY "Users can view their own identities" ON premium_identities
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own identities" ON premium_identities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own identities" ON premium_identities
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all identities" ON premium_identities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- RLS Policies for Device Sync
CREATE POLICY "Users can manage their device sync" ON device_sync
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM premium_identities 
      WHERE id = device_sync.identity_id AND user_id = auth.uid()
    )
  );

-- RLS Policies for Subscriptions
CREATE POLICY "Users can view their own subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions" ON subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for User Profiles
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for Usage Tracking
CREATE POLICY "Users can view their own usage" ON usage_tracking
  FOR SELECT USING (auth.uid() = user_id);

-- Admin policies for compliance reports and audit logs
CREATE POLICY "Admins can manage compliance reports" ON compliance_reports
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can view audit logs" ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at columns
CREATE TRIGGER update_premium_identities_updated_at 
  BEFORE UPDATE ON premium_identities 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at 
  BEFORE UPDATE ON subscriptions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at 
  BEFORE UPDATE ON user_profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create a function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name, avatar_url)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile for new users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
