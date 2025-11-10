/**
 * Wallet Service
 * Manages user wallet addresses and verification in profiles
 */

import { supabase } from "@/integrations/supabase/client";

interface WalletProfile {
  id: string;
  wallet_address: string | null;
  is_crypto_verified: boolean;
}

/**
 * Validate Ethereum address format
 * @param address Address to validate
 * @returns true if valid Ethereum address format
 */
export function isValidEthereumAddress(address: string): boolean {
  // Check format: 42 characters, starts with 0x, followed by 40 hex characters
  const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
  return ethAddressRegex.test(address) && address.length === 42;
}

/**
 * Get user's wallet profile
 * @param userId User ID
 * @returns Wallet profile data
 */
export async function getUserWalletProfile(userId: string): Promise<WalletProfile | null> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, wallet_address, is_crypto_verified")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching wallet profile:", error);
      return null;
    }

    return data as WalletProfile;
  } catch (error) {
    console.error("Error in getUserWalletProfile:", error);
    return null;
  }
}

/**
 * Update user's wallet address
 * @param userId User ID
 * @param walletAddress Ethereum wallet address
 * @returns Updated profile or error
 */
export async function updateUserWallet(
  userId: string,
  walletAddress: string
): Promise<{ success: boolean; data?: WalletProfile; error?: string }> {
  try {
    // Validate address format
    if (!isValidEthereumAddress(walletAddress)) {
      return {
        success: false,
        error: "Invalid Ethereum address format. Must be 42 characters starting with 0x",
      };
    }

    // Check if wallet is already in use
    const { data: existingWallet } = await supabase
      .from("profiles")
      .select("id")
      .eq("wallet_address", walletAddress)
      .neq("id", userId)
      .single();

    if (existingWallet) {
      return {
        success: false,
        error: "This wallet address is already registered with another account",
      };
    }

    // Update wallet address and set verified flag
    const { data, error } = await supabase
      .from("profiles")
      .update({
        wallet_address: walletAddress,
        is_crypto_verified: true, // Set to true after format validation
      })
      .eq("id", userId)
      .select("id, wallet_address, is_crypto_verified")
      .single();

    if (error) {
      console.error("Error updating wallet:", error);
      return {
        success: false,
        error: error.message || "Failed to update wallet",
      };
    }

    return {
      success: true,
      data: data as WalletProfile,
    };
  } catch (error: any) {
    console.error("Error in updateUserWallet:", error);
    return {
      success: false,
      error: error.message || "Unknown error occurred",
    };
  }
}

/**
 * Verify user's wallet address
 * @param userId User ID
 * @returns Verification result
 */
export async function verifyUserWallet(
  userId: string
): Promise<{ verified: boolean; message: string }> {
  try {
    const profile = await getUserWalletProfile(userId);

    if (!profile) {
      return {
        verified: false,
        message: "User profile not found",
      };
    }

    if (!profile.wallet_address) {
      return {
        verified: false,
        message: "No wallet address set",
      };
    }

    if (!isValidEthereumAddress(profile.wallet_address)) {
      return {
        verified: false,
        message: "Wallet address format is invalid",
      };
    }

    if (!profile.is_crypto_verified) {
      // Update verification status
      await supabase
        .from("profiles")
        .update({ is_crypto_verified: true })
        .eq("id", userId);

      return {
        verified: true,
        message: "Wallet verified successfully",
      };
    }

    return {
      verified: true,
      message: "Wallet already verified",
    };
  } catch (error: any) {
    console.error("Error in verifyUserWallet:", error);
    return {
      verified: false,
      message: error.message || "Verification failed",
    };
  }
}

/**
 * Remove user's wallet address
 * @param userId User ID
 * @returns Success status
 */
export async function removeUserWallet(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("profiles")
      .update({
        wallet_address: null,
        is_crypto_verified: false,
      })
      .eq("id", userId);

    if (error) {
      console.error("Error removing wallet:", error);
      return {
        success: false,
        error: error.message || "Failed to remove wallet",
      };
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error in removeUserWallet:", error);
    return {
      success: false,
      error: error.message || "Unknown error occurred",
    };
  }
}

/**
 * Check if user has verified wallet
 * @param userId User ID
 * @returns true if user has verified wallet
 */
export async function hasVerifiedWallet(userId: string): Promise<boolean> {
  try {
    const profile = await getUserWalletProfile(userId);
    return profile?.is_crypto_verified === true && !!profile?.wallet_address;
  } catch (error) {
    console.error("Error in hasVerifiedWallet:", error);
    return false;
  }
}

/**
 * Get user's wallet address
 * @param userId User ID
 * @returns Wallet address or null
 */
export async function getUserWalletAddress(userId: string): Promise<string | null> {
  try {
    const profile = await getUserWalletProfile(userId);
    return profile?.wallet_address || null;
  } catch (error) {
    console.error("Error in getUserWalletAddress:", error);
    return null;
  }
}

/**
 * Format wallet address for display (show first 6 and last 4 chars)
 * @param address Full wallet address
 * @returns Shortened address like "0x1234...5678"
 */
export function formatWalletAddress(address: string): string {
  if (!address || address.length < 10) {
    return address;
  }
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Validate wallet for transaction eligibility
 * @param userId User ID
 * @returns Validation result with message
 */
export async function validateWalletForTransaction(
  userId: string
): Promise<{ valid: boolean; message: string }> {
  try {
    const profile = await getUserWalletProfile(userId);

    if (!profile) {
      return {
        valid: false,
        message: "User profile not found",
      };
    }

    if (!profile.wallet_address) {
      return {
        valid: false,
        message: "Please add your MetaMask wallet address to your profile",
      };
    }

    if (!profile.is_crypto_verified) {
      return {
        valid: false,
        message: "Your wallet address needs to be verified. Please update your profile.",
      };
    }

    if (!isValidEthereumAddress(profile.wallet_address)) {
      return {
        valid: false,
        message: "Your wallet address format is invalid. Please update your profile.",
      };
    }

    return {
      valid: true,
      message: "Wallet is valid for transactions",
    };
  } catch (error: any) {
    console.error("Error in validateWalletForTransaction:", error);
    return {
      valid: false,
      message: error.message || "Wallet validation failed",
    };
  }
}
