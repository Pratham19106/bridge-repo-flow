import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Image as ImageIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Item {
  id: string;
  category: string;
  condition: string;
  selling_price: number;
  created_at: string;
  status: string;
}

interface ItemMedia {
  file_path: string;
  file_type: string;
}

const BrowseItems = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchCategory, setSearchCategory] = useState("");
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [mediaFiles, setMediaFiles] = useState<ItemMedia[]>([]);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);

  useEffect(() => {
    fetchItems();

    const channel = supabase
      .channel("browse-items")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "items",
        },
        () => {
          fetchItems();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchItems = async () => {
    const { data, error } = await supabase
      .from("items")
      .select("*")
      .in("status", ["ready_to_sell", "scrapped"])
      .order("created_at", { ascending: false });

    if (!error && data) {
      setItems(data);
    }
    setLoading(false);
  };

  const handleViewItem = async (item: Item) => {
    setSelectedItem(item);
    
    const { data: media } = await supabase
      .from("item_media")
      .select("*")
      .eq("item_id", item.id);

    if (media) {
      setMediaFiles(media);
      
      const urls = await Promise.all(
        media.map(async (m) => {
          const { data } = supabase.storage
            .from("item-media")
            .getPublicUrl(m.file_path);
          return data.publicUrl;
        })
      );
      
      setMediaUrls(urls);
    }
  };

  const handlePurchase = async (itemId: string, itemStatus: string) => {
    if (!user) {
      toast.error("You must be logged in to purchase");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("items")
        .update({
          status: "sold",
          buyer_id: user.id,
        })
        .eq("id", itemId)
        .in("status", ["ready_to_sell", "scrapped"])
        .select();

      if (error) {
        console.error("Purchase error:", error);
        toast.error("Failed to purchase item. Please try again.");
        return;
      }

      if (!data || data.length === 0) {
        toast.error("Item is no longer available for purchase");
        return;
      }

      toast.success(
        itemStatus === "scrapped" 
          ? "Scrap purchase request submitted successfully!" 
          : "Item purchased successfully!"
      );
      setSelectedItem(null);
      fetchItems();
    } catch (error: any) {
      console.error("Purchase failed:", error);
      toast.error("Error processing purchase");
    }
  };

  const productsForSale = items.filter(item => item.status === "ready_to_sell");
  const scrapItems = items.filter(item => item.status === "scrapped");

  const filteredProducts = searchCategory
    ? productsForSale.filter((item) =>
        item.category.toLowerCase().includes(searchCategory.toLowerCase())
      )
    : productsForSale;

  const filteredScrap = searchCategory
    ? scrapItems.filter((item) =>
        item.category.toLowerCase().includes(searchCategory.toLowerCase())
      )
    : scrapItems;

  const categories = [...new Set(items.map((item) => item.category))];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Search Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Search by category (e.g., Mobile, Laptop)"
            value={searchCategory}
            onChange={(e) => setSearchCategory(e.target.value)}
          />
          
          {categories.length > 0 && (
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
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="products" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="products">Products for Sale</TabsTrigger>
          <TabsTrigger value="scrap">Scrap (For Companies)</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="mt-6">
          {filteredProducts.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">No products available for sale</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredProducts.map((item) => (
                <Card key={item.id} className="shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{item.category}</CardTitle>
                    <p className="text-sm text-muted-foreground">{item.condition}</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-2xl font-bold text-primary">
                      Rs {item.selling_price}
                    </div>
                    <Button onClick={() => handleViewItem(item)} className="w-full" variant="outline">
                      <ImageIcon className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                    <Button 
                      onClick={() => handlePurchase(item.id, item.status)} 
                      className="w-full"
                    >
                      Purchase Item
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="scrap" className="mt-6">
          {filteredScrap.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">No scrap items available</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredScrap.map((item) => (
                <Card key={item.id} className="shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{item.category}</CardTitle>
                    <p className="text-sm text-muted-foreground">Scrap Material</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-xl font-bold text-destructive">
                      Available for Bulk Purchase
                    </div>
                    <Button onClick={() => handleViewItem(item)} className="w-full" variant="outline">
                      <ImageIcon className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                    <Button 
                      onClick={() => handlePurchase(item.id, item.status)} 
                      className="w-full"
                    >
                      Request Bulk Purchase
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedItem?.category}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Condition</p>
                <p className="font-medium">{selectedItem?.condition}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Price</p>
                <p className="text-2xl font-bold text-primary">
                  Rs {selectedItem?.selling_price}
                </p>
              </div>
            </div>
            
            {mediaUrls.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Media Files</p>
                <div className="grid grid-cols-2 gap-4">
                  {mediaUrls.map((url, index) => (
                    <div key={index} className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                      {mediaFiles[index]?.file_type.startsWith("image/") ? (
                        <img src={url} alt={`Item ${index + 1}`} className="w-full h-full object-cover" />
                      ) : (
                        <video src={url} controls className="w-full h-full" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <Button
              onClick={() => selectedItem && handlePurchase(selectedItem.id, selectedItem.status)}
              className="w-full"
            >
              {selectedItem?.status === "scrapped" ? "Request Bulk Purchase" : "Purchase Item"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BrowseItems;
