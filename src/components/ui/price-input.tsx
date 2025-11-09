import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEthConversion } from "@/hooks/useEthConversion";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface PriceInputProps extends React.ComponentProps<"input"> {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  showEthConversion?: boolean;
}

const PriceInput = React.forwardRef<HTMLInputElement, PriceInputProps>(
  ({ label, value, onChange, showEthConversion = true, className, ...props }, ref) => {
    const { convertInrToEth, loading, ethToInr } = useEthConversion();
    
    const ethValue = React.useMemo(() => {
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue === 0) return 0;
      return convertInrToEth(numValue);
    }, [value, convertInrToEth]);

    return (
      <div className="space-y-2">
        <Label htmlFor={props.id}>{label}</Label>
        <div className="relative">
          <Input
            ref={ref}
            type="number"
            value={value}
            onChange={onChange}
            className={cn("pr-20", className)}
            {...props}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">
            Rs
          </div>
        </div>
        
        {showEthConversion && (
          <div className="flex items-center gap-2 text-sm">
            {loading ? (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Loading ETH rate...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">≈</span>
                  <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                    {ethValue.toFixed(6)} ETH
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  (1 ETH = ₹{ethToInr.toLocaleString()})
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);

PriceInput.displayName = "PriceInput";

export { PriceInput };
