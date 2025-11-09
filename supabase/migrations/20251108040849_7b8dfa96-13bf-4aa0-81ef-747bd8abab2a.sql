-- Add user type to profiles
ALTER TABLE public.profiles 
ADD COLUMN user_type text DEFAULT 'individual' CHECK (user_type IN ('individual', 'company'));

-- Add new fields to items table for better tracking
ALTER TABLE public.items
ADD COLUMN item_type text DEFAULT 'ewaste' CHECK (item_type IN ('ewaste', 'product', 'scrap')),
ADD COLUMN recycle_cost numeric DEFAULT 0,
ADD COLUMN scrap_cost numeric DEFAULT 0,
ADD COLUMN company_id uuid REFERENCES public.profiles(id);

-- Update items table to allow companies to add products
-- Companies can insert products directly
CREATE POLICY "Companies can add products"
ON public.items FOR INSERT
TO authenticated
WITH CHECK (
  item_type = 'product' AND
  company_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND user_type = 'company'
  )
);

-- Companies can update their own products
CREATE POLICY "Companies can update own products"
ON public.items FOR UPDATE
TO authenticated
USING (company_id = auth.uid())
WITH CHECK (company_id = auth.uid());