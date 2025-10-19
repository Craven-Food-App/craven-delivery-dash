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
  ClipboardCheck, Camera, FileText, Store, PackageCheck, PackageX, MapPinned,
  Plus, Minus, RotateCcw, Wrench, AlertTriangle as Alert, RefreshCw, Eye, Edit,
  Trash2, Copy, Download as DownloadIcon, Upload, Settings, Users, Activity
} from 'lucide-react';
import { format, differenceInDays, addDays } from 'date-fns';

interface Tablet {
  id: string;
  serial_number: string;
  model: string;
  status: 'available' | 'allocated' | 'shipped' | 'delivered' | 'returned' | 'repair' | 'retired';
  condition: 'new' | 'good' | 'fair' | 'poor' | 'damaged';
  warehouse_location: string | null;
  purchase_date: string;
  last_updated: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface TabletAllocation {
  id: string;
  tablet_id: string;
  restaurant_id: string;
  allocated_at: string;
  allocated_by: string | null;
  status: 'allocated' | 'shipped' | 'delivered' | 'returned';
  tracking_number: string | null;
  shipping_carrier: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  return_reason: string | null;
  returned_at: string | null;
  restaurant?: {
    id: string;
    name: string;
    address: string;
    city: string;
    state: string;
  };
}

interface TabletRepair {
  id: string;
  tablet_id: string;
  repair_type: 'hardware' | 'software' | 'screen' | 'battery' | 'other';
  description: string;
  cost_cents: number;
  repair_status: 'pending' | 'in_progress' | 'completed' | 'failed';
  assigned_technician: string | null;
  repair_notes: string | null;
  started_at: string | null;
  completed_at: string | null;
  tablet?: {
    serial_number: string;
  };
}

interface StockAlert {
  id: string;
  alert_type: 'low_stock' | 'out_of_stock' | 'overstock' | 'maintenance_due';
  threshold_value: number;
  current_value: number;
  is_active: boolean;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  created_at: string;
}

export const TabletInventoryManagement: React.FC = () => {
  const [tablets, setTablets] = useState<Tablet[]>([]);
  const [allocations, setAllocations] = useState<TabletAllocation[]>([]);
  const [repairs, setRepairs] = useState<TabletRepair[]>([]);
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('inventory');
  
  // Inventory management states
  const [selectedTablets, setSelectedTablets] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [conditionFilter, setConditionFilter] = useState('all');
  
  // Dialog states
  const [isAddTabletOpen, setIsAddTabletOpen] = useState(false);
  const [isBulkOperationOpen, setIsBulkOperationOpen] = useState(false);
  const [isRepairDialogOpen, setIsRepairDialogOpen] = useState(false);
  const [isAllocationDialogOpen, setIsAllocationDialogOpen] = useState(false);
  
  // Form states
  const [newTablet, setNewTablet] = useState({
    serial_number: '',
    model: 'CraveN-POS-Tablet',
    condition: 'new' as const,
    warehouse_location: '',
    notes: ''
  });
  
  const [bulkOperation, setBulkOperation] = useState({
    type: 'bulk_allocate' as const,
    name: '',
    notes: ''
  });
  
  const [repairData, setRepairData] = useState({
    tablet_id: '',
    repair_type: 'hardware' as const,
    description: '',
    cost_cents: 0,
    assigned_technician: '',
    repair_notes: ''
  });
  
  const [allocationData, setAllocationData] = useState({
    tablet_id: '',
    restaurant_id: '',
    tracking_number: '',
    shipping_carrier: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchTablets(),
        fetchAllocations(),
        fetchRepairs(),
        fetchAlerts()
      ]);
    } catch (error) {
      toast.error('Failed to load inventory data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTablets = async () => {
    const { data, error } = await supabase
      .from('tablet_inventory')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    setTablets(data || []);
  };

  const fetchAllocations = async () => {
    const { data, error } = await supabase
      .from('tablet_allocations')
      .select(`
        *,
        restaurant:restaurants(id, name, address, city, state)
      `)
      .order('allocated_at', { ascending: false });
    
    if (error) throw error;
    setAllocations(data || []);
  };

  const fetchRepairs = async () => {
    const { data, error } = await supabase
      .from('tablet_repairs')
      .select(`
        *,
        tablet:tablet_inventory(serial_number)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    setRepairs(data || []);
  };

  const fetchAlerts = async () => {
    const { data, error } = await supabase
      .from('tablet_stock_alerts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    setAlerts(data || []);
  };

  const handleAddTablet = async () => {
    if (!newTablet.serial_number.trim()) {
      toast.error('Serial number is required');
      return;
    }

    try {
      const { error } = await supabase
        .from('tablet_inventory')
        .insert([{
          serial_number: newTablet.serial_number,
          model: newTablet.model,
          condition: newTablet.condition,
          warehouse_location: newTablet.warehouse_location,
          notes: newTablet.notes
        }]);

      if (error) throw error;

      toast.success('Tablet added successfully');
      setIsAddTabletOpen(false);
      setNewTablet({
        serial_number: '',
        model: 'CraveN-POS-Tablet',
        condition: 'new',
        warehouse_location: '',
        notes: ''
      });
      fetchTablets();
    } catch (error: any) {
      toast.error(`Failed to add tablet: ${error.message}`);
    }
  };

  const handleBulkOperation = async () => {
    if (selectedTablets.length === 0) {
      toast.error('Please select tablets for bulk operation');
      return;
    }

    if (!bulkOperation.name.trim()) {
      toast.error('Operation name is required');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Create batch operation
      const { data: batchData, error: batchError } = await supabase
        .from('tablet_batch_operations')
        .insert([{
          operation_type: bulkOperation.type,
          batch_name: bulkOperation.name,
          tablet_count: selectedTablets.length,
          created_by: user?.id,
          notes: bulkOperation.notes
        }])
        .select()
        .single();

      if (batchError) throw batchError;

      // Create batch items
      const batchItems = selectedTablets.map(tabletId => ({
        batch_id: batchData.id,
        tablet_id: tabletId
      }));

      const { error: itemsError } = await supabase
        .from('tablet_batch_items')
        .insert(batchItems);

      if (itemsError) throw itemsError;

      toast.success(`Bulk operation "${bulkOperation.name}" created successfully`);
      setIsBulkOperationOpen(false);
      setSelectedTablets([]);
      setBulkOperation({
        type: 'bulk_allocate',
        name: '',
        notes: ''
      });
      fetchData();
    } catch (error: any) {
      toast.error(`Failed to create bulk operation: ${error.message}`);
    }
  };

  const handleRepairSubmit = async () => {
    if (!repairData.tablet_id || !repairData.description.trim()) {
      toast.error('Tablet and description are required');
      return;
    }

    try {
      const { error } = await supabase
        .from('tablet_repairs')
        .insert([{
          tablet_id: repairData.tablet_id,
          repair_type: repairData.repair_type,
          description: repairData.description,
          cost_cents: repairData.cost_cents,
          assigned_technician: repairData.assigned_technician,
          repair_notes: repairData.repair_notes
        }]);

      if (error) throw error;

      toast.success('Repair request created successfully');
      setIsRepairDialogOpen(false);
      setRepairData({
        tablet_id: '',
        repair_type: 'hardware',
        description: '',
        cost_cents: 0,
        assigned_technician: '',
        repair_notes: ''
      });
      fetchRepairs();
    } catch (error: any) {
      toast.error(`Failed to create repair request: ${error.message}`);
    }
  };

  const handleAllocationSubmit = async () => {
    if (!allocationData.tablet_id || !allocationData.restaurant_id) {
      toast.error('Tablet and restaurant are required');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('tablet_allocations')
        .insert([{
          tablet_id: allocationData.tablet_id,
          restaurant_id: allocationData.restaurant_id,
          allocated_by: user?.id,
          tracking_number: allocationData.tracking_number,
          shipping_carrier: allocationData.shipping_carrier
        }]);

      if (error) throw error;

      // Update tablet status
      await supabase
        .from('tablet_inventory')
        .update({ status: 'allocated' })
        .eq('id', allocationData.tablet_id);

      toast.success('Tablet allocated successfully');
      setIsAllocationDialogOpen(false);
      setAllocationData({
        tablet_id: '',
        restaurant_id: '',
        tracking_number: '',
        shipping_carrier: ''
      });
      fetchData();
    } catch (error: any) {
      toast.error(`Failed to allocate tablet: ${error.message}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500';
      case 'allocated': return 'bg-blue-500';
      case 'shipped': return 'bg-yellow-500';
      case 'delivered': return 'bg-purple-500';
      case 'returned': return 'bg-orange-500';
      case 'repair': return 'bg-red-500';
      case 'retired': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'new': return 'bg-green-100 text-green-800';
      case 'good': return 'bg-blue-100 text-blue-800';
      case 'fair': return 'bg-yellow-100 text-yellow-800';
      case 'poor': return 'bg-orange-100 text-orange-800';
      case 'damaged': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredTablets = tablets.filter(tablet => {
    const matchesSearch = tablet.serial_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tablet.model.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || tablet.status === statusFilter;
    const matchesCondition = conditionFilter === 'all' || tablet.condition === conditionFilter;
    
    return matchesSearch && matchesStatus && matchesCondition;
  });

  const inventoryStats = {
    total: tablets.length,
    available: tablets.filter(t => t.status === 'available').length,
    allocated: tablets.filter(t => t.status === 'allocated').length,
    shipped: tablets.filter(t => t.status === 'shipped').length,
    delivered: tablets.filter(t => t.status === 'delivered').length,
    repair: tablets.filter(t => t.status === 'repair').length,
    retired: tablets.filter(t => t.status === 'retired').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Tablet Inventory Management</h2>
          <p className="text-muted-foreground">Comprehensive tablet asset tracking and management system</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsAddTabletOpen(true)} className="bg-orange-600 hover:bg-orange-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Tablet
          </Button>
          <Button 
            onClick={() => setIsBulkOperationOpen(true)} 
            variant="outline"
            disabled={selectedTablets.length === 0}
          >
            <Package className="h-4 w-4 mr-2" />
            Bulk Operations ({selectedTablets.length})
          </Button>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{inventoryStats.total}</p>
              </div>
              <Package className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Available</p>
                <p className="text-2xl font-bold text-green-600">{inventoryStats.available}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Allocated</p>
                <p className="text-2xl font-bold text-blue-600">{inventoryStats.allocated}</p>
              </div>
              <Users className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Shipped</p>
                <p className="text-2xl font-bold text-yellow-600">{inventoryStats.shipped}</p>
              </div>
              <Truck className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Delivered</p>
                <p className="text-2xl font-bold text-purple-600">{inventoryStats.delivered}</p>
              </div>
              <PackageCheck className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Repair</p>
                <p className="text-2xl font-bold text-red-600">{inventoryStats.repair}</p>
              </div>
              <Wrench className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Retired</p>
                <p className="text-2xl font-bold text-gray-600">{inventoryStats.retired}</p>
              </div>
              <Archive className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="allocations">Allocations</TabsTrigger>
          <TabsTrigger value="repairs">Repairs</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        {/* Inventory Tab */}
        <TabsContent value="inventory" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex-1 min-w-64">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search tablets..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="allocated">Allocated</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="repair">Repair</SelectItem>
                    <SelectItem value="retired">Retired</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={conditionFilter} onValueChange={setConditionFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Condition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Condition</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                    <SelectItem value="poor">Poor</SelectItem>
                    <SelectItem value="damaged">Damaged</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Tablet List */}
          <div className="grid gap-4">
            {filteredTablets.map((tablet) => (
              <Card key={tablet.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Checkbox
                        checked={selectedTablets.includes(tablet.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedTablets([...selectedTablets, tablet.id]);
                          } else {
                            setSelectedTablets(selectedTablets.filter(id => id !== tablet.id));
                          }
                        }}
                      />
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold">{tablet.serial_number}</h3>
                          <Badge className={`${getStatusColor(tablet.status)} text-white`}>
                            {tablet.status}
                          </Badge>
                          <Badge className={getConditionColor(tablet.condition)}>
                            {tablet.condition}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {tablet.model} • {tablet.warehouse_location || 'No location'}
                        </p>
                        {tablet.notes && (
                          <p className="text-sm text-muted-foreground mt-1">{tablet.notes}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Allocations Tab */}
        <TabsContent value="allocations" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Tablet Allocations</h3>
            <Button onClick={() => setIsAllocationDialogOpen(true)} className="bg-orange-600 hover:bg-orange-700">
              <Plus className="h-4 w-4 mr-2" />
              New Allocation
            </Button>
          </div>
          
          <div className="grid gap-4">
            {allocations.map((allocation) => (
              <Card key={allocation.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">{allocation.restaurant?.name || 'Unknown Restaurant'}</h4>
                      <p className="text-sm text-muted-foreground">
                        {allocation.restaurant?.address}, {allocation.restaurant?.city}, {allocation.restaurant?.state}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Allocated: {format(new Date(allocation.allocated_at), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <Badge className={getStatusColor(allocation.status)}>
                      {allocation.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Repairs Tab */}
        <TabsContent value="repairs" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Repair Requests</h3>
            <Button onClick={() => setIsRepairDialogOpen(true)} className="bg-orange-600 hover:bg-orange-700">
              <Wrench className="h-4 w-4 mr-2" />
              New Repair
            </Button>
          </div>
          
          <div className="grid gap-4">
            {repairs.map((repair) => (
              <Card key={repair.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">{repair.tablet?.serial_number}</h4>
                      <p className="text-sm text-muted-foreground">{repair.description}</p>
                      <p className="text-sm text-muted-foreground">
                        Type: {repair.repair_type} • Cost: ${(repair.cost_cents / 100).toFixed(2)}
                      </p>
                    </div>
                    <Badge className={getStatusColor(repair.repair_status)}>
                      {repair.repair_status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <h3 className="text-lg font-semibold">Stock Alerts</h3>
          
          <div className="grid gap-4">
            {alerts.map((alert) => (
              <Card key={alert.id} className={alert.is_active ? 'border-orange-200 bg-orange-50' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold capitalize">{alert.alert_type.replace('_', ' ')}</h4>
                      <p className="text-sm text-muted-foreground">
                        Current: {alert.current_value} • Threshold: {alert.threshold_value}
                      </p>
                    </div>
                    <Badge className={alert.is_active ? 'bg-orange-500' : 'bg-gray-500'}>
                      {alert.is_active ? 'Active' : 'Acknowledged'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Tablet Dialog */}
      <Dialog open={isAddTabletOpen} onOpenChange={setIsAddTabletOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Tablet</DialogTitle>
            <DialogDescription>Add a new tablet to the inventory system</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="serial">Serial Number *</Label>
              <Input
                id="serial"
                value={newTablet.serial_number}
                onChange={(e) => setNewTablet({...newTablet, serial_number: e.target.value})}
                placeholder="Enter serial number"
              />
            </div>
            
            <div>
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                value={newTablet.model}
                onChange={(e) => setNewTablet({...newTablet, model: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="condition">Condition</Label>
              <Select value={newTablet.condition} onValueChange={(value: any) => setNewTablet({...newTablet, condition: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                  <SelectItem value="poor">Poor</SelectItem>
                  <SelectItem value="damaged">Damaged</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="location">Warehouse Location</Label>
              <Input
                id="location"
                value={newTablet.warehouse_location}
                onChange={(e) => setNewTablet({...newTablet, warehouse_location: e.target.value})}
                placeholder="Enter warehouse location"
              />
            </div>
            
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={newTablet.notes}
                onChange={(e) => setNewTablet({...newTablet, notes: e.target.value})}
                placeholder="Enter any notes"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsAddTabletOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddTablet} className="bg-orange-600 hover:bg-orange-700">
              Add Tablet
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Operations Dialog */}
      <Dialog open={isBulkOperationOpen} onOpenChange={setIsBulkOperationOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Operations</DialogTitle>
            <DialogDescription>Perform bulk operations on selected tablets</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="operation-type">Operation Type</Label>
              <Select value={bulkOperation.type} onValueChange={(value: any) => setBulkOperation({...bulkOperation, type: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bulk_allocate">Bulk Allocate</SelectItem>
                  <SelectItem value="bulk_ship">Bulk Ship</SelectItem>
                  <SelectItem value="bulk_return">Bulk Return</SelectItem>
                  <SelectItem value="bulk_repair">Bulk Repair</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="operation-name">Operation Name *</Label>
              <Input
                id="operation-name"
                value={bulkOperation.name}
                onChange={(e) => setBulkOperation({...bulkOperation, name: e.target.value})}
                placeholder="Enter operation name"
              />
            </div>
            
            <div>
              <Label htmlFor="operation-notes">Notes</Label>
              <Textarea
                id="operation-notes"
                value={bulkOperation.notes}
                onChange={(e) => setBulkOperation({...bulkOperation, notes: e.target.value})}
                placeholder="Enter operation notes"
              />
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Selected tablets: {selectedTablets.length}
              </p>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsBulkOperationOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkOperation} className="bg-orange-600 hover:bg-orange-700">
              Create Operation
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Repair Dialog */}
      <Dialog open={isRepairDialogOpen} onOpenChange={setIsRepairDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Repair Request</DialogTitle>
            <DialogDescription>Submit a tablet for repair</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="repair-tablet">Tablet *</Label>
              <Select value={repairData.tablet_id} onValueChange={(value) => setRepairData({...repairData, tablet_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select tablet" />
                </SelectTrigger>
                <SelectContent>
                  {tablets.map((tablet) => (
                    <SelectItem key={tablet.id} value={tablet.id}>
                      {tablet.serial_number} ({tablet.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="repair-type">Repair Type</Label>
              <Select value={repairData.repair_type} onValueChange={(value: any) => setRepairData({...repairData, repair_type: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hardware">Hardware</SelectItem>
                  <SelectItem value="software">Software</SelectItem>
                  <SelectItem value="screen">Screen</SelectItem>
                  <SelectItem value="battery">Battery</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="repair-description">Description *</Label>
              <Textarea
                id="repair-description"
                value={repairData.description}
                onChange={(e) => setRepairData({...repairData, description: e.target.value})}
                placeholder="Describe the issue"
              />
            </div>
            
            <div>
              <Label htmlFor="repair-cost">Cost (cents)</Label>
              <Input
                id="repair-cost"
                type="number"
                value={repairData.cost_cents}
                onChange={(e) => setRepairData({...repairData, cost_cents: parseInt(e.target.value) || 0})}
                placeholder="0"
              />
            </div>
            
            <div>
              <Label htmlFor="repair-technician">Assigned Technician</Label>
              <Input
                id="repair-technician"
                value={repairData.assigned_technician}
                onChange={(e) => setRepairData({...repairData, assigned_technician: e.target.value})}
                placeholder="Enter technician name"
              />
            </div>
            
            <div>
              <Label htmlFor="repair-notes">Repair Notes</Label>
              <Textarea
                id="repair-notes"
                value={repairData.repair_notes}
                onChange={(e) => setRepairData({...repairData, repair_notes: e.target.value})}
                placeholder="Additional notes"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsRepairDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRepairSubmit} className="bg-orange-600 hover:bg-orange-700">
              Submit Repair
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Allocation Dialog */}
      <Dialog open={isAllocationDialogOpen} onOpenChange={setIsAllocationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Allocate Tablet</DialogTitle>
            <DialogDescription>Assign a tablet to a restaurant</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="allocation-tablet">Tablet *</Label>
              <Select value={allocationData.tablet_id} onValueChange={(value) => setAllocationData({...allocationData, tablet_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select tablet" />
                </SelectTrigger>
                <SelectContent>
                  {tablets.filter(t => t.status === 'available').map((tablet) => (
                    <SelectItem key={tablet.id} value={tablet.id}>
                      {tablet.serial_number} ({tablet.condition})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="allocation-restaurant">Restaurant *</Label>
              <Select value={allocationData.restaurant_id} onValueChange={(value) => setAllocationData({...allocationData, restaurant_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select restaurant" />
                </SelectTrigger>
                <SelectContent>
                  {/* This would need to fetch restaurants */}
                  <SelectItem value="restaurant-1">Sample Restaurant 1</SelectItem>
                  <SelectItem value="restaurant-2">Sample Restaurant 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="allocation-tracking">Tracking Number</Label>
              <Input
                id="allocation-tracking"
                value={allocationData.tracking_number}
                onChange={(e) => setAllocationData({...allocationData, tracking_number: e.target.value})}
                placeholder="Enter tracking number"
              />
            </div>
            
            <div>
              <Label htmlFor="allocation-carrier">Shipping Carrier</Label>
              <Input
                id="allocation-carrier"
                value={allocationData.shipping_carrier}
                onChange={(e) => setAllocationData({...allocationData, shipping_carrier: e.target.value})}
                placeholder="Enter carrier name"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsAllocationDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAllocationSubmit} className="bg-orange-600 hover:bg-orange-700">
              Allocate Tablet
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
