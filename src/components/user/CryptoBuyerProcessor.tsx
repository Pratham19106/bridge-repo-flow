import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DualCurrencyDisplay } from "@/components/ui/DualCurrencyDisplay";
import { processBuyerPayment, convertInrToEth } from "@/services/cryptoPaymentService";
import { toast } from "sonner";
import { AlertCircle, Loader2, CheckCircle2 } from "lucide-react";

interface CryptoBuyerProcessorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: string;
  itemName: string;
  paymentAmount: number;
  buyerId: string;
  onSuccess: (txHash: string) => void;
}

export const CryptoBuyerProcessor = ({
  open,
  onOpenChange,
  itemId,
  itemName,
  paymentAmount,
  buyerId,
  onSuccess,
}: CryptoBuyerProcessorProps) => {
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ethAmount = convertInrToEth(paymentAmount);

  const handleProcessPayment = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await processBuyerPayment(
        itemId,
        buyerId,
        paymentAmount
      );

      setTxHash(result.txHash);
      toast.success(`Payment sent! Hash: ${result.txHash.slice(0, 10)}...`);

      setTimeout(() => {
        onSuccess(result.txHash);
        onOpenChange(false);
      }, 2000);
    } catch (err: any) {
      const errorMessage = err.message || "Failed to process payment";
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
            <p className="text-xs font-medium">Item</p>
            <div className="p-3 bg-muted rounded-lg">
              <p className="font-medium text-sm">{itemName}</p>
              <p className="text-xs text-muted-foreground">ID: {itemId.slice(0, 8)}...</p>
            </div>
          </div>

          {/* Payment Amount */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
            <p className="text-xs text-muted-foreground mb-2">Payment Amount</p>
            <DualCurrencyDisplay
              amountInr={paymentAmount}
              amountEth={ethAmount}
              variant="breakdown"
            />
          </div>

          {/* Info Alert */}
          <Alert className="border-blue-200 bg-blue-50">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 text-sm">
              You will be prompted to confirm this payment in MetaMask. Make sure you have enough Sepolia ETH in your wallet.
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
                Payment sent! Hash: {txHash.slice(0, 20)}...
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
              onClick={handleProcessPayment}
              disabled={loading || !!txHash}
              className="flex-1"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {txHash ? "Completed" : loading ? "Processing..." : "Pay with ETH"}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            This payment will be recorded on Sepolia testnet blockchain
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
