-- Migration: Fix RLS Policies for user_roles Table
-- Date: 2025-11-10
-- Description: Allow authenticated users to insert their own roles during signup

-- Drop existing policies on user_roles
DROP POLICY IF EXISTS "Users can insert own role" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Officials can view all roles" ON public.user_roles;

-- Create policy for users to insert their own role
CREATE POLICY "Users can insert own role"
ON public.user_roles FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create policy for users to view their own roles
CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

-- Create policy for officials to view all roles
CREATE POLICY "Officials can view all roles"
ON public.user_roles FOR SELECT
USING (public.has_role(auth.uid(), 'official'));

-- Grant permissions to authenticated users
GRANT INSERT, SELECT ON public.user_roles TO authenticated;

-- Enable RLS on user_roles table
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
