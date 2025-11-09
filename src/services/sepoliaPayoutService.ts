import { ethers } from "ethers";

// Sepolia Testnet Configuration
const SEPOLIA_RPC_URL = import.meta.env.VITE_SEPOLIA_RPC_URL || "https://rpc.sepolia.org";
const PLATFORM_PRIVATE_KEY = import.meta.env.VITE_PLATFORM_PRIVATE_KEY;

interface SepoliaPayoutResult {
  success: boolean;
  txHash?: string;
  gasUsed?: string;
  gasPriceGwei?: string;
  error?: string;
}

/**
 * Send ETH payout on Sepolia testnet
 * @param toAddress - Recipient's Ethereum address
 * @param amountEth - Amount in ETH to send
 * @returns Transaction result with hash and gas details
 */
export async function sendSepoliaPayout(
  toAddress: string,
  amountEth: number
): Promise<SepoliaPayoutResult> {
  try {
    // Validate inputs
    if (!PLATFORM_PRIVATE_KEY) {
      throw new Error("Platform private key not configured");
    }

    if (!ethers.isAddress(toAddress)) {
      throw new Error("Invalid recipient Ethereum address");
    }

    if (amountEth <= 0) {
      throw new Error("Amount must be greater than 0");
    }

    // Connect to Sepolia network
    const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
    const wallet = new ethers.Wallet(PLATFORM_PRIVATE_KEY, provider);

    // Check platform wallet balance
    const balance = await provider.getBalance(wallet.address);
    const amountWei = ethers.parseEther(amountEth.toString());

    if (balance < amountWei) {
      throw new Error(
        `Insufficient balance. Required: ${amountEth} ETH, Available: ${ethers.formatEther(balance)} ETH`
      );
    }

    // Prepare transaction
    const tx = {
      to: toAddress,
      value: amountWei,
      // Let ethers estimate gas limit automatically
    };

    // Send transaction
    console.log(`Sending ${amountEth} ETH to ${toAddress}...`);
    const transaction = await wallet.sendTransaction(tx);
    
    console.log(`Transaction sent! Hash: ${transaction.hash}`);
    console.log("Waiting for confirmation...");

    // Wait for transaction to be mined
    const receipt = await transaction.wait();

    if (!receipt) {
      throw new Error("Transaction receipt not available");
    }

    // Calculate gas details
    const gasUsed = receipt.gasUsed.toString();
    const gasPriceGwei = ethers.formatUnits(receipt.gasPrice || 0, "gwei");

    console.log(`Transaction confirmed! Gas used: ${gasUsed}`);

    return {
      success: true,
      txHash: receipt.hash,
      gasUsed,
      gasPriceGwei,
    };
  } catch (error: any) {
    console.error("Sepolia payout error:", error);
    return {
      success: false,
      error: error.message || "Unknown error occurred",
    };
  }
}

/**
 * Validate Ethereum address format
 * @param address - Address to validate
 * @returns true if valid
 */
export function isValidEthAddress(address: string): boolean {
  return ethers.isAddress(address);
}

/**
 * Get platform wallet address
 * @returns Platform's Ethereum address
 */
export function getPlatformAddress(): string | null {
  if (!PLATFORM_PRIVATE_KEY) return null;
  
  try {
    const wallet = new ethers.Wallet(PLATFORM_PRIVATE_KEY);
    return wallet.address;
  } catch {
    return null;
  }
}

/**
 * Check platform wallet balance on Sepolia
 * @returns Balance in ETH
 */
export async function getPlatformBalance(): Promise<number> {
  try {
    if (!PLATFORM_PRIVATE_KEY) {
      throw new Error("Platform private key not configured");
    }

    const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
    const wallet = new ethers.Wallet(PLATFORM_PRIVATE_KEY, provider);
    const balance = await provider.getBalance(wallet.address);
    
    return parseFloat(ethers.formatEther(balance));
  } catch (error) {
    console.error("Error fetching platform balance:", error);
    return 0;
  }
}
