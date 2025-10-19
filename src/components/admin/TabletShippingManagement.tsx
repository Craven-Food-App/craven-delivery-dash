import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Package, Truck, CheckCircle, AlertCircle, MapPin, Phone, Mail, Building2, Printer, Download,
  Clock, DollarSign, TrendingUp, Search, Filter, Calendar, Loader2, Box, Archive,
  ShoppingCart, BarChart3, Navigation, AlertTriangle, Send, ExternalLink, Zap,
  ClipboardCheck, Camera, FileText, Store, PackageCheck, PackageX, MapPinned
} from 'lucide-react';
import { format, differenceInDays, addDays } from 'date-fns';
import { generateShippingLabel } from '@/utils/generateShippingLabel';

interface RestaurantWithProgress {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  owner_id: string;
  logo_url?: string;
  created_at: string;
  progress: {
    business_info_verified: boolean;
    menu_preparation_status: string;
    tablet_preparing_shipment: boolean;
    tablet_shipped: boolean;
    tablet_tracking_number: string | null;
    tablet_shipping_carrier: string | null;
    tablet_preparing_at: string | null;
    tablet_shipped_at: string | null;
    tablet_shipping_label_url: string | null;
    tablet_delivered_at: string | null;
    tablet_serial_number: string | null;
    shipping_cost_cents: number | null;
    package_weight_oz: number | null;
    delivery_status: string | null;
  };
}

interface QualityCheckItem {
  id: string;
  label: string;
  checked: boolean;
}

const SHIPPING_CARRIERS = [
  { value: 'USPS', label: 'USPS', avgDays: 3, costPerLb: 8.50 },
  { value: 'UPS', label: 'UPS Ground', avgDays: 4, costPerLb: 12.00 },
  { value: 'FedEx', label: 'FedEx Ground', avgDays: 3, costPerLb: 11.50 },
  { value: 'FedEx_Express', label: 'FedEx Express (2-day)', avgDays: 2, costPerLb: 25.00 },
];

