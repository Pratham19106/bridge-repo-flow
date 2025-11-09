-- Add policy for users to view their purchased items
CREATE POLICY "Users can view purchased items"
ON items
FOR SELECT
USING (auth.uid() = buyer_id);

-- Add policy for users to view scrapped items
CREATE POLICY "Users can view scrap items"
ON items
FOR SELECT
USING (status = 'scrapped');