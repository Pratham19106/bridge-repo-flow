DROP POLICY IF EXISTS "Users can purchase items" ON public.items;

CREATE POLICY "Users can purchase available items"
ON public.items
FOR UPDATE
TO authenticated
USING (
  status = 'ready_to_sell' 
  AND buyer_id IS NULL
)
WITH CHECK (
  status = 'sold' 
  AND buyer_id = auth.uid()

-- The current policy requires buyer_id to already match, but it's NULL before purchase
-- Drop the incorrect policy and create a proper one

DROP POLICY IF EXISTS "Users can purchase items" ON public.items;

-- Allow users to purchase items that are ready to sell and don't have a buyer yet
CREATE POLICY "Users can purchase available items"
ON public.items
FOR UPDATE
TO authenticated
USING (
  status = 'ready_to_sell' 
  AND buyer_id IS NULL
)
WITH CHECK (
  status = 'sold' 
  AND buyer_id = auth.uid()
);