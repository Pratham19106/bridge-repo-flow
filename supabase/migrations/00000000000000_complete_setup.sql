-- =====================================================
-- COMPLETE DATABASE SETUP FOR E-WASTE RECYCLER
-- Run this in Supabase SQL Editor after creating new project
-- =====================================================

-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('user', 'official');

-- =====================================================
-- TABLES
-- =====================================================

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create items table with ALL fields (existing + new payout fields)
CREATE TABLE public.items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL,
  condition TEXT NOT NULL,
  seller_quoted_price DECIMAL(10,2) NOT NULL,
  final_payout DECIMAL(10,2) DEFAULT 0,
  repair_cost DECIMAL(10,2) DEFAULT 0,
  selling_price DECIMAL(10,2) DEFAULT 0,
  recycle_cost DECIMAL(10,2) DEFAULT 0,
  scrap_cost DECIMAL(10,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending_valuation',
  current_branch TEXT DEFAULT 'N/A',
  buyer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  processed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  -- NEW PAYOUT FIELDS
  payout_method TEXT DEFAULT 'INR' CHECK (payout_method IN ('INR', 'SEPOLIA_ETH')),
  seller_eth_address TEXT,
  transaction_id UUID,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  -- Constraints
  CONSTRAINT items_status_check CHECK (status IN (
    'pending_valuation',
    'valuated',
    'payout_pending',
    'payout_complete',
    'payout_failed',
    'ready_to_sell',
    'sold',
    'recycled',
    'scrapped'
  )),
  CONSTRAINT check_eth_address_format CHECK (
    seller_eth_address IS NULL 
    OR (
      seller_eth_address ~ '^0x[a-fA-F0-9]{40}$'
      AND length(seller_eth_address) = 42
    )
  )
);

-- Create item_media table for photos/videos
CREATE TABLE public.item_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES public.items(id) ON DELETE CASCADE NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create transactions table for tracking payouts (without foreign key first)
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL,
  payout_amount_inr DECIMAL(10, 2) NOT NULL,
  payout_amount_eth DECIMAL(18, 8),
  currency_conversion_rate DECIMAL(12, 2),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('INR', 'SEPOLIA_ETH')),
  blockchain_tx_hash TEXT,
  fiat_transfer_ref TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'complete', 'failed')),
  failure_reason TEXT,
  from_address TEXT,
  to_address TEXT,
  gas_used DECIMAL(18, 8),
  gas_price_gwei DECIMAL(18, 8),
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  processed_by UUID REFERENCES auth.users(id),
  notes TEXT
);

-- Now add foreign keys after both tables exist
ALTER TABLE public.transactions
ADD CONSTRAINT fk_transactions_item 
FOREIGN KEY (item_id) REFERENCES public.items(id) ON DELETE CASCADE;

ALTER TABLE public.items
ADD CONSTRAINT fk_items_transaction 
FOREIGN KEY (transaction_id) REFERENCES public.transactions(id);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_items_seller ON public.items(seller_id);
CREATE INDEX idx_items_status ON public.items(status);
CREATE INDEX idx_items_transaction ON public.items(transaction_id);
CREATE INDEX idx_transactions_item ON public.transactions(item_id);
CREATE INDEX idx_transactions_status ON public.transactions(status);
CREATE INDEX idx_transactions_hash ON public.transactions(blockchain_tx_hash);
CREATE INDEX idx_transactions_created ON public.transactions(created_at DESC);

-- =====================================================
-- STORAGE BUCKET
-- =====================================================

INSERT INTO storage.buckets (id, name, public) 
VALUES ('item-media', 'item-media', true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
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
  )
$$;

-- Function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'User')
  );
  RETURN new;
END;
$$;

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_items
  BEFORE UPDATE ON public.items
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- RLS POLICIES - PROFILES
-- =====================================================

CREATE POLICY "Users can view all profiles"
ON public.profiles FOR SELECT
USING (true);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- =====================================================
-- RLS POLICIES - USER ROLES
-- =====================================================

CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Officials can view all roles"
ON public.user_roles FOR SELECT
USING (public.has_role(auth.uid(), 'official'));

-- =====================================================
-- RLS POLICIES - ITEMS
-- =====================================================

CREATE POLICY "Users can view their own items as seller"
ON public.items FOR SELECT
USING (auth.uid() = seller_id);

CREATE POLICY "Users can view items ready to sell"
ON public.items FOR SELECT
USING (status = 'ready_to_sell');

CREATE POLICY "Officials can view all items"
ON public.items FOR SELECT
USING (public.has_role(auth.uid(), 'official'));

CREATE POLICY "Users can insert items"
ON public.items FOR INSERT
WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Officials can update items"
ON public.items FOR UPDATE
USING (public.has_role(auth.uid(), 'official'));

CREATE POLICY "Users can purchase items"
ON public.items FOR UPDATE
USING (
  auth.uid() = buyer_id 
  AND status = 'ready_to_sell'
);

-- =====================================================
-- RLS POLICIES - ITEM MEDIA
-- =====================================================

CREATE POLICY "Anyone can view item media"
ON public.item_media FOR SELECT
USING (true);

CREATE POLICY "Item sellers can insert media"
ON public.item_media FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.items
    WHERE items.id = item_id
    AND items.seller_id = auth.uid()
  )
);

CREATE POLICY "Item sellers can delete their media"
ON public.item_media FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.items
    WHERE items.id = item_id
    AND items.seller_id = auth.uid()
  )
);

-- =====================================================
-- RLS POLICIES - TRANSACTIONS
-- =====================================================

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

-- =====================================================
-- STORAGE POLICIES
-- =====================================================

CREATE POLICY "Anyone can view item media"
ON storage.objects FOR SELECT
USING (bucket_id = 'item-media');

CREATE POLICY "Authenticated users can upload item media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'item-media' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete their own item media"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'item-media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT SELECT, INSERT, UPDATE ON public.transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.item_media TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.user_roles TO authenticated;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE public.transactions IS 'Tracks all payout transactions (INR and crypto)';
COMMENT ON COLUMN public.items.payout_method IS 'Payment method: INR (traditional) or SEPOLIA_ETH (crypto)';
COMMENT ON COLUMN public.items.seller_eth_address IS 'Seller Ethereum wallet address for crypto payments';
COMMENT ON COLUMN public.items.transaction_id IS 'Reference to the payout transaction';

-- =====================================================
-- SETUP COMPLETE!
-- =====================================================
