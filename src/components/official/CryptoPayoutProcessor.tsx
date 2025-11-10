import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DualCurrencyDisplay } from "@/components/ui/DualCurrencyDisplay";
import { processSellerPayout, convertInrToEth } from "@/services/cryptoPaymentService";
import { toast } from "sonner";
import { AlertCircle, Loader2, CheckCircle2 } from "lucide-react";

interface CryptoPayoutProcessorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: string;
  sellerWallet: string;
  payoutAmount: number;
  officialId: string;
  onSuccess: (txHash: string) => void;
}

export const CryptoPayoutProcessor = ({
  open,
  onOpenChange,
  itemId,
  sellerWallet,
  payoutAmount,
  officialId,
  onSuccess,
}: CryptoPayoutProcessorProps) => {
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ethAmount = convertInrToEth(payoutAmount);

  const handleProcessPayout = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await processSellerPayout(
        itemId,
        sellerWallet,
        payoutAmount,
        officialId
      );

      setTxHash(result.txHash);
      toast.success(`Payout sent! Hash: ${result.txHash.slice(0, 10)}...`);

      setTimeout(() => {
        onSuccess(result.txHash);
        onOpenChange(false);
      }, 2000);
    } catch (err: any) {
      const errorMessage = err.message || "Failed to process payout";
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
          <DialogTitle>Process Seller Payout</DialogTitle>
          <DialogDescription>
            Send Sepolia ETH to seller's wallet via MetaMask
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Payout Amount */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
            <p className="text-xs text-muted-foreground mb-2">Payout Amount</p>
            <DualCurrencyDisplay
              amountInr={payoutAmount}
              amountEth={ethAmount}
              variant="breakdown"
            />
          </div>

          {/* Seller Wallet */}
          <div className="space-y-2">
            <p className="text-xs font-medium">Recipient Wallet</p>
            <div className="p-3 bg-muted rounded-lg font-mono text-sm break-all">
              {sellerWallet.slice(0, 6)}...{sellerWallet.slice(-4)}
            </div>
          </div>

          {/* Info Alert */}
          <Alert className="border-blue-200 bg-blue-50">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 text-sm">
              You will be prompted to confirm this transaction in MetaMask. Make sure you're connected to Sepolia testnet.
            </AlertDescription>
          </Alert>

          {/* Error */}
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800 text-sm">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Success */}
          {txHash && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 text-sm">
                Transaction sent! Hash: {txHash.slice(0, 20)}...
              </AlertDescription>
            </Alert>
          )}

          {/* Actions */}
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
              onClick={handleProcessPayout}
              disabled={loading || !!txHash}
              className="flex-1"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {txHash ? "Completed" : loading ? "Processing..." : "Send ETH"}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            This transaction will be recorded on Sepolia testnet blockchain
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
