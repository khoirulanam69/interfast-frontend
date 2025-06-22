
-- Create enum types for user status and packages
CREATE TYPE user_status AS ENUM ('Active', 'Inactive', 'Terminate');
CREATE TYPE payment_status AS ENUM ('Paid', 'Unpaid');
CREATE TYPE package_type AS ENUM ('Interfast Bronze', 'Interfast Silver', 'Interfast Gold', 'Interfast Platinum');

-- Create users table for customer management
CREATE TABLE public.users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nik VARCHAR(16) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  rt_rw VARCHAR(20) NOT NULL,
  village VARCHAR(100) NOT NULL,
  city VARCHAR(100) NOT NULL,
  province VARCHAR(100) NOT NULL,
  country VARCHAR(100) NOT NULL DEFAULT 'Indonesia',
  phone VARCHAR(20) NOT NULL,
  package package_type NOT NULL DEFAULT 'Interfast Bronze',
  username_dial VARCHAR(50) UNIQUE NOT NULL,
  price INTEGER NOT NULL DEFAULT 100000,
  payment_status payment_status NOT NULL DEFAULT 'Unpaid',
  user_status user_status NOT NULL DEFAULT 'Active',
  installation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expired_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
  referred_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create function to auto-generate username_dial
CREATE OR REPLACE FUNCTION generate_username_dial()
RETURNS TRIGGER AS $$
BEGIN
  NEW.username_dial := 'user_' || EXTRACT(EPOCH FROM now())::bigint || '_' || substr(md5(random()::text), 1, 4);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate username_dial
CREATE TRIGGER trigger_generate_username_dial
  BEFORE INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION generate_username_dial();

-- Create admin users table for authentication
CREATE TABLE public.admin_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default admin user (password: admin123)
INSERT INTO public.admin_users (email, password_hash, name) 
VALUES ('admin@interfast.com', '$2b$10$rGfS7D/0tQ0J8YLz.nGV8e7Z8vL3XjYaK4Pz1QjNkL9Mm3x2y1z3A', 'Admin User');

-- Create analytics table for tracking revenue and user growth
CREATE TABLE public.analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  total_revenue BIGINT NOT NULL DEFAULT 0,
  total_users INTEGER NOT NULL DEFAULT 0,
  total_discounts BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(month, year)
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access (for now, allow all authenticated users)
-- In production, you'd want more specific role-based policies
CREATE POLICY "Allow all operations for authenticated users" ON public.users
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON public.admin_users
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON public.analytics
  FOR ALL USING (auth.role() = 'authenticated');

-- Function to calculate referral discounts
CREATE OR REPLACE FUNCTION calculate_referral_discount(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  active_referrals INTEGER;
BEGIN
  SELECT COUNT(*) INTO active_referrals
  FROM public.users
  WHERE referred_by = user_id AND user_status = 'Active';
  
  RETURN active_referrals * 10000; -- Rp10,000 per active referral
END;
$$ LANGUAGE plpgsql;

-- Function to update analytics
CREATE OR REPLACE FUNCTION update_monthly_analytics()
RETURNS VOID AS $$
DECLARE
  current_month INTEGER := EXTRACT(MONTH FROM CURRENT_DATE);
  current_year INTEGER := EXTRACT(YEAR FROM CURRENT_DATE);
  revenue BIGINT;
  user_count INTEGER;
  discount_total BIGINT;
BEGIN
  -- Calculate total revenue for current month
  SELECT COALESCE(SUM(price), 0) INTO revenue
  FROM public.users
  WHERE user_status = 'Active' AND payment_status = 'Paid';
  
  -- Calculate total active users
  SELECT COUNT(*) INTO user_count
  FROM public.users
  WHERE user_status = 'Active';
  
  -- Calculate total discounts
  SELECT COALESCE(SUM(calculate_referral_discount(id)), 0) INTO discount_total
  FROM public.users
  WHERE user_status = 'Active';
  
  -- Insert or update analytics
  INSERT INTO public.analytics (month, year, total_revenue, total_users, total_discounts)
  VALUES (current_month, current_year, revenue, user_count, discount_total)
  ON CONFLICT (month, year)
  DO UPDATE SET
    total_revenue = EXCLUDED.total_revenue,
    total_users = EXCLUDED.total_users,
    total_discounts = EXCLUDED.total_discounts,
    created_at = now();
END;
$$ LANGUAGE plpgsql;
