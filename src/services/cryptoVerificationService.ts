/**
 * Crypto Verification Service
 * Handles wallet verification and validation for crypto transactions
 */

import { supabase } from "@/integrations/supabase/client";

const ETHEREUM_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;
const ETHEREUM_ADDRESS_LENGTH = 42;

/**
 * Validate Ethereum address format
 * @param address - Address to validate
 * @returns true if valid format
 */
export function isValidEthereumAddress(address: string): boolean {
  if (!address || address.length !== ETHEREUM_ADDRESS_LENGTH) {
    return false;
  }
  return ETHEREUM_ADDRESS_REGEX.test(address);
}

/**
 * Check if user's wallet is verified
 * @param userId - User ID
 * @returns true if wallet is verified
 */
export async function isCryptoVerified(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("is_crypto_verified")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error checking crypto verification:", error);
      return false;
    }

    return data?.is_crypto_verified ?? false;
  } catch (error) {
    console.error("Error in isCryptoVerified:", error);
    return false;
  }
}

/**
 * Get user's wallet address
 * @param userId - User ID
 * @returns Wallet address or null
 */
export async function getUserWallet(userId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("wallet_address")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching wallet:", error);
      return null;
    }

    return data?.wallet_address ?? null;
  } catch (error) {
    console.error("Error in getUserWallet:", error);
    return null;
  }
}

/**
 * Save wallet address and mark as verified
 * @param userId - User ID
 * @param walletAddress - Wallet address to save
 * @returns true if successful
 */
export async function saveAndVerifyWallet(
  userId: string,
  walletAddress: string
): Promise<boolean> {
  // Validate address format first
  if (!isValidEthereumAddress(walletAddress)) {
    console.error("Invalid Ethereum address format");
    return false;
  }

  try {
    const { error } = await supabase
      .from("profiles")
      .update({
        wallet_address: walletAddress,
        is_crypto_verified: true,
      })
      .eq("id", userId);

    if (error) {
      console.error("Error saving wallet:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in saveAndVerifyWallet:", error);
    return false;
  }
}

/**
 * Check if user can perform crypto transaction (has verified wallet)
 * @param userId - User ID
 * @returns true if user can perform crypto transactions
 */
export async function canPerformCryptoTransaction(userId: string): Promise<boolean> {
  return await isCryptoVerified(userId);
}

/**
 * Check if user can receive crypto payout (has verified wallet)
 * @param userId - User ID
 * @returns true if user can receive crypto payouts
 */
export async function canReceiveCryptoPayout(userId: string): Promise<boolean> {
  return await isCryptoVerified(userId);
}

/**
 * Mark wallet as verified (after format validation)
 * @param userId - User ID
 * @returns true if successful
 */
export async function markWalletAsVerified(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("profiles")
      .update({ is_crypto_verified: true })
      .eq("id", userId);

    if (error) {
      console.error("Error marking wallet as verified:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in markWalletAsVerified:", error);
    return false;
  }
}

/**
 * Get wallet verification status with details
 * @param userId - User ID
 * @returns Verification status object
 */
export async function getWalletVerificationStatus(userId: string): Promise<{
  isVerified: boolean;
  walletAddress: string | null;
  message: string;
}> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("wallet_address, is_crypto_verified")
      .eq("id", userId)
      .single();

    if (error) {
      return {
        isVerified: false,
        walletAddress: null,
        message: "Error fetching wallet status",
      };
    }

    if (!data?.wallet_address) {
      return {
        isVerified: false,
        walletAddress: null,
        message: "No wallet address set",
      };
    }

    if (!data.is_crypto_verified) {
      return {
        isVerified: false,
        walletAddress: data.wallet_address,
        message: "Wallet address not verified",
      };
    }

    return {
      isVerified: true,
      walletAddress: data.wallet_address,
      message: "Wallet verified and ready for transactions",
    };
  } catch (error) {
    console.error("Error in getWalletVerificationStatus:", error);
    return {
      isVerified: false,
      walletAddress: null,
      message: "Error checking wallet status",
    };
  }
}
