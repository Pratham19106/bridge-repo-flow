import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ExternalLink, ArrowUpRight, Clock, CheckCircle2, XCircle } from "lucide-react";
import { useEthConversion } from "@/hooks/useEthConversion";

interface Transaction {
  id: string;
  blockchain_tx_hash: string | null;
  status: string | null;
  payout_amount_eth: number | null;
  payout_amount_inr: number;
  currency_conversion_rate: number | null;
  gas_used: number | null;
  gas_price_gwei: number | null;
  from_address: string | null;
  to_address: string | null;
  payment_method: string;
  completed_at: string | null;
  created_at: string | null;
  failure_reason: string | null;
}

const TransactionHistory = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { ethToInr } = useEthConversion();

  useEffect(() => {
    if (!user) return;

    const fetchTransactions = async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select(`
          *,
          items!inner(seller_id)
        `)
        .eq("items.seller_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching transactions:", error);
      } else if (data) {
        setTransactions(data);
      }
      setLoading(false);
    };

    fetchTransactions();

    const channel = supabase
      .channel("user-transactions")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "transactions",
        },
        () => {
          fetchTransactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case "failed":
        return <XCircle className="w-5 h-5 text-destructive" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500 hover:bg-green-600">Confirmed</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-muted-foreground">No transaction history yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>Transaction History</span>
            <Badge variant="outline">{transactions.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {transactions.map((tx) => (
            <div
              key={tx.id}
              className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="mt-1">{getStatusIcon(tx.status)}</div>
              
              <div className="flex-1 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {tx.payment_method === "ETH" ? "ETH Payout" : "INR Payout"}
                      </span>
                      {getStatusBadge(tx.status)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(tx.completed_at || tx.created_at)}
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-bold text-lg">
                      {tx.payment_method === "ETH" ? (
                        <span className="text-primary font-mono">
                          -{tx.payout_amount_eth?.toFixed(6)} ETH
                        </span>
                      ) : (
                        <span>-Rs {tx.payout_amount_inr}</span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {tx.payment_method === "ETH" ? (
                        <span>-Rs {tx.payout_amount_inr.toFixed(2)}</span>
                      ) : (
                        tx.payout_amount_eth && (
                          <span className="font-mono">
                            -{tx.payout_amount_eth.toFixed(6)} ETH
                          </span>
                        )
                      )}
                    </div>
                  </div>
                </div>

                {tx.blockchain_tx_hash && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground">Transaction:</span>
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-xs font-mono"
                      asChild
                    >
                      <a
                        href={`https://sepolia.etherscan.io/tx/${tx.blockchain_tx_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1"
                      >
                        {tx.blockchain_tx_hash.slice(0, 10)}...
                        {tx.blockchain_tx_hash.slice(-8)}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </Button>
                  </div>
                )}

                {tx.to_address && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground">To:</span>
                    <span className="font-mono text-xs">
                      {tx.to_address.slice(0, 10)}...{tx.to_address.slice(-8)}
                    </span>
                  </div>
                )}

                {tx.gas_used && tx.gas_price_gwei && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Gas: {tx.gas_used.toLocaleString()} units</span>
                    <span>•</span>
                    <span>{tx.gas_price_gwei} Gwei</span>
                  </div>
                )}

                {tx.failure_reason && (
                  <div className="text-xs text-destructive mt-2">
                    Failed: {tx.failure_reason}
                  </div>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionHistory;
