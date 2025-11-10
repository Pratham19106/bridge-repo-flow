import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Copy, Wallet } from "lucide-react";
import { isValidEthereumAddress } from "@/services/walletService";
import { isMetaMaskInstalled, getCurrentAccount } from "@/services/metamaskService";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface WalletInputProps {
  value: string;
  onChange: (value: string) => void;
  onValidate?: (isValid: boolean) => void;
  disabled?: boolean;
  showHelp?: boolean;
}

/**
 * Wallet Input Component
 * Connects to MetaMask and allows users to select their wallet address
 */
export const WalletInput = ({
  value,
  onChange,
  onValidate,
  disabled = false,
  showHelp = true,
}: WalletInputProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const [metaMaskAccounts, setMetaMaskAccounts] = useState<string[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [metaMaskInstalled, setMetaMaskInstalled] = useState(false);

  const isValid = value.length > 0 && isValidEthereumAddress(value);
  const isEmpty = value.length === 0;

  // Check MetaMask installation on mount
  useEffect(() => {
    const installed = isMetaMaskInstalled();
    setMetaMaskInstalled(installed);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.trim();
    onChange(newValue);

    // Validate and notify parent
    const valid = newValue.length > 0 && isValidEthereumAddress(newValue);
    onValidate?.(valid);
  };

  const handleConnectMetaMask = async () => {
    if (!metaMaskInstalled) {
      toast.error("MetaMask is not installed. Please install it first.");
      return;
    }

    setIsConnecting(true);

    try {
      const { ethereum } = window as any;

      if (!ethereum) {
        throw new Error("MetaMask provider not found");
      }

      // Request accounts from MetaMask
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      if (accounts && accounts.length > 0) {
        setMetaMaskAccounts(accounts as string[]);
        toast.success(`Found ${accounts.length} account(s) in MetaMask`);
      } else {
        toast.error("No accounts found in MetaMask");
      }
    } catch (error: any) {
      if (error.code === 4001) {
        toast.error("You rejected the connection request");
      } else {
        toast.error(error.message || "Failed to connect to MetaMask");
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSelectAccount = (account: string) => {
    onChange(account);
    const valid = isValidEthereumAddress(account);
    onValidate?.(valid);
    toast.success("Account selected!");
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const trimmed = text.trim();
      onChange(trimmed);

      const valid = isValidEthereumAddress(trimmed);
      onValidate?.(valid);

      if (valid) {
        toast.success("Wallet address pasted and validated!");
      } else {
        toast.error("Invalid wallet address format");
      }
    } catch (error) {
      toast.error("Failed to paste from clipboard");
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    toast.success("Wallet address copied!");
  };

  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor="wallet-address" className="text-sm font-medium">
          MetaMask Wallet Address (Sepolia Testnet)
          <span className="text-red-500 ml-1">*</span>
        </Label>
        <p className="text-xs text-muted-foreground mt-1">
          Your Sepolia testnet wallet address where you'll receive ETH payments
        </p>
      </div>

      {/* MetaMask Connection Section */}
      {metaMaskInstalled && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 space-y-3">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-purple-600" />
            <p className="text-sm font-medium text-purple-900">Connect MetaMask</p>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleConnectMetaMask}
            disabled={isConnecting || disabled}
            className="w-full"
          >
            {isConnecting ? "Connecting..." : "🦊 Connect MetaMask"}
          </Button>

          {/* Account Selection Dropdown */}
          {metaMaskAccounts.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs">Select Account:</Label>
              <Select value={value} onValueChange={handleSelectAccount}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose an account..." />
                </SelectTrigger>
                <SelectContent>
                  {metaMaskAccounts.map((account) => (
                    <SelectItem key={account} value={account}>
                      <span className="font-mono text-sm">
                        {account.slice(0, 6)}...{account.slice(-4)}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}

      {/* Manual Input - Always Available */}
      <div>
        <Label htmlFor="wallet-address" className="text-xs text-muted-foreground mb-2 block">
          {metaMaskAccounts.length > 0 ? "Selected Address:" : "Enter Wallet Address:"}
        </Label>
        <div className="relative">
          <Input
            id="wallet-address"
            type="text"
            placeholder="0x1234567890123456789012345678901234567890"
            value={value}
            onChange={handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            disabled={disabled}
            className={`font-mono text-sm pr-20 ${
              !isEmpty && (isValid ? "border-green-500" : "border-red-500")
            }`}
          />

          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
            {!isEmpty && (
              <>
                {isValid ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                )}
              </>
            )}

            {value && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="h-8 w-8 p-0"
                title="Copy address"
              >
                <Copy className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Validation Messages */}
      {!isEmpty && (
        <>
          {isValid ? (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                ✓ Valid Ethereum address format
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                Invalid format. Must be 42 characters starting with 0x
              </AlertDescription>
            </Alert>
          )}
        </>
      )}

      {/* Help Section */}
      {showHelp && !metaMaskInstalled && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
          <p className="text-sm font-medium text-blue-900">MetaMask not detected</p>
          <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
            <li>Install MetaMask extension (https://metamask.io/)</li>
            <li>Create or import a wallet</li>
            <li>Switch to Sepolia Test Network</li>
            <li>Refresh this page</li>
          </ol>
        </div>
      )}

      {/* Paste Option */}
      {showHelp && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handlePaste}
          className="w-full text-xs"
          disabled={disabled}
        >
          📋 Or Paste Address from Clipboard
        </Button>
      )}

      {/* Format Info */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p>
          <strong>Format:</strong> 42 characters (0x + 40 hexadecimal characters)
        </p>
        <p>
          <strong>Example:</strong> 0x742d35Cc6634C0532925a3b844Bc9e7595f42e1
        </p>
      </div>
    </div>
  );
};
