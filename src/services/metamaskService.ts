/**
 * MetaMask Integration Service
 * Handles all MetaMask wallet connections and transactions
 * No private keys stored - all transactions signed by user's MetaMask
 */

import { ethers } from "ethers";
import { SEPOLIA_CONFIG } from "@/config/cryptoConfig";

interface MetaMaskProvider extends ethers.Eip1193Provider {
  isMetaMask?: boolean;
  on?: (event: string, callback: (...args: any[]) => void) => void;
  removeListener?: (event: string, callback: (...args: any[]) => void) => void;
}

/**
 * Check if MetaMask is installed
 */
export function isMetaMaskInstalled(): boolean {
  const { ethereum } = window as any;
  return ethereum?.isMetaMask === true;
}

/**
 * Get MetaMask provider
 */
export function getMetaMaskProvider(): MetaMaskProvider | null {
  const { ethereum } = window as any;
  return ethereum?.isMetaMask ? ethereum : null;
}

/**
 * Request user's wallet connection
 * @returns User's wallet address
 */
export async function connectMetaMask(): Promise<string> {
  if (!isMetaMaskInstalled()) {
    throw new Error("MetaMask is not installed. Please install MetaMask extension.");
  }

  const provider = getMetaMaskProvider();
  if (!provider) {
    throw new Error("Failed to get MetaMask provider");
  }

  try {
    // Request account access
    const accounts = await provider.request?.({
      method: "eth_requestAccounts",
    });

    if (!accounts || accounts.length === 0) {
      throw new Error("No accounts found in MetaMask");
    }

    const userAddress = (accounts as string[])[0];
    console.log("Connected to MetaMask:", userAddress);

    // Switch to Sepolia if not already on it
    await switchToSepolia();

    return userAddress;
  } catch (error: any) {
    console.error("MetaMask connection error:", error);
    throw error;
  }
}

/**
 * Switch MetaMask to Sepolia testnet
 */
export async function switchToSepolia(): Promise<void> {
  const provider = getMetaMaskProvider();
  if (!provider) {
    throw new Error("MetaMask provider not found");
  }

  try {
    // Try to switch to Sepolia
    await provider.request?.({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: `0x${SEPOLIA_CONFIG.chainId.toString(16)}` }],
    });
  } catch (error: any) {
    // If chain doesn't exist, add it
    if (error.code === 4902) {
      try {
        await provider.request?.({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: `0x${SEPOLIA_CONFIG.chainId.toString(16)}`,
              chainName: SEPOLIA_CONFIG.chainName,
              rpcUrls: [SEPOLIA_CONFIG.rpcUrl],
              blockExplorerUrls: [SEPOLIA_CONFIG.blockExplorerUrl],
              nativeCurrency: {
                name: "Sepolia ETH",
                symbol: "ETH",
                decimals: 18,
              },
            },
          ],
        });
      } catch (addError) {
        console.error("Failed to add Sepolia network:", addError);
        throw addError;
      }
    } else {
      throw error;
    }
  }
}

/**
 * Get current connected account
 */
export async function getCurrentAccount(): Promise<string | null> {
  const provider = getMetaMaskProvider();
  if (!provider) {
    return null;
  }

  try {
    const accounts = await provider.request?.({
      method: "eth_accounts",
    });

    return accounts && (accounts as string[]).length > 0 ? (accounts as string[])[0] : null;
  } catch (error) {
    console.error("Error getting current account:", error);
    return null;
  }
}

/**
 * Get user's wallet balance
 * @param address User's wallet address
 * @returns Balance in ETH
 */
export async function getWalletBalance(address: string): Promise<number> {
  try {
    const provider = new ethers.JsonRpcProvider(SEPOLIA_CONFIG.rpcUrl);
    const balance = await provider.getBalance(address);
    return parseFloat(ethers.formatEther(balance));
  } catch (error) {
    console.error("Error fetching wallet balance:", error);
    return 0;
  }
}

interface SendTransactionParams {
  toAddress: string;
  amountEth: number;
  description?: string;
}

/**
 * Send ETH transaction using MetaMask
 * User signs the transaction in MetaMask
 * @param params Transaction parameters
 * @returns Transaction hash
 */
