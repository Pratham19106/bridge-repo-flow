import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const BuyerInterface = () => {
  const { user } = useAuth();
  const [searchCategory, setSearchCategory] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from("items")
        .select("*")
        .eq("status", "ready_to_sell");

      if (error) throw error;
      setItems(data || []);
    } catch (error: any) {
      toast.error("Failed to load items");
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = async (itemId: string) => {
    if (!user) {
      toast.error("Please sign in to purchase items");
      return;
    }

    try {
      const { error } = await supabase
        .from("items")
        .update({ 
          buyer_id: user.id,
          status: "sold",
          updated_at: new Date().toISOString()
        })
        .eq("id", itemId)
        .eq("status", "ready_to_sell");

      if (error) throw error;

      toast.success("Item purchased successfully!");
      fetchItems();
    } catch (error: any) {
      toast.error(error.message || "Failed to purchase item");
    }
  };

  if (!user) {
    return (
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle>Sign In Required</CardTitle>
          <CardDescription>Please sign in to browse and purchase items</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const categories = [...new Set(items.map((item) => item.category))];
  const filteredItems = searchCategory
    ? items.filter((item) => item.category.toLowerCase().includes(searchCategory.toLowerCase()))
    : items;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Browse Items</CardTitle>
          <CardDescription>Find refurbished items ready for purchase</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="search">Search by Category</Label>
            <Input
              id="search"
              placeholder="e.g., Mobile, Laptop"
              value={searchCategory}
              onChange={(e) => setSearchCategory(e.target.value)}
            />
          </div>

          {categories.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium">Available Categories:</p>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <Button
                    key={cat}
                    variant="outline"
                    size="sm"
                    onClick={() => setSearchCategory(cat)}
                  >
                    {cat}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Items Ready to Sell</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading items...</p>
          ) : filteredItems.length === 0 ? (
            <p className="text-muted-foreground">No items available for sale</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredItems.map((item) => (
                <Card key={item.id}>
                  <CardHeader>
                    <CardTitle>{item.category}</CardTitle>
                    <CardDescription>Condition: {item.condition}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-2xl font-bold">₹{item.selling_price}</p>
                    <Button onClick={() => handleBuy(item.id)} className="w-full">
                      Purchase
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BuyerInterface;
