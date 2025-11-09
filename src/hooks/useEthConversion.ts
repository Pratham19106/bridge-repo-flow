import { useState, useEffect } from "react";

// Custom hook to fetch and manage ETH conversion rate
export const useEthConversion = () => {
  const [ethToInr, setEthToInr] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEthRate = async () => {
      try {
        // Using CoinGecko API (free, no API key required)
        const response = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=inr"
        );
        
        if (!response.ok) {
          throw new Error("Failed to fetch ETH rate");
        }
        
        const data = await response.json();
        setEthToInr(data.ethereum.inr);
        setError(null);
      } catch (err) {
        console.error("Error fetching ETH rate:", err);
        setError("Failed to fetch ETH rate");
        // Fallback rate (approximate)
        setEthToInr(200000);
      } finally {
        setLoading(false);
      }
    };

    fetchEthRate();
    
    // Refresh rate every 60 seconds
    const interval = setInterval(fetchEthRate, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const convertInrToEth = (inr: number): number => {
    if (!ethToInr || inr === 0) return 0;
    return inr / ethToInr;
  };

  const convertEthToInr = (eth: number): number => {
    if (!ethToInr || eth === 0) return 0;
    return eth * ethToInr;
  };

  return {
    ethToInr,
    loading,
    error,
    convertInrToEth,
    convertEthToInr,
  };
};
