import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Package, Warehouse, Truck, BarChart3, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { InventoryDashboard } from './components/InventoryDashboard';
import { ShippingQueue } from './components/ShippingQueue';
import { ActiveShipments } from './components/ActiveShipments';
import { ShippingAnalytics } from './components/ShippingAnalytics';

export function EnhancedTabletShippingDashboard() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [inventory, setInventory] = useState<any[]>([]);
  const [shipments, setShipments] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);

    try {
      // Fetch inventory
      const { data: inventoryData } = await supabase
        .from('tablet_inventory')
        .select('*')
        .order('created_at', { ascending: false });

      setInventory(inventoryData || []);

      // Fetch shipments
      const { data: shipmentsData } = await supabase
        .from('tablet_shipments')
        .select(`
          *,
          restaurant:restaurants(name, address, city, state, zip_code)
        `)
        .order('created_at', { ascending: false });

      setShipments(shipmentsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchData(true);
    toast.success('Data refreshed');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Package className="h-12 w-12 animate-pulse text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading tablet shipping system...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Tablet Shipping & Inventory Management
          </h2>
          <p className="text-muted-foreground mt-1">
            Enterprise logistics and inventory control system
          </p>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="inventory" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="inventory">
            <Warehouse className="h-4 w-4 mr-2" />
            Inventory
          </TabsTrigger>
          <TabsTrigger value="shipping-queue">
            <Package className="h-4 w-4 mr-2" />
            Shipping Queue
          </TabsTrigger>
          <TabsTrigger value="active-shipments">
            <Truck className="h-4 w-4 mr-2" />
            Active Shipments
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="mt-6">
          <InventoryDashboard 
            inventory={inventory}
            onRefresh={() => fetchData(true)}
          />
        </TabsContent>

        <TabsContent value="shipping-queue" className="mt-6">
          <ShippingQueue
            onRefresh={() => fetchData(true)}
          />
        </TabsContent>

        <TabsContent value="active-shipments" className="mt-6">
          <ActiveShipments
            shipments={shipments}
            onRefresh={() => fetchData(true)}
          />
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <ShippingAnalytics
            shipments={shipments}
            inventory={inventory}
          />
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <div className="text-center py-12">
            <Settings className="h-16 w-16 mx-auto text-muted-foreground opacity-50 mb-4" />
            <p className="text-muted-foreground">Warehouse and carrier settings coming soon</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

