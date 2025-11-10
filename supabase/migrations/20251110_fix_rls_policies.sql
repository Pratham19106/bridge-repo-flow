-- Migration: Fix RLS Policies for Wallet Updates
-- Date: 2025-11-10
-- Description: Fix RLS policies to allow users to insert and update their own profiles

-- Drop existing policies
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Officials can view all profiles" ON public.profiles;

-- Create policy for users to insert their own profile
CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Create policy for users to update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Create policy for users to select their own profile
CREATE POLICY "Users can select own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

-- Allow officials to view all profiles
CREATE POLICY "Officials can view all profiles"
ON public.profiles FOR SELECT
USING (public.has_role(auth.uid(), 'official'));

-- Grant permissions to authenticated users
GRANT INSERT, UPDATE, SELECT ON public.profiles TO authenticated;

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
