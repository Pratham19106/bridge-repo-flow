import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, ShoppingCart, Receipt } from "lucide-react";
import SellItemForm from "./user/SellItemForm";
import MyListings from "./user/MyListings";
import BrowseItems from "./user/BrowseItems";
import TransactionHistory from "./user/TransactionHistory";

const UserDashboard = () => {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="sell" className="w-full">
        <TabsList className="grid w-full grid-cols-4 max-w-3xl mx-auto">
          <TabsTrigger value="sell" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Sell Items
          </TabsTrigger>
          <TabsTrigger value="my-items" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            My Listings
          </TabsTrigger>
          <TabsTrigger value="buy" className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" />
            Browse & Buy
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex items-center gap-2">
            <Receipt className="w-4 h-4" />
            Transactions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sell" className="mt-6">
          <SellItemForm />
        </TabsContent>

        <TabsContent value="my-items" className="mt-6">
          <MyListings />
        </TabsContent>

        <TabsContent value="buy" className="mt-6">
          <BrowseItems />
        </TabsContent>

        <TabsContent value="transactions" className="mt-6">
          <TransactionHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserDashboard;
