
-- Create table for package management
CREATE TABLE public.packages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR NOT NULL UNIQUE,
  bandwidth VARCHAR NOT NULL,
  price INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default packages
INSERT INTO public.packages (name, bandwidth, price) VALUES
('Interfast Bronze', '10 Mbps', 100000),
('Interfast Silver', '20 Mbps', 150000),
('Interfast Gold', '30 Mbps', 200000),
('Interfast Platinum', '50 Mbps', 300000);

-- Enable RLS
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;

-- Create policy for packages (readable by all authenticated users)
CREATE POLICY "Authenticated users can view packages" 
  ON public.packages 
  FOR SELECT 
  TO authenticated
  USING (true);

-- Create policy for admin operations on packages
CREATE POLICY "Authenticated users can manage packages" 
  ON public.packages 
  FOR ALL
  TO authenticated
  USING (true);

-- Add trigger to update expired users to inactive status
CREATE OR REPLACE FUNCTION public.update_expired_users()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.users 
  SET user_status = 'Inactive'
  WHERE expired_date < CURRENT_DATE 
    AND user_status = 'Active';
END;
$$;

-- Create a trigger that runs daily to check expired users
-- Note: In production, you might want to use a cron job or scheduled function
CREATE OR REPLACE FUNCTION public.check_expired_users_trigger()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM public.update_expired_users();
  RETURN NEW;
END;
$$;
