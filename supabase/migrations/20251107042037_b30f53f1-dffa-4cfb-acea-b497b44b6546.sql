-- Drop the conflicting policy if it exists and recreate it properly
DROP POLICY IF EXISTS "Officials can update any item for processing" ON public.items;
DROP POLICY IF EXISTS "Users can update their own items" ON public.items;

-- Policy for sellers to update their own items
CREATE POLICY "Sellers can update own items"
ON public.items FOR UPDATE
TO authenticated
USING (auth.uid() = seller_id)
WITH CHECK (auth.uid() = seller_id);

-- Policy for officials to process items (update final_payout, status, etc.)
CREATE POLICY "Officials can process items"
ON public.items FOR UPDATE
TO authenticated
USING (
  status = 'pending_valuation'
)
WITH CHECK (
  processed_by = auth.uid() AND
  status IN ('recycled', 'ready_to_sell', 'scrapped')
);

-- Policy for buyers to purchase items
CREATE POLICY "Buyers can purchase ready items"
ON public.items FOR UPDATE
TO authenticated
USING (
  status = 'ready_to_sell' AND 
  buyer_id IS NULL
)
WITH CHECK (
  status = 'sold' AND
  buyer_id = auth.uid()
);