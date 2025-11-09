-- Fix user_roles policy to allow users to insert their own role on signup
DROP POLICY IF EXISTS "Officials can insert user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert own role" ON public.user_roles;

-- Allow users to insert their own role (for signup)
CREATE POLICY "Users can insert own role" 
ON public.user_roles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Allow officials to insert any role
CREATE POLICY "Officials can insert user roles" 
ON public.user_roles FOR INSERT 
WITH CHECK (public.has_role(auth.uid(), 'official'));

SELECT 'User roles policy fixed!' as status;