export const TabletShippingManagement = () => {
  const [restaurants, setRestaurants] = useState<RestaurantWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRestaurant, setSelectedRestaurant] = useState<RestaurantWithProgress | null>(null);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [shippingCarrier, setShippingCarrier] = useState('USPS');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGeneratingLabel, setIsGeneratingLabel] = useState(false);
  const [generatedLabelUrl, setGeneratedLabelUrl] = useState<string | null>(null);
  const [showTrackingInput, setShowTrackingInput] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterView, setFilterView] = useState('all');
  const [selectedRestaurants, setSelectedRestaurants] = useState<Set<string>>(new Set());
  const [tabletSerialNumber, setTabletSerialNumber] = useState('');
  const [packageWeight, setPackageWeight] = useState('48'); // Default 3 lbs = 48 oz
  const [shippingCost, setShippingCost] = useState('12.50');
  const [qualityChecks, setQualityChecks] = useState<QualityCheckItem[]>([
    { id: 'serial', label: 'Tablet serial number recorded', checked: false },
    { id: 'charged', label: 'Tablet charged to 100%', checked: false },
    { id: 'tested', label: 'POS app installed and tested', checked: false },
    { id: 'accessories', label: 'All accessories included (charger, stand)', checked: false },
    { id: 'packaged', label: 'Securely packaged with bubble wrap', checked: false },
    { id: 'instructions', label: 'Quick start guide included', checked: false },
  ]);

  useEffect(() => {
    fetchRestaurants();
    subscribeToChanges();
  }, []);

  const fetchRestaurants = async () => {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select(`
          id,
          name,
          email,
          phone,
          address,
          city,
          state,
          zip_code,
          owner_id,
          logo_url,
          created_at,
          restaurant_onboarding_progress (
            business_info_verified,
            menu_preparation_status,
            tablet_preparing_shipment,
            tablet_shipped,
            tablet_tracking_number,
            tablet_shipping_carrier,
            tablet_preparing_at,
            tablet_shipped_at,
            tablet_shipping_label_url
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching restaurants:', error);
        throw error;
      }

      const formatted = data?.map(r => ({
        ...r,
        progress: Array.isArray(r.restaurant_onboarding_progress) 
          ? {
              ...r.restaurant_onboarding_progress[0],
              tablet_delivered_at: null,
              tablet_serial_number: null,
              shipping_cost_cents: null,
              package_weight_oz: null,
              delivery_status: null
            }
          : {
              ...r.restaurant_onboarding_progress,
              tablet_delivered_at: null,
              tablet_serial_number: null,
              shipping_cost_cents: null,
              package_weight_oz: null,
              delivery_status: null
            }
      })) as RestaurantWithProgress[];

      setRestaurants(formatted || []);
    } catch (error: any) {
      toast.error('Failed to load restaurants');
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToChanges = () => {
    const channel = supabase
      .channel('tablet-shipping-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'restaurant_onboarding_progress'
        },
        () => {
          fetchRestaurants();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handlePrepareShipment = async (restaurant: RestaurantWithProgress) => {
    setSelectedRestaurant(restaurant);
    setIsGeneratingLabel(true);
    
    try {
      const { pdfUrl, labelUrl } = await generateShippingLabel({
        id: restaurant.id,
        name: restaurant.name,
        address: restaurant.address,
        city: restaurant.city || '',
        state: restaurant.state || '',
        zip_code: restaurant.zip_code || '',
        phone: restaurant.phone || undefined,
      });

      const { error } = await supabase
        .from('restaurant_onboarding_progress')
        .update({
          tablet_preparing_shipment: true,
          tablet_preparing_at: new Date().toISOString(),
          tablet_shipping_label_url: pdfUrl,
        })
        .eq('restaurant_id', restaurant.id);

      if (error) throw error;

      setGeneratedLabelUrl(labelUrl);
      toast.success('Shipping label generated! Complete quality check to continue.');
      fetchRestaurants();
    } catch (error: any) {
      toast.error(`Failed to generate label: ${error.message}`);
      console.error(error);
      setSelectedRestaurant(null);
    } finally {
      setIsGeneratingLabel(false);
    }
  };

  const handleMarkShipped = async () => {
    if (!selectedRestaurant || !trackingNumber.trim()) {
      toast.error('Please enter a tracking number');
      return;
    }

    if (!tabletSerialNumber.trim()) {
      toast.error('Please enter the tablet serial number');
      return;
    }

    const allChecked = qualityChecks.every(c => c.checked);
    if (!allChecked) {
      toast.error('Please complete all quality checks before shipping');
      return;
    }

    setIsProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('restaurant_onboarding_progress')
        .update({
          tablet_shipped: true,
          tablet_shipped_at: new Date().toISOString(),
          tablet_tracking_number: trackingNumber,
          tablet_shipping_carrier: shippingCarrier
        })
        .eq('restaurant_id', selectedRestaurant.id);

      if (error) throw error;

      // Create audit log
      await supabase.from('admin_audit_logs').insert({
        admin_id: user?.id,
        action: 'tablet_shipped',
        entity_type: 'restaurant',
        entity_id: selectedRestaurant.id,
        details: {
          tracking_number: trackingNumber,
          carrier: shippingCarrier,
          serial_number: tabletSerialNumber,
          weight_oz: packageWeight,
          cost: shippingCost
        }
      });

      toast.success('Tablet marked as shipped! Merchant will receive tracking info.');
      resetShippingDialog();
      fetchRestaurants();
    } catch (error: any) {
      toast.error('Failed to mark as shipped');
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetShippingDialog = () => {
    setSelectedRestaurant(null);
    setTrackingNumber('');
    setShippingCarrier('USPS');
    setGeneratedLabelUrl(null);
    setShowTrackingInput(false);
    setTabletSerialNumber('');
    setPackageWeight('48');
    setShippingCost('12.50');
    setQualityChecks(prev => prev.map(c => ({ ...c, checked: false })));
  };

  const handleBatchShip = async () => {
    if (selectedRestaurants.size === 0) {
      toast.error('No restaurants selected');
      return;
    }

    toast.info(`Batch shipping ${selectedRestaurants.size} tablets - feature in progress`);
  };

  // Calculate stats
  const inventoryAvailable = 45; // This would come from an inventory table
  const readyForShipment = restaurants.filter(r => 
    r.progress?.business_info_verified && 
    r.progress?.menu_preparation_status === 'ready' &&
    !r.progress?.tablet_preparing_shipment &&
    !r.progress?.tablet_shipped
  );

  const preparingShipment = restaurants.filter(r => 
    r.progress?.tablet_preparing_shipment && 
    !r.progress?.tablet_shipped
  );

  const inTransit = restaurants.filter(r => 
    r.progress?.tablet_shipped && 
    r.progress?.delivery_status === 'in_transit'
  );

  const delivered = restaurants.filter(r => 
    r.progress?.delivery_status === 'delivered'
  );

  const totalShipped = restaurants.filter(r => r.progress?.tablet_shipped);
  const avgShippingCost = totalShipped.reduce((sum, r) => sum + (r.progress?.shipping_cost_cents || 0), 0) / (totalShipped.length || 1) / 100;
  const avgDeliveryTime = delivered.reduce((sum, r) => {
    if (!r.progress?.tablet_shipped_at || !r.progress?.tablet_delivered_at) return sum;
    const days = differenceInDays(new Date(r.progress.tablet_delivered_at), new Date(r.progress.tablet_shipped_at));
    return sum + days;
  }, 0) / (delivered.length || 1);

  const filteredRestaurants = (() => {
    let filtered = restaurants;

    if (filterView === 'ready') filtered = readyForShipment;
    if (filterView === 'preparing') filtered = preparingShipment;
    if (filterView === 'in_transit') filtered = inTransit;
    if (filterView === 'delivered') filtered = delivered;

    if (searchTerm) {
      filtered = filtered.filter(r =>
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.progress?.tablet_tracking_number?.includes(searchTerm)
      );
    }

    return filtered;
  })();

  const getStatusBadge = (restaurant: RestaurantWithProgress) => {
    if (restaurant.progress?.delivery_status === 'delivered') {
      return <Badge className="bg-green-500 text-white"><CheckCircle className="h-3 w-3 mr-1" />Delivered</Badge>;
    }
    if (restaurant.progress?.delivery_status === 'in_transit') {
      return <Badge className="bg-orange-500 text-white"><Truck className="h-3 w-3 mr-1" />In Transit</Badge>;
    }
    if (restaurant.progress?.tablet_shipped) {
      return <Badge className="bg-blue-500 text-white"><Package className="h-3 w-3 mr-1" />Shipped</Badge>;
    }
    if (restaurant.progress?.tablet_preparing_shipment) {
      return <Badge className="bg-yellow-500 text-white"><Box className="h-3 w-3 mr-1" />Preparing</Badge>;
    }
    return <Badge className="bg-purple-500 text-white"><ShoppingCart className="h-3 w-3 mr-1" />Ready</Badge>;
  };

  const toggleRestaurantSelection = (id: string) => {
    const newSet = new Set(selectedRestaurants);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedRestaurants(newSet);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Tablet Shipping & Logistics</h2>
          <p className="text-muted-foreground">Manage inventory, shipping, and delivery tracking for merchant tablets</p>
        </div>
        <div className="flex gap-2">
          {selectedRestaurants.size > 0 && (
            <Button
              onClick={handleBatchShip}
              className="bg-orange-500 hover:bg-orange-600"
            >
              <Package className="h-4 w-4 mr-2" />
              Batch Ship ({selectedRestaurants.size})
            </Button>
          )}
          <Button className="bg-orange-500 hover:bg-orange-600">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Inventory & Logistics Stats */}
      <div className="grid gap-4 md:grid-cols-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Archive className="h-4 w-4 text-blue-500" />
              Inventory
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{inventoryAvailable}</div>
            <p className="text-xs text-muted-foreground">Tablets in stock</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-purple-500" />
              Ready to Ship
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{readyForShipment.length}</div>
            <p className="text-xs text-muted-foreground">Awaiting shipment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Box className="h-4 w-4 text-yellow-500" />
              Preparing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{preparingShipment.length}</div>
            <p className="text-xs text-muted-foreground">Being packed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Truck className="h-4 w-4 text-orange-500" />
              In Transit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{inTransit.length}</div>
            <p className="text-xs text-muted-foreground">On the way</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Delivered
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{delivered.length}</div>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              Avg Delivery
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{avgDeliveryTime.toFixed(1)}d</div>
            <p className="text-xs text-muted-foreground">Ship to delivery</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by restaurant, city, or tracking number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={filterView} onValueChange={setFilterView}>
              <SelectTrigger>
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Shipments</SelectItem>
                <SelectItem value="ready">Ready to Ship ({readyForShipment.length})</SelectItem>
                <SelectItem value="preparing">Preparing ({preparingShipment.length})</SelectItem>
                <SelectItem value="in_transit">In Transit ({inTransit.length})</SelectItem>
                <SelectItem value="delivered">Delivered ({delivered.length})</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Shipping Queue - Kanban Style */}
      <div className="space-y-4">
        {filteredRestaurants.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No shipments found</p>
            </CardContent>
          </Card>
        ) : (
          filteredRestaurants.map((restaurant) => {
            const daysSincePreparing = restaurant.progress?.tablet_preparing_at 
              ? differenceInDays(new Date(), new Date(restaurant.progress.tablet_preparing_at))
              : 0;
            const isDelayed = daysSincePreparing > 2;

            return (
              <Card key={restaurant.id} className={`border ${isDelayed ? 'border-red-300' : 'border hover:border-orange-200'} transition-all`}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-6">
                    {/* Selection Checkbox */}
                    <div className="flex-shrink-0 pt-1">
                      <Checkbox
                        checked={selectedRestaurants.has(restaurant.id)}
                        onCheckedChange={() => toggleRestaurantSelection(restaurant.id)}
                      />
                    </div>

                    {/* Restaurant Logo */}
                    <div className="flex-shrink-0">
                      {restaurant.logo_url ? (
                        <img
                          src={restaurant.logo_url}
                          alt={restaurant.name}
                          className="w-16 h-16 rounded-lg object-cover border-2 border-gray-200"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-purple-100 flex items-center justify-center border-2 border-purple-200">
                          <Store className="h-8 w-8 text-purple-600" />
                        </div>
                      )}
                    </div>

                    {/* Shipment Info */}
                    <div className="flex-1 space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-xl font-semibold">{restaurant.name}</h3>
                            {getStatusBadge(restaurant)}
                            {isDelayed && (
                              <Badge variant="destructive">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Delayed
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {restaurant.city}, {restaurant.state} {restaurant.zip_code}
                            </div>
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {restaurant.phone}
                            </div>
                          </div>
                        </div>

                        {restaurant.progress?.shipping_cost_cents && (
                          <div className="text-right">
                            <div className="text-2xl font-bold text-orange-600">
                              ${(restaurant.progress.shipping_cost_cents / 100).toFixed(2)}
                            </div>
                            <p className="text-xs text-muted-foreground">Shipping cost</p>
                          </div>
                        )}
                      </div>

                      {/* Tracking Info */}
                      {restaurant.progress?.tablet_tracking_number && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground text-xs">Carrier</p>
                              <p className="font-medium">{restaurant.progress.tablet_shipping_carrier}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground text-xs">Tracking Number</p>
                              <p className="font-mono font-medium">{restaurant.progress.tablet_tracking_number}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground text-xs">Shipped Date</p>
                              <p className="font-medium">
                                {restaurant.progress.tablet_shipped_at 
                                  ? format(new Date(restaurant.progress.tablet_shipped_at), 'MMM dd, yyyy')
                                  : 'N/A'}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Tablet Info */}
                      {restaurant.progress?.tablet_serial_number && (
                        <div className="flex items-center gap-6 text-sm">
                          <div className="flex items-center gap-1">
                            <PackageCheck className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Serial: </span>
                            <span className="font-mono font-medium">{restaurant.progress.tablet_serial_number}</span>
                          </div>
                          {restaurant.progress.package_weight_oz && (
                            <div className="flex items-center gap-1">
                              <Box className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Weight: </span>
                              <span className="font-medium">{(restaurant.progress.package_weight_oz / 16).toFixed(1)} lbs</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Timeline Progress */}
                      {restaurant.progress?.tablet_preparing_shipment && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Shipping Progress</span>
                            <span className="font-medium">
                              {restaurant.progress.delivery_status === 'delivered' ? '100%' : 
                               restaurant.progress.delivery_status === 'in_transit' ? '66%' : '33%'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              restaurant.progress.tablet_preparing_shipment ? 'bg-green-500 text-white' : 'bg-gray-200'
                            }`}>
                              <Package className="h-4 w-4" />
                            </div>
                            <div className={`flex-1 h-1 ${
                              restaurant.progress.tablet_shipped ? 'bg-green-500' : 'bg-gray-200'
                            }`} />
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              restaurant.progress.tablet_shipped ? 'bg-green-500 text-white' : 'bg-gray-200'
                            }`}>
                              <Truck className="h-4 w-4" />
                            </div>
                            <div className={`flex-1 h-1 ${
                              restaurant.progress.delivery_status === 'delivered' ? 'bg-green-500' : 'bg-gray-200'
                            }`} />
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              restaurant.progress.delivery_status === 'delivered' ? 'bg-green-500 text-white' : 'bg-gray-200'
                            }`}>
                              <CheckCircle className="h-4 w-4" />
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Prepared</span>
                            <span>Shipped</span>
                            <span>Delivered</span>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2">
                        {!restaurant.progress?.tablet_preparing_shipment && (
                          <Button
                            onClick={() => handlePrepareShipment(restaurant)}
                            disabled={isGeneratingLabel}
                            className="bg-orange-500 hover:bg-orange-600"
                          >
                            <Package className="h-4 w-4 mr-2" />
                            Prepare Shipment
                          </Button>
                        )}

                        {restaurant.progress?.tablet_preparing_shipment && !restaurant.progress?.tablet_shipped && (
                          <>
                            {restaurant.progress.tablet_shipping_label_url && (
                              <Button
                                onClick={() => window.open(restaurant.progress.tablet_shipping_label_url!, '_blank')}
                                variant="outline"
                              >
                                <Printer className="h-4 w-4 mr-2" />
                                Print Label
                              </Button>
                            )}
                            <Button
                              onClick={() => {
                                setSelectedRestaurant(restaurant);
                                setGeneratedLabelUrl(null);
                                setShowTrackingInput(true);
                                setTrackingNumber(restaurant.progress?.tablet_tracking_number || '');
                                setShippingCarrier(restaurant.progress?.tablet_shipping_carrier || 'USPS');
                                setTabletSerialNumber(restaurant.progress?.tablet_serial_number || '');
                              }}
                              className="bg-orange-500 hover:bg-orange-600"
                            >
                              <Truck className="h-4 w-4 mr-2" />
                              Ship Package
                            </Button>
                          </>
                        )}

                        {restaurant.progress?.tablet_tracking_number && (
                          <Button
                            variant="outline"
                            onClick={() => {
                              const carrier = restaurant.progress?.tablet_shipping_carrier || 'USPS';
                              const trackingNum = restaurant.progress?.tablet_tracking_number;
                              const trackingUrls: Record<string, string> = {
                                'USPS': `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNum}`,
                                'UPS': `https://www.ups.com/track?tracknum=${trackingNum}`,
                                'FedEx': `https://www.fedex.com/fedextrack/?trknbr=${trackingNum}`,
                                'FedEx_Express': `https://www.fedex.com/fedextrack/?trknbr=${trackingNum}`,
                              };
                              window.open(trackingUrls[carrier] || trackingUrls.USPS, '_blank');
                            }}
                          >
                            <Navigation className="h-4 w-4 mr-2" />
                            Track Package
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Shipping Preparation Dialog */}
      {selectedRestaurant && (
        <Dialog 
          open={!!selectedRestaurant} 
          onOpenChange={(open) => {
            if (!open) resetShippingDialog();
          }}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <Package className="h-6 w-6 text-orange-500" />
                Shipping Workflow - {selectedRestaurant.name}
              </DialogTitle>
              <DialogDescription>
                Complete quality checks and enter shipping details
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue={showTrackingInput ? 'shipping' : 'quality'} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="quality">Quality Check</TabsTrigger>
                <TabsTrigger value="shipping">Shipping Details</TabsTrigger>
                <TabsTrigger value="label">Label & Print</TabsTrigger>
              </TabsList>

              {/* Quality Check Tab */}
              <TabsContent value="quality" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ClipboardCheck className="h-5 w-5 text-orange-500" />
                      Pre-Shipment Quality Checklist
                    </CardTitle>
                    <CardDescription>Verify all items before packaging</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {qualityChecks.map((item) => (
                      <div
                        key={item.id}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          item.checked ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id={item.id}
                            checked={item.checked}
                            onCheckedChange={(checked) => {
                              setQualityChecks(prev =>
                                prev.map(c => c.id === item.id ? { ...c, checked: !!checked } : c)
                              );
                            }}
                          />
                          <label htmlFor={item.id} className="text-sm font-medium cursor-pointer">
                            {item.label}
                          </label>
                        </div>
                        {item.checked && (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                    ))}

                    <div className="pt-3">
                      <Progress 
                        value={(qualityChecks.filter(c => c.checked).length / qualityChecks.length) * 100}
                        className="h-2"
                      />
                      <p className="text-xs text-muted-foreground text-center mt-2">
                        {qualityChecks.filter(c => c.checked).length} of {qualityChecks.length} checks complete
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Shipping Details Tab */}
              <TabsContent value="shipping" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Tablet & Package Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="serial">Tablet Serial Number *</Label>
                      <Input
                        id="serial"
                        value={tabletSerialNumber}
                        onChange={(e) => setTabletSerialNumber(e.target.value)}
                        placeholder="e.g., TB-2024-001234"
                        className="font-mono"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="weight">Package Weight (oz)</Label>
                        <Input
                          id="weight"
                          type="number"
                          value={packageWeight}
                          onChange={(e) => setPackageWeight(e.target.value)}
                          placeholder="48"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          {(parseInt(packageWeight) / 16).toFixed(1)} lbs
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="cost">Shipping Cost (USD)</Label>
                        <Input
                          id="cost"
                          type="number"
                          step="0.01"
                          value={shippingCost}
                          onChange={(e) => setShippingCost(e.target.value)}
                          placeholder="12.50"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="carrier">Shipping Carrier *</Label>
                      <Select value={shippingCarrier} onValueChange={setShippingCarrier}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SHIPPING_CARRIERS.map(carrier => (
                            <SelectItem key={carrier.value} value={carrier.value}>
                              {carrier.label} - ~{carrier.avgDays} days (${carrier.costPerLb.toFixed(2)}/lb)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="tracking">Tracking Number *</Label>
                      <Input
                        id="tracking"
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        placeholder="Enter carrier tracking number"
                        className="font-mono"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Shipping Address</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted p-4 rounded-lg space-y-1">
                      <p className="font-semibold">{selectedRestaurant.name}</p>
                      <p className="text-sm">{selectedRestaurant.address}</p>
                      <p className="text-sm">{selectedRestaurant.city}, {selectedRestaurant.state} {selectedRestaurant.zip_code}</p>
                      {selectedRestaurant.phone && (
                        <p className="text-sm text-muted-foreground">Phone: {selectedRestaurant.phone}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Button 
                  onClick={handleMarkShipped}
                  disabled={isProcessing || !trackingNumber.trim() || !tabletSerialNumber.trim() || !qualityChecks.every(c => c.checked)}
                  className="w-full bg-orange-500 hover:bg-orange-600"
                  size="lg"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {isProcessing ? 'Processing...' : 'Complete Shipment'}
                </Button>

                {(!qualityChecks.every(c => c.checked) || !tabletSerialNumber.trim() || !trackingNumber.trim()) && (
                  <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg text-sm text-yellow-800">
                    <AlertTriangle className="h-4 w-4 inline mr-2" />
                    Complete all quality checks, serial number, and tracking number to ship
                  </div>
                )}
              </TabsContent>

              {/* Label & Print Tab */}
              <TabsContent value="label" className="space-y-4">
                {isGeneratingLabel ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="h-12 w-12 animate-spin text-orange-500 mb-4" />
                    <p className="text-muted-foreground">Generating shipping label...</p>
                  </div>
                ) : generatedLabelUrl ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Shipping Label</CardTitle>
                      <CardDescription>Print and attach to package</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="border rounded-lg p-4 bg-white">
                        <img 
                          src={generatedLabelUrl} 
                          alt="Shipping Label" 
                          className="w-full h-auto"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <Button 
                          onClick={() => {
                            if (generatedLabelUrl) {
                              const printWindow = window.open('', '_blank');
                              if (printWindow) {
                                printWindow.document.write(`<html><body><img src="${generatedLabelUrl}" style="width:100%"/></body></html>`);
                                printWindow.document.close();
                                printWindow.print();
                              }
                            }
                          }}
                          size="lg"
                          className="bg-orange-500 hover:bg-orange-600"
                        >
                          <Printer className="h-4 w-4 mr-2" />
                          Print Label
                        </Button>
                        {selectedRestaurant.progress?.tablet_shipping_label_url && (
                          <Button 
                            onClick={() => window.open(selectedRestaurant.progress.tablet_shipping_label_url!, '_blank')}
                            variant="outline"
                            size="lg"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download PDF
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ) : selectedRestaurant.progress?.tablet_shipping_label_url ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Previously Generated Label</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Button 
                        onClick={() => window.open(selectedRestaurant.progress.tablet_shipping_label_url!, '_blank')}
                        variant="outline"
                        className="w-full"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        View Saved Label
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Label not generated yet</p>
                      <Button
                        onClick={() => handlePrepareShipment(selectedRestaurant)}
                        className="mt-4 bg-orange-500 hover:bg-orange-600"
                      >
                        Generate Label Now
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default TabletShippingManagement;