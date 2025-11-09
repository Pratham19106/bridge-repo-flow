import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClipboardList, DollarSign, Users, FileText, Package } from "lucide-react";
import PendingItems from "./official/PendingItems";
import AllItems from "./official/AllItems";
import Financials from "./official/Financials";
import AllUsers from "./official/AllUsers";
import AuditLogs from "./official/AuditLogs";
import CompanyProducts from "./official/CompanyProducts";

const OfficialDashboard = () => {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-6 max-w-6xl mx-auto">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4" />
            Pending
          </TabsTrigger>
          <TabsTrigger value="all" className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4" />
            All Items
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Products
          </TabsTrigger>
          <TabsTrigger value="financials" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Financials
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Audit Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          <PendingItems />
        </TabsContent>

        <TabsContent value="all" className="mt-6">
          <AllItems />
        </TabsContent>

        <TabsContent value="products" className="mt-6">
          <CompanyProducts />
        </TabsContent>

        <TabsContent value="financials" className="mt-6">
          <Financials />
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <AllUsers />
        </TabsContent>

        <TabsContent value="audit" className="mt-6">
          <AuditLogs />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OfficialDashboard;
