/**
 * Exchange Rate Service
 * Manages real-time ETH/INR conversion rates from CoinGecko API
 * Used throughout the platform for dual-currency display and calculations
 */

interface ExchangeRateData {
  ethToInr: number;
  lastUpdated: number;
  source: string;
}

// Cache for exchange rate to avoid excessive API calls
let cachedRate: ExchangeRateData | null = null;
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes cache

/**
 * Fetch real-time ETH/INR exchange rate from CoinGecko API
 * @returns Exchange rate (1 ETH = X INR)
 */
export async function fetchEthToInrRate(): Promise<number> {
  try {
    // Check if cached rate is still valid
    if (cachedRate && Date.now() - cachedRate.lastUpdated < CACHE_DURATION_MS) {
      console.log(`Using cached ETH rate: ${cachedRate.ethToInr} INR`);
      return cachedRate.ethToInr;
    }

    // Fetch from CoinGecko API
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=inr"
    );

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.statusText}`);
    }

    const data = await response.json();
    const ethToInr = data.ethereum?.inr;

    if (!ethToInr || ethToInr <= 0) {
      throw new Error("Invalid ETH/INR rate received from API");
    }

    // Cache the rate
    cachedRate = {
      ethToInr,
      lastUpdated: Date.now(),
      source: "CoinGecko",
    };

    console.log(`Fetched fresh ETH rate: ${ethToInr} INR`);
    return ethToInr;
  } catch (error) {
    console.error("Error fetching ETH/INR rate:", error);

    // Fallback to cached rate if available
    if (cachedRate) {
      console.warn("Using stale cached rate due to API error");
      return cachedRate.ethToInr;
    }

    // Final fallback to approximate rate
    console.warn("Using fallback rate: 250,000 INR per ETH");
    return 250000;
  }
}

/**
 * Convert INR amount to ETH using current exchange rate
 * @param amountInr - Amount in Indian Rupees
 * @returns Amount in ETH (rounded to 8 decimals)
 */
export async function convertInrToEth(amountInr: number): Promise<number> {
  if (amountInr <= 0) {
    return 0;
  }

  const rate = await fetchEthToInrRate();
  const ethAmount = amountInr / rate;

  // Round to 8 decimals (standard for ETH)
  return Math.round(ethAmount * 100000000) / 100000000;
}

/**
 * Convert ETH amount to INR using current exchange rate
 * @param amountEth - Amount in ETH
 * @returns Amount in Indian Rupees (rounded to 2 decimals)
 */
export async function convertEthToInr(amountEth: number): Promise<number> {
  if (amountEth <= 0) {
    return 0;
  }

  const rate = await fetchEthToInrRate();
  const inrAmount = amountEth * rate;

  // Round to 2 decimals (standard for INR)
  return Math.round(inrAmount * 100) / 100;
}

/**
 * Get current exchange rate with metadata
 * @returns Exchange rate data including rate, last updated time, and source
 */
export async function getExchangeRateData(): Promise<ExchangeRateData> {
  const ethToInr = await fetchEthToInrRate();

  return {
    ethToInr,
    lastUpdated: cachedRate?.lastUpdated || Date.now(),
    source: cachedRate?.source || "CoinGecko",
  };
}

/**
 * Format a dual-currency display string
 * @param amountInr - Amount in INR
 * @param amountEth - Amount in ETH
 * @returns Formatted string like "Rs 5,000 / 0.02 ETH"
 */
export function formatDualCurrency(amountInr: number, amountEth: number): string {
  const formattedInr = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountInr);

  const formattedEth = amountEth.toFixed(8).replace(/\.?0+$/, "");

  return `${formattedInr} / ${formattedEth} ETH`;
}

/**
 * Clear the cached exchange rate (useful for testing or manual refresh)
 */
export function clearExchangeRateCache(): void {
  cachedRate = null;
  console.log("Exchange rate cache cleared");
}
