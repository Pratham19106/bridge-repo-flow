import { useEffect, useState, useCallback } from "react";
import {
  isMetaMaskInstalled,
  connectMetaMask,
  getCurrentAccount,
  getWalletBalance,
  sendEthTransaction,
  waitForTransaction,
  getTransactionReceipt,
  onAccountChanged,
  onChainChanged,
  removeMetaMaskListeners,
  switchToSepolia,
} from "@/services/metamaskService";

interface UseMetaMaskState {
  isInstalled: boolean;
  isConnected: boolean;
  account: string | null;
  balance: number | null;
  loading: boolean;
  error: string | null;
  chainId: string | null;
}

/**
 * Hook to manage MetaMask wallet connection and transactions
 */
export const useMetaMask = () => {
  const [state, setState] = useState<UseMetaMaskState>({
    isInstalled: false,
    isConnected: false,
    account: null,
    balance: null,
    loading: false,
    error: null,
    chainId: null,
  });

  // Check if MetaMask is installed
  useEffect(() => {
    const installed = isMetaMaskInstalled();
    setState((prev) => ({ ...prev, isInstalled: installed }));
  }, []);

  // Check current connection status
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const account = await getCurrentAccount();
        if (account) {
          setState((prev) => ({
            ...prev,
            isConnected: true,
            account,
          }));

          // Fetch balance
          const balance = await getWalletBalance(account);
          setState((prev) => ({ ...prev, balance }));
        }
      } catch (error) {
        console.error("Error checking connection:", error);
      }
    };

    if (state.isInstalled) {
      checkConnection();
    }
  }, [state.isInstalled]);

  // Listen for account changes
  useEffect(() => {
    if (!state.isInstalled) return;

    const handleAccountChange = async (account: string | null) => {
      setState((prev) => ({ ...prev, account, isConnected: !!account }));

      if (account) {
        const balance = await getWalletBalance(account);
        setState((prev) => ({ ...prev, balance }));
      }
    };

    const handleChainChange = (chainId: string) => {
      setState((prev) => ({ ...prev, chainId }));
    };

    onAccountChanged(handleAccountChange);
    onChainChanged(handleChainChange);

    return () => {
      removeMetaMaskListeners();
    };
  }, [state.isInstalled]);

  const connect = useCallback(async () => {
    if (!state.isInstalled) {
      setState((prev) => ({
        ...prev,
        error: "MetaMask is not installed. Please install MetaMask extension.",
      }));
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const account = await connectMetaMask();
      const balance = await getWalletBalance(account);

      setState((prev) => ({
        ...prev,
        isConnected: true,
        account,
        balance,
        loading: false,
      }));
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error.message || "Failed to connect MetaMask",
      }));
    }
  }, [state.isInstalled]);

  const switchNetwork = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      await switchToSepolia();
      setState((prev) => ({ ...prev, loading: false }));
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error.message || "Failed to switch network",
      }));
    }
  }, []);

  const sendTransaction = useCallback(
    async (toAddress: string, amountEth: number, description?: string) => {
      if (!state.isConnected) {
        setState((prev) => ({
          ...prev,
          error: "MetaMask not connected. Please connect first.",
        }));
        return null;
      }

      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const txHash = await sendEthTransaction({
          toAddress,
          amountEth,
          description,
        });

        setState((prev) => ({ ...prev, loading: false }));
        return txHash;
      } catch (error: any) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: error.message || "Transaction failed",
        }));
        return null;
      }
    },
    [state.isConnected]
  );

  const waitForTx = useCallback(async (txHash: string, confirmations: number = 1) => {
    try {
      const receipt = await waitForTransaction(txHash, confirmations);
      return receipt;
    } catch (error: any) {
      console.error("Error waiting for transaction:", error);
      return null;
    }
  }, []);

  const getTxReceipt = useCallback(async (txHash: string) => {
    try {
      const receipt = await getTransactionReceipt(txHash);
      return receipt;
    } catch (error: any) {
      console.error("Error getting transaction receipt:", error);
      return null;
    }
  }, []);

  const refreshBalance = useCallback(async () => {
    if (!state.account) return;

    try {
      const balance = await getWalletBalance(state.account);
      setState((prev) => ({ ...prev, balance }));
    } catch (error) {
      console.error("Error refreshing balance:", error);
    }
  }, [state.account]);

  return {
    // State
    isInstalled: state.isInstalled,
    isConnected: state.isConnected,
    account: state.account,
    balance: state.balance,
    loading: state.loading,
    error: state.error,
    chainId: state.chainId,

    // Methods
    connect,
    switchNetwork,
    sendTransaction,
    waitForTx,
    getTxReceipt,
    refreshBalance,
  };
};
