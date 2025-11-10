import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PriceInput } from "@/components/ui/price-input";
import { DualCurrencyDisplay } from "@/components/ui/DualCurrencyDisplay";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Upload, X, AlertCircle, CheckCircle2 } from "lucide-react";
import { convertInrToEth } from "@/services/cryptoTransactionService";

const SellItemForm = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState("");
  const [price, setPrice] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [payoutMethod, setPayoutMethod] = useState("INR");
  const [userWallet, setUserWallet] = useState<string | null>(null);
  const [walletLoading, setWalletLoading] = useState(true);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  // Fetch user's wallet from profile on component mount
  useEffect(() => {
    const fetchUserWallet = async () => {
      if (!user) {
        setWalletLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("wallet_address, is_crypto_verified")
          .eq("id", user.id)
          .single();

        if (error) {
          const errorMsg = error?.message || JSON.stringify(error);
          console.error("Error fetching wallet:", errorMsg);
          // Don't show toast - wallet might not be set yet, which is ok
          setUserWallet(null);
        } else if (data?.wallet_address) {
          console.log("✓ Wallet loaded:", data.wallet_address.slice(0, 6) + "...");
          setUserWallet(data.wallet_address);
        } else {
          console.warn("No wallet address found in profile");
          setUserWallet(null);
        }
      } catch (error: any) {
        const errorMsg = error?.message || JSON.stringify(error);
        console.error("Wallet fetch error:", errorMsg);
        setUserWallet(null);
      } finally {
        setWalletLoading(false);
      }
    };

    fetchUserWallet();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      // Validate wallet for crypto payout
      if (payoutMethod === "SEPOLIA_ETH" && !userWallet) {
        toast.error("Wallet not found. Please verify your MetaMask wallet in settings.");
        setLoading(false);
        return;
      }

      const { data: item, error: itemError} = await supabase
        .from("items")
        .insert({
          seller_id: user.id,
          category,
          condition,
          seller_quoted_price: parseFloat(price),
          payout_method: payoutMethod,
          seller_eth_address: payoutMethod === "SEPOLIA_ETH" ? userWallet : null,
        })
        .select()
        .single();

      if (itemError) throw itemError;

      if (files.length > 0 && item) {
        for (const file of files) {
          const fileExt = file.name.split(".").pop();
          const fileName = `${user.id}/${item.id}/${Math.random()}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from("item-media")
            .upload(fileName, file);

          if (uploadError) throw uploadError;

          await supabase.from("item_media").insert({
            item_id: item.id,
            file_path: fileName,
            file_type: file.type,
          });
        }
      }

      toast.success("Item submitted for valuation!");
      setCategory("");
      setCondition("");
      setPrice("");
      setFiles([]);
    } catch (error: any) {
      toast.error(error.message || "Error submitting item");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle>Submit Item for Valuation</CardTitle>
        <CardDescription>
          Provide details about your e-waste item. Our team will evaluate and make an offer.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              placeholder="e.g., Mobile, Laptop, TV, Tablet"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="condition">Condition</Label>
            <Select value={condition} onValueChange={setCondition} required>
              <SelectTrigger>
                <SelectValue placeholder="Select condition" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Working">Working</SelectItem>
                <SelectItem value="Repairable">Repairable</SelectItem>
                <SelectItem value="Scrap">Scrap</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <PriceInput
              id="price"
              label="Your Asking Price"
              placeholder="Enter your expected price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
              min="0"
              step="0.01"
            />
            {price && !isNaN(parseFloat(price)) && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-muted-foreground mb-2">Equivalent in Sepolia ETH:</p>
                <DualCurrencyDisplay
                  amountInr={parseFloat(price)}
                  variant="breakdown"
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="files">Upload Photos/Videos (Optional)</Label>
            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById("file-upload")?.click()}
                className="w-full"
              >
                <Upload className="w-4 h-4 mr-2" />
                Choose Files
              </Button>
              <input
                id="file-upload"
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
            {files.length > 0 && (
              <div className="space-y-2 mt-4">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                    <span className="text-sm truncate flex-1">{file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payout Method Selection */}
          <div className="space-y-3 border-t pt-4">
            <Label>Payout Method</Label>
            <div className="flex gap-3">
              <Button
                type="button"
                variant={payoutMethod === "INR" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setPayoutMethod("INR")}
              >
                💵 INR (Bank Transfer)
              </Button>
              <Button
                type="button"
                variant={payoutMethod === "SEPOLIA_ETH" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setPayoutMethod("SEPOLIA_ETH")}
              >
                ⟠ Sepolia ETH
              </Button>
            </div>

            {/* Wallet Info for ETH Payout */}
            {payoutMethod === "SEPOLIA_ETH" && (
              <div className="space-y-2">
                {walletLoading ? (
                  <Alert className="border-blue-200 bg-blue-50">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800 text-sm">
                      Loading your wallet...
                    </AlertDescription>
                  </Alert>
                ) : userWallet ? (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800 text-sm">
                      <div className="font-mono text-xs">
                        {userWallet.slice(0, 6)}...{userWallet.slice(-4)}
                      </div>
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800 text-sm">
                      Wallet not found. Please verify your MetaMask wallet in settings.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading || (payoutMethod === "SEPOLIA_ETH" && !userWallet)}
          >
            {loading ? "Submitting..." : "Submit Item"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default SellItemForm;
