-- Drop the incorrect policy
DROP POLICY IF EXISTS "Users can purchase items" ON public.items;

-- Create the correct policy that allows purchasing
CREATE POLICY "Users can purchase items"
ON public.items
FOR UPDATE
TO authenticated
USING (status IN ('ready_to_sell', 'scrapped'))
WITH CHECK (
  status = 'sold' 
  AND buyer_id = auth.uid()
);