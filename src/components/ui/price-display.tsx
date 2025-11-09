import * as React from "react";
import { useEthConversion } from "@/hooks/useEthConversion";
import { Loader2 } from "lucide-react";

interface PriceDisplayProps {
  amount: number;
  showEth?: boolean;
  className?: string;
}

export const PriceDisplay: React.FC<PriceDisplayProps> = ({ 
  amount, 
  showEth = true,
  className = "" 
}) => {
  const { convertInrToEth, loading } = useEthConversion();
  
  const ethValue = React.useMemo(() => {
    if (amount === 0) return 0;
    return convertInrToEth(amount);
  }, [amount, convertInrToEth]);

  return (
    <div className={className}>
      <div className="font-medium">Rs {amount.toLocaleString()}</div>
      {showEth && amount > 0 && (
        <div className="text-xs mt-0.5">
          {loading ? (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Loader2 className="w-2.5 h-2.5 animate-spin" />
              <span>Loading...</span>
            </div>
          ) : (
            <span className="text-blue-600 dark:text-blue-400 font-mono">
              ≈ {ethValue.toFixed(6)} ETH
            </span>
          )}
        </div>
      )}
    </div>
  );
};
