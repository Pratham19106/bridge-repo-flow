-- Migration: Add Crypto Wallet Fields to Profiles
-- Date: 2025-11-10
-- Description: Add wallet_address and is_crypto_verified fields for MetaMask integration

-- Add wallet_address column to profiles table
ALTER TABLE public.profiles
ADD COLUMN wallet_address TEXT,
ADD COLUMN is_crypto_verified BOOLEAN DEFAULT FALSE;

-- Add constraint to validate Ethereum address format
-- Valid Ethereum address: 42 characters, starts with 0x, followed by 40 hex characters
ALTER TABLE public.profiles
ADD CONSTRAINT check_wallet_address_format CHECK (
  wallet_address IS NULL OR (
    wallet_address ~ '^0x[a-fA-F0-9]{40}$' AND length(wallet_address) = 42
  )
);

-- Add unique constraint to ensure each wallet is only used once
ALTER TABLE public.profiles
ADD CONSTRAINT unique_wallet_address UNIQUE (wallet_address);

-- Create index for faster wallet lookups
CREATE INDEX idx_profiles_wallet_address ON public.profiles(wallet_address);

-- Create index for crypto verification status
CREATE INDEX idx_profiles_crypto_verified ON public.profiles(is_crypto_verified);

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.wallet_address IS 'User''s Sepolia testnet MetaMask wallet address (42 chars, format: 0x...)';
COMMENT ON COLUMN public.profiles.is_crypto_verified IS 'Flag indicating if wallet address has been verified (format validation passed)';

-- Update RLS policies to allow users to update their own wallet
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow officials to view wallet addresses for transaction purposes
DROP POLICY IF EXISTS "Officials can view all profiles" ON public.profiles;

CREATE POLICY "Officials can view all profiles"
ON public.profiles FOR SELECT
USING (public.has_role(auth.uid(), 'official'));

-- Grant permissions
GRANT UPDATE ON public.profiles TO authenticated;
