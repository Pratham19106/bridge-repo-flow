import { useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import {
  isCryptoVerified,
  getUserWallet,
  getWalletVerificationStatus,
} from "@/services/cryptoVerificationService";

interface WalletStatus {
  isVerified: boolean;
  walletAddress: string | null;
  message: string;
  loading: boolean;
}

/**
 * Hook to check crypto verification status
 */
export const useCryptoVerification = (): WalletStatus => {
  const { user } = useAuth();
  const [status, setStatus] = useState<WalletStatus>({
    isVerified: false,
    walletAddress: null,
    message: "Loading...",
    loading: true,
  });

  useEffect(() => {
    if (!user) {
      setStatus({
        isVerified: false,
        walletAddress: null,
        message: "Not authenticated",
        loading: false,
      });
      return;
    }

    const checkVerification = async () => {
      try {
        const verificationStatus = await getWalletVerificationStatus(user.id);
        setStatus({
          ...verificationStatus,
          loading: false,
        });
      } catch (error) {
        console.error("Error checking crypto verification:", error);
        setStatus({
          isVerified: false,
          walletAddress: null,
          message: "Error checking wallet status",
          loading: false,
        });
      }
    };

    checkVerification();
  }, [user]);

  return status;
};

/**
 * Hook to get user's wallet address
 */
export const useUserWallet = (): { wallet: string | null; loading: boolean } => {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setWallet(null);
      setLoading(false);
      return;
    }

    const fetchWallet = async () => {
      try {
        const userWallet = await getUserWallet(user.id);
        setWallet(userWallet);
      } catch (error) {
        console.error("Error fetching wallet:", error);
        setWallet(null);
      } finally {
        setLoading(false);
      }
    };

    fetchWallet();
  }, [user]);

  return { wallet, loading };
};

/**
 * Hook to check if user can perform crypto transactions
 */
export const useCanPerformCryptoTransaction = (): boolean => {
  const { isVerified } = useCryptoVerification();
  return isVerified;
};
