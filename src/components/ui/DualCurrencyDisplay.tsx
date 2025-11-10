import { formatDualCurrency, convertInrToEth } from "@/services/cryptoTransactionService";
import { Badge } from "@/components/ui/badge";

interface DualCurrencyDisplayProps {
  amountInr: number;
  amountEth?: number;
  variant?: "default" | "inline" | "badge" | "breakdown";
  className?: string;
}

/**
 * Displays amount in dual currency format (INR + ETH)
 */
export const DualCurrencyDisplay = ({
  amountInr,
  amountEth,
  variant = "default",
  className = "",
}: DualCurrencyDisplayProps) => {
  const eth = amountEth ?? convertInrToEth(amountInr);
  const formatted = formatDualCurrency(amountInr, eth);

  const formattedInr = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountInr);

  const formattedEth = eth.toFixed(8).replace(/\.?0+$/, "");

  if (variant === "inline") {
    return <span className={`font-mono ${className}`}>{formatted}</span>;
  }

  if (variant === "badge") {
    return (
      <Badge variant="outline" className={`font-mono ${className}`}>
        {formattedInr} / {formattedEth} ETH
      </Badge>
    );
  }

  if (variant === "breakdown") {
    return (
      <div className={`space-y-1 ${className}`}>
        <div className="text-sm">
          <span className="font-semibold">{formattedInr}</span>
        </div>
        <div className="text-xs text-muted-foreground">
          <span className="font-mono">{formattedEth} ETH</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="text-sm font-semibold">{formattedInr}</div>
      <div className="text-xs text-muted-foreground font-mono">
        {formattedEth} ETH
      </div>
    </div>
  );
};

/**
 * Inline dual currency display
 */
export const DualCurrencyInline = ({
  amountInr,
  amountEth,
  className = "",
}: Omit<DualCurrencyDisplayProps, "variant">) => (
  <DualCurrencyDisplay
    amountInr={amountInr}
    amountEth={amountEth}
    variant="inline"
    className={className}
  />
);

/**
 * Badge format dual currency display
 */
export const DualCurrencyBadge = ({
  amountInr,
  amountEth,
  className = "",
}: Omit<DualCurrencyDisplayProps, "variant">) => (
  <DualCurrencyDisplay
    amountInr={amountInr}
    amountEth={amountEth}
    variant="badge"
    className={className}
  />
);

/**
 * Breakdown format dual currency display
 */
export const PriceBreakdown = ({
  amountInr,
  amountEth,
  className = "",
}: Omit<DualCurrencyDisplayProps, "variant">) => (
  <DualCurrencyDisplay
    amountInr={amountInr}
    amountEth={amountEth}
    variant="breakdown"
    className={className}
  />
);
