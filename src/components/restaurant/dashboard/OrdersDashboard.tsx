import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, Search, ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";

const OrdersDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="w-full h-full bg-background">
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-6 py-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">Orders</h1>
              <p className="text-sm text-muted-foreground">
                Track all your orders from every channel in real-time. For even more transaction details, go to{" "}
                <button 
                  onClick={() => navigate('/merchant-portal')} 
                  className="text-primary hover:underline"
                >
                  Transactions
                </button>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Last updated 4 seconds ago</span>
                <button className="p-1 hover:bg-muted rounded">
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
              <Button 
                className="bg-primary hover:bg-primary/90"
                onClick={() => navigate('/restaurant/request-delivery')}
              >
                Request a delivery
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="bg-transparent border-b rounded-none w-full justify-start h-auto p-0">
              <TabsTrigger 
                value="active" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent"
              >
                Active
              </TabsTrigger>
              <TabsTrigger 
                value="scheduled"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent"
              >
                Scheduled
              </TabsTrigger>
              <TabsTrigger 
                value="history"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent"
              >
                History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="mt-6">
              {/* Filters */}
              <div className="flex items-center gap-4 mb-6">
                <Select defaultValue="all">
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All channels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All channels</SelectItem>
                    <SelectItem value="marketplace">Marketplace</SelectItem>
                    <SelectItem value="phone">Phone orders</SelectItem>
                    <SelectItem value="drive">Drive</SelectItem>
                  </SelectContent>
                </Select>

                <Select defaultValue="all-status">
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Order status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-status">Order status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="preparing">Preparing</SelectItem>
                    <SelectItem value="ready">Ready</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>

                <Select defaultValue="all-fulfillment">
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Fulfillment status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-fulfillment">Fulfillment status</SelectItem>
                    <SelectItem value="unfulfilled">Unfulfilled</SelectItem>
                    <SelectItem value="assigned">Assigned</SelectItem>
                    <SelectItem value="picked-up">Picked up</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                  </SelectContent>
                </Select>

                <button className="ml-auto p-2 hover:bg-muted rounded-lg">
                  <Search className="w-5 h-5" />
                </button>
              </div>

              {/* Empty State */}
              <div className="border rounded-lg bg-card">
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-40 h-40 mb-6">
                    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="50" y="140" width="20" height="20" rx="10" fill="#1F2937"/>
                      <rect x="130" y="140" width="20" height="20" rx="10" fill="#1F2937"/>
                      <path d="M60 60L70 140H130L140 60H60Z" fill="#EF4444"/>
                      <path d="M60 60L50 50L60 40L140 40L150 50L140 60H60Z" fill="#1F2937"/>
                      <rect x="75" y="75" width="50" height="40" rx="4" fill="#BFDBFE"/>
                      <ellipse cx="95" cy="90" rx="8" ry="6" fill="#F97316"/>
                      <rect x="100" y="85" width="4" height="20" fill="#10B981"/>
                      <path d="M102 85L110 75L115 80" stroke="#3B82F6" strokeWidth="2"/>
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold mb-2">No orders found</h3>
                  <p className="text-sm text-muted-foreground mb-8">
                    Try adjusting your search or filters
                  </p>
                  <p className="text-sm text-muted-foreground text-center max-w-md">
                    Missing an order?{" "}
                    <button className="text-primary hover:underline">Contact us</button>{" "}
                    and a support teammate will help add it to your account.
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="scheduled" className="mt-6">
              {/* Filters */}
              <div className="flex items-center gap-4 mb-6">
                <Select defaultValue="all">
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All channels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All channels</SelectItem>
                    <SelectItem value="marketplace">Marketplace</SelectItem>
                    <SelectItem value="phone">Phone orders</SelectItem>
                    <SelectItem value="drive">Drive</SelectItem>
                  </SelectContent>
                </Select>

                <button className="ml-auto p-2 hover:bg-muted rounded-lg">
                  <Search className="w-5 h-5" />
                </button>
              </div>

              {/* Empty State */}
              <div className="border rounded-lg bg-card">
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-40 h-40 mb-6">
                    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="50" y="140" width="20" height="20" rx="10" fill="#1F2937"/>
                      <rect x="130" y="140" width="20" height="20" rx="10" fill="#1F2937"/>
                      <path d="M60 60L70 140H130L140 60H60Z" fill="#EF4444"/>
                      <path d="M60 60L50 50L60 40L140 40L150 50L140 60H60Z" fill="#1F2937"/>
                      <rect x="75" y="75" width="50" height="40" rx="4" fill="#BFDBFE"/>
                      <ellipse cx="95" cy="90" rx="8" ry="6" fill="#F97316"/>
                      <rect x="100" y="85" width="4" height="20" fill="#10B981"/>
                      <path d="M102 85L110 75L115 80" stroke="#3B82F6" strokeWidth="2"/>
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold mb-2">No scheduled orders</h3>
                  <p className="text-sm text-muted-foreground">
                    Scheduled orders will appear here
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="history" className="mt-6">
              {/* Filters */}
              <div className="flex items-center gap-4 mb-6">
                <Select defaultValue="all">
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All channels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All channels</SelectItem>
                    <SelectItem value="marketplace">Marketplace</SelectItem>
                    <SelectItem value="phone">Phone orders</SelectItem>
                    <SelectItem value="drive">Drive</SelectItem>
                  </SelectContent>
                </Select>

                <Select defaultValue="all-status">
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Order status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-status">Order status</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>

                <button className="ml-auto p-2 hover:bg-muted rounded-lg">
                  <Search className="w-5 h-5" />
                </button>
              </div>

              {/* Empty State */}
              <div className="border rounded-lg bg-card">
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-40 h-40 mb-6">
                    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="50" y="140" width="20" height="20" rx="10" fill="#1F2937"/>
                      <rect x="130" y="140" width="20" height="20" rx="10" fill="#1F2937"/>
                      <path d="M60 60L70 140H130L140 60H60Z" fill="#EF4444"/>
                      <path d="M60 60L50 50L60 40L140 40L150 50L140 60H60Z" fill="#1F2937"/>
                      <rect x="75" y="75" width="50" height="40" rx="4" fill="#BFDBFE"/>
                      <ellipse cx="95" cy="90" rx="8" ry="6" fill="#F97316"/>
                      <rect x="100" y="85" width="4" height="20" fill="#10B981"/>
                      <path d="M102 85L110 75L115 80" stroke="#3B82F6" strokeWidth="2"/>
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold mb-2">No order history</h3>
                  <p className="text-sm text-muted-foreground">
                    Completed and cancelled orders will appear here
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default OrdersDashboard;
