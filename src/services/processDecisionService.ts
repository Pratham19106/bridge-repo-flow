import { supabase } from "@/integrations/supabase/client";
import { sendSepoliaPayout } from "./sepoliaPayoutService";

interface ProcessDecisionInput {
  itemId: string;
  finalValuationInr: number;
  officialId: string;
  officialDecision: "refurbish" | "recycle" | "scrap" | "rejected";
  repairCost?: number;
  sellingPrice?: number;
  recycleCost?: number;
  scrapCost?: number;
}

interface ProcessDecisionResult {
  success: boolean;
  submissionId?: string;
  transactionId?: string;
  payoutMethod?: string;
  payoutAmountInr?: number;
  payoutAmountEth?: number;
  transactionHash?: string;
  status?: string;
  message?: string;
  error?: string;
}

/**
 * Main API function to process official's decision and handle payout
 */
export async function processDecision(
  input: ProcessDecisionInput
): Promise<ProcessDecisionResult> {
  try {
    // 1. Input Validation
    if (!input.itemId || !input.officialId || !input.officialDecision) {
      return {
        success: false,
        error: "Missing required fields: itemId, officialId, or officialDecision",
      };
    }

    if (input.finalValuationInr <= 0) {
      return {
        success: false,
        error: "Final valuation must be greater than 0",
      };
    }

    // 2. Fetch Submission Details
    const { data: item, error: fetchError } = await supabase
      .from("items")
      .select("*")
      .eq("id", input.itemId)
      .single();

    if (fetchError || !item) {
      return {
        success: false,
        error: "Item not found or error fetching item details",
      };
    }

    if (item.status !== "pending_valuation") {
      return {
        success: false,
        error: `Item cannot be processed. Current status: ${item.status}`,
      };
    }

    const payoutMethod = item.payout_method || "INR";
    const sellerEthAddress = item.seller_eth_address;

    let transactionId: string | null = null;
    let transactionHash: string | null = null;
    let payoutAmountEth: number | null = null;
    let currencyRate: number | null = null;
    let transactionStatus = "pending";

    // 3. Conditional Payout Logic
    if (payoutMethod === "SEPOLIA_ETH") {
      // 3a. Validate Ethereum Address
      if (!sellerEthAddress) {
        return {
          success: false,
          error: "Seller Ethereum address not provided for crypto payout",
        };
      }

      // 3b. Fetch Current ETH/INR Conversion Rate
      try {
        const response = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=inr"
        );
        
        if (!response.ok) {
          throw new Error("Failed to fetch ETH rate");
        }

        const data = await response.json();
        currencyRate = data.ethereum.inr;

        if (!currencyRate) {
          throw new Error("Invalid ETH rate received");
        }

        // 3c. Calculate ETH Payout Amount
        payoutAmountEth = input.finalValuationInr / currencyRate;
        payoutAmountEth = parseFloat(payoutAmountEth.toFixed(8)); // Round to 8 decimals

      } catch (error: any) {
        return {
          success: false,
          error: `Failed to fetch ETH conversion rate: ${error.message}`,
        };
      }

      // 3d. Create Pending Transaction Record
      const { data: transaction, error: txError } = await supabase
        .from("transactions")
        .insert({
          item_id: input.itemId,
          payout_amount_inr: input.finalValuationInr,
          payout_amount_eth: payoutAmountEth,
          currency_conversion_rate: currencyRate,
          payment_method: "SEPOLIA_ETH",
          to_address: sellerEthAddress,
          status: "processing",
          processed_by: input.officialId,
        })
        .select()
        .single();

      if (txError || !transaction) {
        return {
          success: false,
          error: "Failed to create transaction record",
        };
      }

      transactionId = transaction.id;

      // 3e. Execute Blockchain Transaction
      const payoutResult = await sendSepoliaPayout(
        sellerEthAddress,
        payoutAmountEth
      );

      // 3f. Update Transaction with Blockchain Proof
      if (payoutResult.success && payoutResult.txHash) {
        transactionHash = payoutResult.txHash;
        transactionStatus = "complete";

        await supabase
          .from("transactions")
          .update({
            blockchain_tx_hash: payoutResult.txHash,
            status: "complete",
            completed_at: new Date().toISOString(),
            gas_used: payoutResult.gasUsed,
            gas_price_gwei: payoutResult.gasPriceGwei,
          })
          .eq("id", transactionId);
      } else {
        transactionStatus = "failed";

        await supabase
          .from("transactions")
          .update({
            status: "failed",
            failure_reason: payoutResult.error || "Unknown error",
          })
          .eq("id", transactionId);

        return {
          success: false,
          error: `Blockchain transaction failed: ${payoutResult.error}`,
        };
      }
    } else {
      // INR Payout Path
      // 3g. Create Pending INR Transaction
      const { data: transaction, error: txError } = await supabase
        .from("transactions")
        .insert({
          item_id: input.itemId,
          payout_amount_inr: input.finalValuationInr,
          payment_method: "INR",
          status: "pending",
          processed_by: input.officialId,
        })
        .select()
        .single();

      if (txError || !transaction) {
        return {
          success: false,
          error: "Failed to create transaction record",
        };
      }

      transactionId = transaction.id;

      // 3h. Generate Fiat Transfer Reference
      const timestamp = Date.now();
      const itemIdShort = input.itemId.substring(0, 8);
      const fiatRef = `INR_${timestamp}_${itemIdShort}`;

      await supabase
        .from("transactions")
        .update({
          fiat_transfer_ref: fiatRef,
          notes: "Awaiting bank transfer confirmation",
        })
        .eq("id", transactionId);
    }

    // 4. Update Submission Record
    const statusMap: Record<string, string> = {
      refurbish: "ready_to_sell",
      recycle: "recycled",
      scrap: "scrapped",
      rejected: "payout_failed",
    };

    const branchMap: Record<string, string> = {
      refurbish: "Refurbish & Sell",
      recycle: "Recycle",
      scrap: "Scrap/Not Usable",
      rejected: "Rejected",
    };

    const newStatus =
      transactionStatus === "complete"
        ? "payout_complete"
        : transactionStatus === "failed"
        ? "payout_failed"
        : statusMap[input.officialDecision] || "valuated";

    const { error: updateError } = await supabase
      .from("items")
      .update({
        processed_by: input.officialId,
        final_payout: input.finalValuationInr,
        repair_cost: input.repairCost || 0,
        selling_price: input.sellingPrice || 0,
        recycle_cost: input.recycleCost || 0,
        scrap_cost: input.scrapCost || 0,
        status: newStatus,
        current_branch: branchMap[input.officialDecision] || "N/A",
        transaction_id: transactionId,
        processed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.itemId);

    if (updateError) {
      return {
        success: false,
        error: "Failed to update item record",
      };
    }

    // 5. Return Success Response
    return {
      success: true,
      submissionId: input.itemId,
      transactionId: transactionId || undefined,
      payoutMethod,
      payoutAmountInr: input.finalValuationInr,
      payoutAmountEth: payoutAmountEth || undefined,
      transactionHash: transactionHash || undefined,
      status: transactionStatus,
      message: "Decision processed successfully",
    };
  } catch (error: any) {
    console.error("Process decision error:", error);
    return {
      success: false,
      error: error.message || "Unknown error occurred",
    };
  }
}