export async function sendEthTransaction(params: SendTransactionParams): Promise<string> {
  const { toAddress, amountEth, description } = params;

  if (!isMetaMaskInstalled()) {
    throw new Error("MetaMask is not installed");
  }

  const provider = getMetaMaskProvider();
  if (!provider) {
    throw new Error("MetaMask provider not found");
  }

  try {
    // Get current account
    const currentAccount = await getCurrentAccount();
    if (!currentAccount) {
      throw new Error("No MetaMask account connected. Please connect first.");
    }

    // Validate recipient address
    if (!ethers.isAddress(toAddress)) {
      throw new Error("Invalid recipient address");
    }

    if (amountEth <= 0) {
      throw new Error("Amount must be greater than 0");
    }

    // Convert amount to Wei
    const amountWei = ethers.parseEther(amountEth.toString());

    // Prepare transaction
    const txParams = {
      from: currentAccount,
      to: toAddress,
      value: `0x${amountWei.toString(16)}`,
      gas: `0x${(21000).toString(16)}`, // Standard ETH transfer gas
    };

    console.log("Sending transaction:", {
      from: currentAccount,
      to: toAddress,
      amount: amountEth,
      description,
    });

    // Send transaction via MetaMask
    const txHash = await provider.request?.({
      method: "eth_sendTransaction",
      params: [txParams],
    });

    if (!txHash) {
      throw new Error("Transaction failed - no hash returned");
    }

    console.log("Transaction sent! Hash:", txHash);
    return txHash as string;
  } catch (error: any) {
    console.error("MetaMask transaction error:", error);
    throw error;
  }
}

/**
 * Wait for transaction confirmation
 * @param txHash Transaction hash
 * @param confirmations Number of confirmations to wait for
 * @returns Transaction receipt
 */
export async function waitForTransaction(
  txHash: string,
  confirmations: number = 1
): Promise<ethers.TransactionReceipt | null> {
  try {
    const provider = new ethers.JsonRpcProvider(SEPOLIA_CONFIG.rpcUrl);
    const receipt = await provider.waitForTransaction(txHash, confirmations);
    return receipt;
  } catch (error) {
    console.error("Error waiting for transaction:", error);
    return null;
  }
}

/**
 * Get transaction details
 * @param txHash Transaction hash
 * @returns Transaction details
 */
export async function getTransactionDetails(txHash: string): Promise<ethers.TransactionResponse | null> {
  try {
    const provider = new ethers.JsonRpcProvider(SEPOLIA_CONFIG.rpcUrl);
    const tx = await provider.getTransaction(txHash);
    return tx;
  } catch (error) {
    console.error("Error fetching transaction details:", error);
    return null;
  }
}

/**
 * Get transaction receipt
 * @param txHash Transaction hash
 * @returns Transaction receipt
 */
export async function getTransactionReceipt(txHash: string): Promise<ethers.TransactionReceipt | null> {
  try {
    const provider = new ethers.JsonRpcProvider(SEPOLIA_CONFIG.rpcUrl);
    const receipt = await provider.getTransactionReceipt(txHash);
    return receipt;
  } catch (error) {
    console.error("Error fetching transaction receipt:", error);
    return null;
  }
}

/**
 * Estimate gas for a transaction
 * @param toAddress Recipient address
 * @param amountEth Amount in ETH
 * @returns Estimated gas in Wei
 */
export async function estimateGas(toAddress: string, amountEth: number): Promise<bigint> {
  try {
    const provider = new ethers.JsonRpcProvider(SEPOLIA_CONFIG.rpcUrl);
    const currentAccount = await getCurrentAccount();

    if (!currentAccount) {
      throw new Error("No account connected");
    }

    const amountWei = ethers.parseEther(amountEth.toString());

    const gasEstimate = await provider.estimateGas({
      from: currentAccount,
      to: toAddress,
      value: amountWei,
    });

    return gasEstimate;
  } catch (error) {
    console.error("Error estimating gas:", error);
    // Return standard gas for ETH transfer
    return BigInt(21000);
  }
}

/**
 * Get current gas price
 * @returns Gas price in Gwei
 */
export async function getGasPrice(): Promise<number> {
  try {
    const provider = new ethers.JsonRpcProvider(SEPOLIA_CONFIG.rpcUrl);
    const feeData = await provider.getFeeData();
    if (feeData.gasPrice) {
      return parseFloat(ethers.formatUnits(feeData.gasPrice, "gwei"));
    }
    return 0;
  } catch (error) {
    console.error("Error fetching gas price:", error);
    return 0;
  }
}

/**
 * Listen for account changes
 * @param callback Function to call when account changes
 */
export function onAccountChanged(callback: (account: string | null) => void): void {
  const provider = getMetaMaskProvider();
  if (!provider) return;

  provider.on?.("accountsChanged", (accounts: string[]) => {
    const account = accounts.length > 0 ? accounts[0] : null;
    console.log("Account changed:", account);
    callback(account);
  });
}

/**
 * Listen for chain changes
 * @param callback Function to call when chain changes
 */
export function onChainChanged(callback: (chainId: string) => void): void {
  const provider = getMetaMaskProvider();
  if (!provider) return;

  provider.on?.("chainChanged", (chainId: string) => {
    console.log("Chain changed:", chainId);
    callback(chainId);
  });
}

/**
 * Remove event listeners
 */
export function removeMetaMaskListeners(): void {
  const provider = getMetaMaskProvider();
  if (!provider) return;

  provider.removeListener?.("accountsChanged", () => {});
  provider.removeListener?.("chainChanged", () => {});
}
