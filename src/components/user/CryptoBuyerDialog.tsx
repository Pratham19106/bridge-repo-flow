import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DualCurrencyDisplay } from "@/components/ui/DualCurrencyDisplay";
import { convertInrToEth, sendEthTransaction, isMetaMaskInstalled } from "@/services/cryptoTransactionService";
import { toast } from "sonner";
import { AlertCircle, Loader2, CheckCircle2 } from "lucide-react";

interface CryptoBuyerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyWallet: string;
  purchaseAmount: number;
  itemId: string;
  itemName: string;
  onPaymentComplete: (txHash: string) => void;
}

/**
 * Dialog for buyers to pay for items via Sepolia ETH
 */
export const CryptoBuyerDialog = ({
  open,
  onOpenChange,
  companyWallet,
  purchaseAmount,
  itemId,
  itemName,
  onPaymentComplete,
}: CryptoBuyerDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ethAmount = convertInrToEth(purchaseAmount);

  const handleInitiatePayment = async () => {
    if (!isMetaMaskInstalled()) {
      setError("MetaMask is not installed. Please install MetaMask to proceed with crypto payments.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Send ETH transaction via MetaMask
      const hash = await sendEthTransaction(
        companyWallet,
        ethAmount,
        `Purchase of ${itemName} (Item ID: ${itemId})`
      );

      setTxHash(hash);
      toast.success(`Payment initiated! Hash: ${hash.slice(0, 10)}...`);

      // Call the callback after a short delay
      setTimeout(() => {
        onPaymentComplete(hash);
        onOpenChange(false);
      }, 2000);
    } catch (error: any) {
      const errorMessage = error.message || "Failed to initiate payment";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Purchase with Crypto</DialogTitle>
          <DialogDescription>
            Pay for {itemName} using Sepolia ETH
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Item Info */}
          <div className="space-y-2">
            <Label className="text-xs">Item</Label>
            <div className="p-3 bg-muted rounded-lg">
              <p className="font-medium text-sm">{itemName}</p>
              <p className="text-xs text-muted-foreground">ID: {itemId.slice(0, 8)}...</p>
            </div>
          </div>

          {/* Payment Amount Display */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
            <p className="text-xs text-muted-foreground mb-2">Payment Amount</p>
            <DualCurrencyDisplay
              amountInr={purchaseAmount}
              amountEth={ethAmount}
              variant="breakdown"
            />
          </div>

          {/* Company Wallet Info */}
          <div className="space-y-2">
            <Label className="text-xs">Payment To</Label>
            <div className="p-3 bg-muted rounded-lg font-mono text-sm break-all">
              {companyWallet.slice(0, 6)}...{companyWallet.slice(-4)}
            </div>
          </div>

          {/* MetaMask Info */}
          <Alert className="border-blue-200 bg-blue-50">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 text-sm">
              You will be prompted to confirm this payment in MetaMask. Make sure you have enough Sepolia ETH in your wallet.
            </AlertDescription>
          </Alert>

          {/* Error Message */}
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800 text-sm">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Success Message */}
          {txHash && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 text-sm">
                Payment sent! Hash: {txHash.slice(0, 20)}...
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleInitiatePayment}
              disabled={loading || !!txHash}
              className="flex-1"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {txHash ? "Completed" : loading ? "Processing..." : "Pay with ETH"}
            </Button>
          </div>

          {/* Info Text */}
          <p className="text-xs text-muted-foreground text-center">
            This payment will be recorded on the Sepolia testnet blockchain
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
