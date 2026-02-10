
-- Update the package column to be more flexible by changing it from enum to text
-- First, add a new temporary column
ALTER TABLE public.users ADD COLUMN package_new TEXT;

-- Copy existing data to the new column
UPDATE public.users SET package_new = package::text;

-- Drop the old column and its constraints
ALTER TABLE public.users DROP COLUMN package;

-- Rename the new column to package
ALTER TABLE public.users RENAME COLUMN package_new TO package;

-- Set default value
ALTER TABLE public.users ALTER COLUMN package SET DEFAULT 'Interfast Bronze';

-- Make it not null
ALTER TABLE public.users ALTER COLUMN package SET NOT NULL;
