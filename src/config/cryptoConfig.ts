/**
 * Crypto Configuration
 * Central configuration for all cryptocurrency-related settings
 */

// Sepolia Testnet Configuration
export const SEPOLIA_CONFIG = {
  // Network details
  chainId: 11155111,
  chainName: "Sepolia Testnet",
  rpcUrl: import.meta.env.VITE_SEPOLIA_RPC_URL || "https://rpc.sepolia.org",
  blockExplorerUrl: "https://sepolia.etherscan.io",

  // Platform wallet (for receiving payments from buyers)
  // This is the company's MetaMask wallet address
  platformWalletAddress: import.meta.env.VITE_PLATFORM_WALLET_ADDRESS || "",

  // MetaMask Integration (No private keys stored - secure!)
  useMetaMask: import.meta.env.VITE_USE_METAMASK === "true",

  // Gas settings
  gasLimit: 21000, // Standard ETH transfer
  gasMultiplier: 1.2, // Multiply estimated gas by this factor for safety
};

// Exchange Rate Configuration
export const EXCHANGE_RATE_CONFIG = {
  // API endpoint for fetching ETH/INR rate
  apiEndpoint: "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=inr",

  // Cache duration in milliseconds (5 minutes)
  cacheDurationMs: 5 * 60 * 1000,

  // Fallback rate if API fails (1 ETH = 250,000 INR)
  fallbackRate: 250000,

  // Decimal places for ETH (Ethereum standard)
  ethDecimals: 8,

  // Decimal places for INR
  inrDecimals: 2,
};

// Currency Display Configuration
export const CURRENCY_DISPLAY_CONFIG = {
  // Primary currency (shown first)
  primary: {
    code: "INR",
    symbol: "₹",
    name: "Indian Rupee",
  },

  // Secondary currency (shown as equivalent)
  secondary: {
    code: "ETH",
    symbol: "Ξ",
    name: "Ethereum (Sepolia)",
  },

  // Format: "Rs 5,000 / 0.02 ETH"
  separator: " / ",
  format: "{inr} {separator} {eth} ETH",
};

// Transaction Configuration
export const TRANSACTION_CONFIG = {
  // Minimum transaction amount in INR
  minAmountInr: 100,

  // Maximum transaction amount in INR (safety limit)
  maxAmountInr: 10000000,

  // Confirmation blocks required (for Sepolia, usually 1-2)
  confirmationBlocks: 1,

  // Transaction timeout in milliseconds (5 minutes)
  timeoutMs: 5 * 60 * 1000,
};

// Wallet Configuration
export const WALLET_CONFIG = {
  // Ethereum address format: 42 characters (0x + 40 hex chars)
  addressLength: 42,
  addressPrefix: "0x",

  // Supported wallet providers
  supportedProviders: ["MetaMask", "WalletConnect"],

  // Verification requirements
  verification: {
    formatValidation: true,
    balanceCheck: false, // Don't require minimum balance for sellers
  },
};

/**
 * Validate Sepolia configuration
 * @returns true if all required config values are set
 */
export function validateSepoliaConfig(): boolean {
  const required = [
    SEPOLIA_CONFIG.rpcUrl,
    SEPOLIA_CONFIG.platformWalletAddress,
  ];

  return required.every((value) => value && value.length > 0);
}

/**
 * Get display format for dual currency
 * @param inrAmount Amount in INR
 * @param ethAmount Amount in ETH
 * @returns Formatted string
 */
export function formatCurrencyDisplay(inrAmount: number, ethAmount: number): string {
  const formattedInr = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(inrAmount);

  const formattedEth = ethAmount.toFixed(EXCHANGE_RATE_CONFIG.ethDecimals);

  return `${formattedInr} / ${formattedEth} ETH`;
}
