-- Add constraint for worker_type enum
ALTER TABLE public.jobs 
ADD CONSTRAINT jobs_worker_type_check 
CHECK (worker_type IN ('full-time', 'part-time', 'contract', 'daily-wage', 'hourly', 'temporary'));

-- Function to handle new user signup and create profile
-- This should be run in your Supabase SQL editor

-- Create or replace function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    phone_number,
    role,
    full_name,
    age,
    location,
    skills,
    experience_years,
    bio
  ) VALUES (
    new.id,
    new.email,          -- can be null for phone signups
    new.phone,          -- Supabase provides phone here
    COALESCE(new.raw_user_meta_data->>'role', 'worker'),
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    COALESCE((new.raw_user_meta_data->>'age')::bigint, 20),
    COALESCE(new.raw_user_meta_data->>'location', ''),
    CASE 
      WHEN new.raw_user_meta_data->>'skills' IS NOT NULL 
      THEN string_to_array(new.raw_user_meta_data->>'skills', ',')
      ELSE NULL
    END,
    CASE 
      WHEN new.raw_user_meta_data->>'experience_years' IS NOT NULL 
      THEN (new.raw_user_meta_data->>'experience_years')::integer
      ELSE NULL
    END,
    new.raw_user_meta_data->>'bio'
  );
  RETURN new;
END;
$$;

-- Create trigger on auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Enable insert for service role" ON public.users;
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.users;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.users;

-- Create policy to allow users to read their own data
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Create policy to allow users to update their own data
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Create policy to allow authenticated users to insert their own profile
CREATE POLICY "Allow insert for authenticated users" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow authenticated users to read all profiles (for job board functionality)
CREATE POLICY "Authenticated users can view all profiles" ON public.users
  FOR SELECT USING (auth.role() = 'authenticated');

-- Enable RLS on jobs table
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Jobs table policies
-- Allow all authenticated users to view jobs
CREATE POLICY "Authenticated users can view all jobs" ON public.jobs
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow employers to insert their own jobs
CREATE POLICY "Employers can create jobs" ON public.jobs
  FOR INSERT WITH CHECK (auth.uid() = employer_id);

-- Allow employers to update their own jobs
CREATE POLICY "Employers can update own jobs" ON public.jobs
  FOR UPDATE USING (auth.uid() = employer_id);

-- Allow employers to delete their own jobs
CREATE POLICY "Employers can delete own jobs" ON public.jobs
  FOR DELETE USING (auth.uid() = employer_id);

-- Enable RLS on applications table
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Applications table policies
-- Allow workers to view their own applications
CREATE POLICY "Workers can view own applications" ON public.applications
  FOR SELECT USING (auth.uid() = worker_id);

-- Allow employers to view applications for their jobs
CREATE POLICY "Employers can view applications for own jobs" ON public.applications
  FOR SELECT USING (
    auth.uid() IN (
      SELECT employer_id FROM public.jobs WHERE id = job_id
    )
  );

-- Allow workers to create applications
CREATE POLICY "Workers can create applications" ON public.applications
  FOR INSERT WITH CHECK (auth.uid() = worker_id);

-- Allow employers to update application status for their jobs
CREATE POLICY "Employers can update applications for own jobs" ON public.applications
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT employer_id FROM public.jobs WHERE id = job_id
    )
  );