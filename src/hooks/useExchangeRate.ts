import { useEffect, useState } from "react";
import {
  fetchEthToInrRate,
  convertInrToEth,
  convertEthToInr,
  getExchangeRateData,
} from "@/services/exchangeRateService";

interface ExchangeRateState {
  ethToInr: number | null;
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
}

/**
 * Hook to manage ETH/INR exchange rate
 * Automatically fetches rate on mount and provides conversion utilities
 */
export const useExchangeRate = () => {
  const [state, setState] = useState<ExchangeRateState>({
    ethToInr: null,
    loading: true,
    error: null,
    lastUpdated: null,
  });

  useEffect(() => {
    const fetchRate = async () => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));
        const rateData = await getExchangeRateData();
        setState({
          ethToInr: rateData.ethToInr,
          loading: false,
          error: null,
          lastUpdated: rateData.lastUpdated,
        });
      } catch (error) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : "Failed to fetch rate",
        }));
      }
    };

    fetchRate();

    // Refresh rate every 5 minutes
    const interval = setInterval(fetchRate, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const convertToEth = async (amountInr: number): Promise<number> => {
    return convertInrToEth(amountInr);
  };

  const convertToInr = async (amountEth: number): Promise<number> => {
    return convertEthToInr(amountEth);
  };

  const refreshRate = async () => {
    try {
      setState((prev) => ({ ...prev, loading: true }));
      const rateData = await getExchangeRateData();
      setState({
        ethToInr: rateData.ethToInr,
        loading: false,
        error: null,
        lastUpdated: rateData.lastUpdated,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Failed to refresh rate",
      }));
    }
  };

  return {
    ethToInr: state.ethToInr,
    loading: state.loading,
    error: state.error,
    lastUpdated: state.lastUpdated,
    convertToEth,
    convertToInr,
    refreshRate,
  };
};
