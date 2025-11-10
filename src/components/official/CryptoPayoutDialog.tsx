import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DualCurrencyDisplay } from "@/components/ui/DualCurrencyDisplay";
import { convertInrToEth, sendEthTransaction, isMetaMaskInstalled } from "@/services/cryptoTransactionService";
import { toast } from "sonner";
import { AlertCircle, Loader2, CheckCircle2 } from "lucide-react";

interface CryptoPayoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sellerWallet: string | null;
  payoutAmount: number;
  itemId: string;
  onPayoutComplete: (txHash: string) => void;
}

/**
 * Dialog for officials to initiate crypto payouts via MetaMask
 */
export const CryptoPayoutDialog = ({
  open,
  onOpenChange,
  sellerWallet,
  payoutAmount,
  itemId,
  onPayoutComplete,
}: CryptoPayoutDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ethAmount = convertInrToEth(payoutAmount);

  const handleInitiatePayout = async () => {
    if (!sellerWallet) {
      setError("Seller wallet address not found");
      return;
    }

    if (!isMetaMaskInstalled()) {
      setError("MetaMask is not installed. Please install MetaMask to proceed with crypto payouts.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Send ETH transaction via MetaMask
      const hash = await sendEthTransaction(
        sellerWallet,
        ethAmount,
        `E-waste payout for item ${itemId}`
      );

      setTxHash(hash);
      toast.success(`Transaction initiated! Hash: ${hash.slice(0, 10)}...`);

      // Call the callback after a short delay
      setTimeout(() => {
        onPayoutComplete(hash);
        onOpenChange(false);
      }, 2000);
    } catch (error: any) {
      const errorMessage = error.message || "Failed to initiate transaction";
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
          <DialogTitle>Initiate Crypto Payout</DialogTitle>
          <DialogDescription>
            Send Sepolia ETH to the seller's wallet via MetaMask
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Payout Amount Display */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
            <p className="text-xs text-muted-foreground mb-2">Payout Amount</p>
            <DualCurrencyDisplay
              amountInr={payoutAmount}
              amountEth={ethAmount}
              variant="breakdown"
            />
          </div>

          {/* Seller Wallet Info */}
          <div className="space-y-2">
            <Label className="text-xs">Recipient Wallet</Label>
            <div className="p-3 bg-muted rounded-lg font-mono text-sm break-all">
              {sellerWallet ? (
                <>
                  {sellerWallet.slice(0, 6)}...{sellerWallet.slice(-4)}
                </>
              ) : (
                <span className="text-red-600">No wallet address found</span>
              )}
            </div>
          </div>

          {/* MetaMask Info */}
          <Alert className="border-blue-200 bg-blue-50">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 text-sm">
              You will be prompted to confirm this transaction in MetaMask. Make sure you're connected to the Sepolia testnet.
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
                Transaction sent! Hash: {txHash.slice(0, 20)}...
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
              onClick={handleInitiatePayout}
              disabled={loading || !sellerWallet || !!txHash}
              className="flex-1"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {txHash ? "Completed" : loading ? "Processing..." : "Send ETH"}
            </Button>
          </div>

          {/* Info Text */}
          <p className="text-xs text-muted-foreground text-center">
            This transaction will be recorded on the Sepolia testnet blockchain
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
