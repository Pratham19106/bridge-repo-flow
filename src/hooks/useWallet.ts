import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  getUserWalletProfile,
  updateUserWallet,
  verifyUserWallet,
  removeUserWallet,
  hasVerifiedWallet,
  getUserWalletAddress,
  formatWalletAddress,
  validateWalletForTransaction,
  isValidEthereumAddress,
} from "@/services/walletService";

interface WalletState {
  walletAddress: string | null;
  isVerified: boolean;
  loading: boolean;
  error: string | null;
}

/**
 * Hook to manage user's wallet profile
 */
export const useWallet = () => {
  const { user } = useAuth();
  const [state, setState] = useState<WalletState>({
    walletAddress: null,
    isVerified: false,
    loading: true,
    error: null,
  });

  // Fetch wallet profile on mount
  useEffect(() => {
    const fetchWallet = async () => {
      if (!user) {
        setState({
          walletAddress: null,
          isVerified: false,
          loading: false,
          error: null,
        });
        return;
      }

      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));
        const profile = await getUserWalletProfile(user.id);

        setState({
          walletAddress: profile?.wallet_address || null,
          isVerified: profile?.is_crypto_verified || false,
          loading: false,
          error: null,
        });
      } catch (error: any) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: error.message || "Failed to fetch wallet",
        }));
      }
    };

    fetchWallet();
  }, [user]);

  const updateWallet = useCallback(
    async (walletAddress: string) => {
      if (!user) {
        setState((prev) => ({
          ...prev,
          error: "User not authenticated",
        }));
        return false;
      }

      // Validate format first
      if (!isValidEthereumAddress(walletAddress)) {
        setState((prev) => ({
          ...prev,
          error: "Invalid Ethereum address format",
        }));
        return false;
      }

      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const result = await updateUserWallet(user.id, walletAddress);

        if (result.success && result.data) {
          setState({
            walletAddress: result.data.wallet_address,
            isVerified: result.data.is_crypto_verified,
            loading: false,
            error: null,
          });
          return true;
        } else {
          setState((prev) => ({
            ...prev,
            loading: false,
            error: result.error || "Failed to update wallet",
          }));
          return false;
        }
      } catch (error: any) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: error.message || "Error updating wallet",
        }));
        return false;
      }
    },
    [user]
  );

  const verifyWallet = useCallback(async () => {
    if (!user) {
      setState((prev) => ({
        ...prev,
        error: "User not authenticated",
      }));
      return false;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const result = await verifyUserWallet(user.id);

      if (result.verified) {
        setState((prev) => ({
          ...prev,
          isVerified: true,
          loading: false,
          error: null,
        }));
        return true;
      } else {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: result.message,
        }));
        return false;
      }
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error.message || "Error verifying wallet",
      }));
      return false;
    }
  }, [user]);

  const removeWallet = useCallback(async () => {
    if (!user) {
      setState((prev) => ({
        ...prev,
        error: "User not authenticated",
      }));
      return false;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const result = await removeUserWallet(user.id);

      if (result.success) {
        setState({
          walletAddress: null,
          isVerified: false,
          loading: false,
          error: null,
        });
        return true;
      } else {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: result.error || "Failed to remove wallet",
        }));
        return false;
      }
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error.message || "Error removing wallet",
      }));
      return false;
    }
  }, [user]);

  const checkVerified = useCallback(async () => {
    if (!user) return false;

    try {
      return await hasVerifiedWallet(user.id);
    } catch (error) {
      console.error("Error checking verified status:", error);
      return false;
    }
  }, [user]);

  const getAddress = useCallback(async () => {
    if (!user) return null;

    try {
      return await getUserWalletAddress(user.id);
    } catch (error) {
      console.error("Error getting wallet address:", error);
      return null;
    }
  }, [user]);

  const formatAddress = useCallback((address: string) => {
    return formatWalletAddress(address);
  }, []);

  const validateForTransaction = useCallback(async () => {
    if (!user) {
      return {
        valid: false,
        message: "User not authenticated",
      };
    }

    try {
      return await validateWalletForTransaction(user.id);
    } catch (error: any) {
      return {
        valid: false,
        message: error.message || "Validation failed",
      };
    }
  }, [user]);

  return {
    // State
    walletAddress: state.walletAddress,
    isVerified: state.isVerified,
    loading: state.loading,
    error: state.error,

    // Methods
    updateWallet,
    verifyWallet,
    removeWallet,
    checkVerified,
    getAddress,
    formatAddress,
    validateForTransaction,
  };
};
