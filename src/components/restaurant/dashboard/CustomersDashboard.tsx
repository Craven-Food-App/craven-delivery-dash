import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CustomerInsightsDashboard from "./customers/CustomerInsightsDashboard";
import RatingsReviewsDashboard from "./customers/RatingsReviewsDashboard";

const CustomersDashboard = () => {
  return (
    <div className="w-full h-full bg-background">
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold mb-4">Customers</h1>
          <Tabs defaultValue="insights" className="w-full">
            <TabsList className="bg-muted">
              <TabsTrigger value="insights">Customer Insights</TabsTrigger>
              <TabsTrigger value="ratings">Ratings & Reviews</TabsTrigger>
            </TabsList>

            <TabsContent value="insights" className="mt-6">
              <CustomerInsightsDashboard />
            </TabsContent>

            <TabsContent value="ratings" className="mt-6">
              <RatingsReviewsDashboard />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default CustomersDashboard;
