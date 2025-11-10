import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const EXCHANGE_RATE = 250000; // 1 ETH = ₹250,000
const COMPANY_WALLET = import.meta.env.VITE_COMPANY_WALLET_ADDRESS || "0x";

/**
 * Convert INR to ETH
 */
export const convertInrToEth = (inr: number): number => {
  return inr / EXCHANGE_RATE;
};

/**
 * Convert ETH to INR
 */
export const convertEthToInr = (eth: number): number => {
  return eth * EXCHANGE_RATE;
};

/**
 * Check if MetaMask is installed
 */
export const isMetaMaskInstalled = (): boolean => {
  const { ethereum } = window as any;
  return !!ethereum?.isMetaMask;
};

/**
 * Connect to MetaMask
 */
export const connectMetaMask = async (): Promise<string> => {
  const { ethereum } = window as any;

  if (!ethereum?.isMetaMask) {
    throw new Error("MetaMask is not installed");
  }

  try {
    const accounts = await ethereum.request({
      method: "eth_requestAccounts",
    });

    if (!accounts || accounts.length === 0) {
      throw new Error("No accounts found");
    }

    return accounts[0];
  } catch (error: any) {
    throw new Error(error.message || "Failed to connect MetaMask");
  }
};

/**
 * Get current account balance
 */
export const getAccountBalance = async (account: string): Promise<string> => {
  const { ethereum } = window as any;

  if (!ethereum) {
    throw new Error("MetaMask not available");
  }

  try {
    const balance = await ethereum.request({
      method: "eth_getBalance",
      params: [account, "latest"],
    });

    // Convert from Wei to ETH
    return (parseInt(balance, 16) / 1e18).toFixed(8);
  } catch (error: any) {
    throw new Error(error.message || "Failed to get balance");
  }
};

/**
 * Send ETH transaction via MetaMask
 */
export const sendEthTransaction = async (
  toAddress: string,
  ethAmount: number,
  description: string
): Promise<string> => {
  const { ethereum } = window as any;

  if (!ethereum?.isMetaMask) {
    throw new Error("MetaMask is not installed");
  }

  try {
    // Get current account
    let accounts: string[] = [];
    try {
      accounts = await ethereum.request({
        method: "eth_accounts",
      });
    } catch (accountError: any) {
      console.error("Error getting accounts:", accountError);
      // Try requesting accounts if none are connected
      accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });
    }

    if (!accounts || accounts.length === 0) {
      throw new Error("No account connected. Please connect MetaMask.");
    }

    const fromAddress = accounts[0];

    // Validate recipient address
    if (!toAddress || !toAddress.startsWith("0x")) {
      throw new Error("Invalid recipient wallet address");
    }

    // Convert ETH to Wei (handle large numbers)
    const weiAmount = Math.floor(ethAmount * 1e18).toString(16);

    // Send transaction
    const txHash = await ethereum.request({
      method: "eth_sendTransaction",
      params: [
        {
          from: fromAddress,
          to: toAddress,
          value: `0x${weiAmount}`,
          data: `0x${Buffer.from(description).toString("hex")}`,
        },
      ],
    });

    if (!txHash) {
      throw new Error("No transaction hash returned");
    }

    return txHash;
  } catch (error: any) {
    if (error.code === 4001) {
      throw new Error("Transaction rejected by user");
    }
    if (error.code === -32603) {
      throw new Error("Internal JSON-RPC error. Please check your MetaMask connection.");
    }
    const errorMsg = error?.message || JSON.stringify(error);
    throw new Error(errorMsg || "Failed to send transaction");
  }
};

/**
 * Process seller payout (Official → Seller)
 */
export const processSellerPayout = async (
  itemId: string,
  sellerWallet: string,
  payoutAmountInr: number,
  officialId: string
): Promise<{ txHash: string; success: boolean }> => {
  if (!isMetaMaskInstalled()) {
    throw new Error("MetaMask not installed");
  }

  const ethAmount = convertInrToEth(payoutAmountInr);

  try {
    // Send ETH to seller
    const txHash = await sendEthTransaction(
      sellerWallet,
      ethAmount,
      `E-waste payout for item ${itemId}`
    );

    // Record transaction in database
    const { error: txError } = await supabase.from("transactions").insert({
      item_id: itemId,
      from_user_id: officialId,
      to_user_id: null,
      payout_amount_inr: payoutAmountInr,
      payout_amount_eth: ethAmount,
      currency_conversion_rate: EXCHANGE_RATE,
      blockchain_tx_hash: txHash,
      from_address: null, // Will be filled by official's MetaMask
      to_address: sellerWallet,
      status: "complete",
      transaction_type: "seller_payout",
    });

    if (txError) {
      console.error("Error recording transaction:", txError);
      toast.warning("Transaction sent but recording failed");
    }

    // Update item status
    const { error: itemError } = await supabase
      .from("items")
      .update({
        status: "payout_complete",
        processed_by: officialId,
        processed_at: new Date().toISOString(),
      })
      .eq("id", itemId);

    if (itemError) {
      console.error("Error updating item:", itemError);
    }

    return { txHash, success: true };
  } catch (error: any) {
    console.error("Payout error:", error);
    throw error;
  }
};

/**
 * Process buyer payment (Buyer → Company)
 */
export const processBuyerPayment = async (
  itemId: string,
  buyerId: string,
  paymentAmountInr: number
): Promise<{ txHash: string; success: boolean }> => {
  if (!isMetaMaskInstalled()) {
    throw new Error("MetaMask not installed");
  }

  if (!COMPANY_WALLET || COMPANY_WALLET === "0x") {
    throw new Error("Company wallet not configured");
  }

  const ethAmount = convertInrToEth(paymentAmountInr);

  try {
    // Send ETH to company
    const txHash = await sendEthTransaction(
      COMPANY_WALLET,
      ethAmount,
      `E-waste purchase for item ${itemId}`
    );

    // Record transaction in database
    const { error: txError } = await supabase.from("transactions").insert({
      item_id: itemId,
      from_user_id: buyerId,
      to_user_id: null,
      payout_amount_inr: paymentAmountInr,
      payout_amount_eth: ethAmount,
      currency_conversion_rate: EXCHANGE_RATE,
      blockchain_tx_hash: txHash,
      from_address: null, // Will be filled by buyer's MetaMask
      to_address: COMPANY_WALLET,
      status: "complete",
      transaction_type: "buyer_payment",
    });

    if (txError) {
      console.error("Error recording transaction:", txError);
      toast.warning("Payment sent but recording failed");
    }

    // Update item status
    const { error: itemError } = await supabase
      .from("items")
      .update({
        status: "sold",
        buyer_id: buyerId,
        purchased_at: new Date().toISOString(),
      })
      .eq("id", itemId);

    if (itemError) {
      console.error("Error updating item:", itemError);
    }

    return { txHash, success: true };
  } catch (error: any) {
    console.error("Payment error:", error);
    throw error;
  }
};

/**
 * Get transaction history for user
 */
export const getUserTransactionHistory = async (
  userId: string
): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error: any) {
    console.error("Error fetching transaction history:", error);
    return [];
  }
};

/**
 * Get transaction details
 */
export const getTransactionDetails = async (
  txHash: string
): Promise<any | null> => {
  try {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("blockchain_tx_hash", txHash)
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error("Error fetching transaction details:", error);
    return null;
  }
};
