import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Wallet, Banknote, Info } from "lucide-react";

interface PayoutMethodSelectorProps {
  payoutMethod: string;
  onPayoutMethodChange: (method: string) => void;
  ethAddress: string;
  onEthAddressChange: (address: string) => void;
}

export const PayoutMethodSelector = ({
  payoutMethod,
  onPayoutMethodChange,
  ethAddress,
  onEthAddressChange,
}: PayoutMethodSelectorProps) => {
  const [addressError, setAddressError] = useState("");

  const validateEthAddress = (address: string) => {
    if (!address) {
      setAddressError("");
      return;
    }

    // Basic Ethereum address validation
    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    if (!ethAddressRegex.test(address)) {
      setAddressError("Invalid Ethereum address format");
    } else {
      setAddressError("");
    }
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAddress = e.target.value;
    onEthAddressChange(newAddress);
    validateEthAddress(newAddress);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="w-5 h-5" />
          Payout Method
        </CardTitle>
        <CardDescription>
          Choose how you'd like to receive your payment
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <RadioGroup value={payoutMethod} onValueChange={onPayoutMethodChange}>
          <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent cursor-pointer">
            <RadioGroupItem value="INR" id="inr" />
            <Label htmlFor="inr" className="flex-1 cursor-pointer">
              <div className="flex items-center gap-2">
                <Banknote className="w-4 h-4" />
                <div>
                  <div className="font-medium">Bank Transfer (INR)</div>
                  <div className="text-xs text-muted-foreground">
                    Traditional payment via bank account
                  </div>
                </div>
              </div>
            </Label>
          </div>

          <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent cursor-pointer">
            <RadioGroupItem value="SEPOLIA_ETH" id="eth" />
            <Label htmlFor="eth" className="flex-1 cursor-pointer">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                <div>
                  <div className="font-medium">Ethereum (Sepolia Testnet)</div>
                  <div className="text-xs text-muted-foreground">
                    Instant crypto payment to your wallet
                  </div>
                </div>
              </div>
            </Label>
          </div>
        </RadioGroup>

        {payoutMethod === "SEPOLIA_ETH" && (
          <div className="space-y-3 pt-2">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs">
                This is a testnet. You'll receive test ETH that has no real value.
                For production, this would use Ethereum mainnet.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="ethAddress">Your Ethereum Wallet Address</Label>
              <Input
                id="ethAddress"
                placeholder="0x..."
                value={ethAddress}
                onChange={handleAddressChange}
                className={addressError ? "border-red-500" : ""}
              />
              {addressError && (
                <p className="text-xs text-red-500">{addressError}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Enter your Ethereum wallet address (must start with 0x)
              </p>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <strong>How to get an Ethereum address:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Install MetaMask browser extension</li>
                  <li>Create a new wallet</li>
                  <li>Copy your wallet address</li>
                  <li>Switch to Sepolia testnet in MetaMask</li>
                </ul>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {payoutMethod === "INR" && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Bank transfer details will be collected after item approval.
              Payment typically takes 2-3 business days.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
