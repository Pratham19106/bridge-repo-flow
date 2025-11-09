-- =====================================================
-- QUICK FIX - Run this to fix all issues at once
-- =====================================================

-- 1. Fix user roles policy (allow signup)
DROP POLICY IF EXISTS "Officials can insert user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert own role" ON public.user_roles;

CREATE POLICY "Users can insert own role" 
ON public.user_roles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Officials can insert user roles" 
ON public.user_roles FOR INSERT 
WITH CHECK (public.has_role(auth.uid(), 'official'));

-- 2. Add performance indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_id ON public.profiles(id);

-- 3. Optimize has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
    LIMIT 1
  )
$$;

SELECT '✅ All fixes applied! Sign up should work now and be faster!' as status;
