-- Create transactions table for tracking payouts
CREATE TABLE public.transactions (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Reference to Item (renamed from submission_id for consistency)
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  
  -- Payout Details
  payout_amount_inr DECIMAL(10, 2) NOT NULL,
  payout_amount_eth DECIMAL(18, 8), -- ETH amount (up to 8 decimals)
  currency_conversion_rate DECIMAL(12, 2), -- ETH/INR rate at time of transaction
  
  -- Payment Method
  payment_method TEXT NOT NULL CHECK (payment_method IN ('INR', 'SEPOLIA_ETH')),
  
  -- Proof of Payment
  blockchain_tx_hash TEXT, -- Ethereum transaction hash (0x... 64 chars)
  fiat_transfer_ref TEXT, -- Bank/UPI reference for INR payments
  
  -- Transaction Status
  status TEXT DEFAULT 'pending' CHECK (
    status IN ('pending', 'processing', 'complete', 'failed')
  ),
  failure_reason TEXT,
  
  -- Blockchain Details (for ETH payments)
  from_address TEXT, -- Platform's wallet address
  to_address TEXT, -- Seller's wallet address
  gas_used DECIMAL(18, 8),
  gas_price_gwei DECIMAL(18, 8),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  
  -- Metadata
  processed_by UUID REFERENCES auth.users(id),
  notes TEXT
);

-- Enable RLS on transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX idx_transactions_item ON public.transactions(item_id);
CREATE INDEX idx_transactions_status ON public.transactions(status);
CREATE INDEX idx_transactions_hash ON public.transactions(blockchain_tx_hash);
CREATE INDEX idx_transactions_created ON public.transactions(created_at DESC);

-- RLS Policies for transactions
CREATE POLICY "Users can view their own transactions"
ON public.transactions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.items
    WHERE items.id = item_id
    AND items.seller_id = auth.uid()
  )
);

CREATE POLICY "Officials can view all transactions"
ON public.transactions FOR SELECT
USING (public.has_role(auth.uid(), 'official'));

CREATE POLICY "Officials can insert transactions"
ON public.transactions FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'official'));

CREATE POLICY "Officials can update transactions"
ON public.transactions FOR UPDATE
USING (public.has_role(auth.uid(), 'official'));

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.transactions TO authenticated;
