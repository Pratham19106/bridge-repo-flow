-- Add payout-related fields to items table
ALTER TABLE public.items
ADD COLUMN IF NOT EXISTS payout_method TEXT DEFAULT 'INR' CHECK (payout_method IN ('INR', 'SEPOLIA_ETH')),
ADD COLUMN IF NOT EXISTS seller_eth_address TEXT,
ADD COLUMN IF NOT EXISTS transaction_id UUID REFERENCES public.transactions(id),
ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS recycle_cost DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS scrap_cost DECIMAL(10, 2) DEFAULT 0;

-- Create index for transaction lookup
CREATE INDEX IF NOT EXISTS idx_items_transaction ON public.items(transaction_id);

-- Add constraint to validate Ethereum address format (basic check)
ALTER TABLE public.items
ADD CONSTRAINT check_eth_address_format
CHECK (
  seller_eth_address IS NULL 
  OR (
    seller_eth_address ~ '^0x[a-fA-F0-9]{40}$'
    AND length(seller_eth_address) = 42
  )
);

-- Update status check constraint to include new statuses
ALTER TABLE public.items DROP CONSTRAINT IF EXISTS items_status_check;
ALTER TABLE public.items
ADD CONSTRAINT items_status_check
CHECK (status IN (
  'pending_valuation',
  'valuated',
  'payout_pending',
  'payout_complete',
  'payout_failed',
  'ready_to_sell',
  'sold',
  'recycled',
  'scrapped'
));

-- Comment on new columns
COMMENT ON COLUMN public.items.payout_method IS 'Payment method: INR (traditional) or SEPOLIA_ETH (crypto)';
COMMENT ON COLUMN public.items.seller_eth_address IS 'Seller Ethereum wallet address for crypto payments';
COMMENT ON COLUMN public.items.transaction_id IS 'Reference to the payout transaction';
COMMENT ON COLUMN public.items.processed_at IS 'Timestamp when official processed the item';
COMMENT ON COLUMN public.items.recycle_cost IS 'Cost for recycling process';
COMMENT ON COLUMN public.items.scrap_cost IS 'Cost for scrap processing';
