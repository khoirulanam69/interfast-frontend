-- Add password_pppoe column to users table
ALTER TABLE public.users 
ADD COLUMN password_pppoe character varying;