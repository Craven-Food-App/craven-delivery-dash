import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Ban, CheckCircle, XCircle, DollarSign, ShoppingBag, Clock, AlertTriangle, Search, Mail, Phone, MapPin, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Customer {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  status: 'active' | 'suspended' | 'banned';
  created_at: string;
  last_order_at?: string;
  total_orders: number;
  total_spent_cents: number;
  average_rating?: number;
  suspension_reason?: string;
  suspension_until?: string;
}

interface CustomerOrder {
  id: string;
  order_number: string;
  created_at: string;
  total_cents: number;
  order_status: string;
  restaurant_name: string;
}

export const CustomerManagement: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerOrders, setCustomerOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [suspensionReason, setSuspensionReason] = useState('');
  const [suspensionDays, setSuspensionDays] = useState('7');
  const [actionInProgress, setActionInProgress] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (selectedCustomer) {
      fetchCustomerOrders(selectedCustomer.id);
    }
  }, [selectedCustomer]);

  const fetchCustomers = async () => {
    try {
      // Fetch all users who have placed orders (these are customers)
      const { data: customerIds, error: orderError } = await supabase
        .from('orders')
        .select('customer_id')
        .order('created_at', { ascending: false });

      if (orderError) {
        console.error('Error fetching order customer IDs:', orderError);
        // Fallback: fetch all users if orders table has issues
        const { data: allUsers, error: allUsersError } = await supabase
          .from('user_profiles')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);
        
        if (allUsersError) throw allUsersError;
        
        const customersWithStats = (allUsers || []).map(user => ({
          id: user.id,
          email: user.email || '',
          full_name: user.full_name || 'Unknown',
          phone: user.phone,
          status: user.account_status || 'active',
          created_at: user.created_at,
          last_order_at: undefined,
          total_orders: 0,
          total_spent_cents: 0,
          suspension_reason: user.suspension_reason,
          suspension_until: user.suspension_until
        }));
        
        setCustomers(customersWithStats);
        setLoading(false);
        return;
      }

      // Get unique customer IDs
      const uniqueCustomerIds = [...new Set((customerIds || []).map(o => o.customer_id).filter(Boolean))];

      if (uniqueCustomerIds.length === 0) {
        // No customers with orders yet, show all users
        const { data: allUsers, error: allUsersError } = await supabase
          .from('user_profiles')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);
        
        if (allUsersError) throw allUsersError;
        
        const customersWithStats = (allUsers || []).map(user => ({
          id: user.id,
          email: user.email || '',
          full_name: user.full_name || 'Unknown',
          phone: user.phone,
          status: user.account_status || 'active',
          created_at: user.created_at,
          last_order_at: undefined,
          total_orders: 0,
          total_spent_cents: 0,
          suspension_reason: user.suspension_reason,
          suspension_until: user.suspension_until
        }));
        
        setCustomers(customersWithStats);
        setLoading(false);
        return;
      }

      // Fetch user profiles for these customers
      const { data: users, error: usersError } = await supabase
        .from('user_profiles')
        .select('*')
        .in('user_id', uniqueCustomerIds);

      if (usersError) throw usersError;

      // Fetch order stats for each customer
      const customersWithStats = await Promise.all(
        (users || []).map(async (user) => {
          const { data: orders } = await supabase
            .from('orders')
            .select('id, total_cents, created_at')
            .eq('customer_id', user.user_id);

          const totalOrders = orders?.length || 0;
          const totalSpent = orders?.reduce((sum, order) => sum + order.total_cents, 0) || 0;
          const lastOrder = orders?.[0]?.created_at;

          return {
            id: user.user_id,
            email: user.email || '',
            full_name: user.full_name || 'Unknown',
            phone: user.phone,
            status: user.account_status || 'active',
            created_at: user.created_at,
            last_order_at: lastOrder,
            total_orders: totalOrders,
            total_spent_cents: totalSpent,
            suspension_reason: user.suspension_reason,
            suspension_until: user.suspension_until
          };
        })
      );

      setCustomers(customersWithStats);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast({
        title: 'Error loading customers',
        description: 'Failed to load customer data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerOrders = async (customerId: string) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          created_at,
          total_cents,
          order_status,
          restaurants (name)
        `)
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      const formattedOrders = (data || []).map((order: any) => ({
        ...order,
        restaurant_name: order.restaurants?.name || 'Unknown'
      }));

      setCustomerOrders(formattedOrders);
    } catch (error) {
      console.error('Error fetching customer orders:', error);
    }
  };

  const handleSuspendCustomer = async (customerId: string, temporary: boolean = true) => {
    if (!suspensionReason.trim()) {
      toast({
        title: 'Reason required',
        description: 'Please provide a reason for suspension',
        variant: 'destructive'
      });
      return;
    }

    setActionInProgress(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const suspensionUntil = temporary
        ? new Date(Date.now() + parseInt(suspensionDays) * 24 * 60 * 60 * 1000).toISOString()
        : null;

      const { error } = await supabase
        .from('user_profiles')
        .update({
          account_status: temporary ? 'suspended' : 'banned',
          suspension_reason: suspensionReason,
          suspension_until: suspensionUntil
        })
        .eq('user_id', customerId);

      if (error) throw error;

      // Create audit log
      await supabase.from('admin_audit_logs').insert({
        admin_id: user.id,
        action: temporary ? 'customer_suspended' : 'customer_banned',
        entity_type: 'customer',
        entity_id: customerId,
        details: {
          reason: suspensionReason,
          until: suspensionUntil
        }
      });

      toast({
        title: temporary ? 'Customer suspended' : 'Customer banned',
        description: `Account has been ${temporary ? 'suspended' : 'banned'} successfully`
      });

      setSuspensionReason('');
      setSuspensionDays('7');
      setSelectedCustomer(null);
      fetchCustomers();
    } catch (error) {
      console.error('Error suspending customer:', error);
      toast({
        title: 'Error',
        description: 'Failed to suspend customer account',
        variant: 'destructive'
      });
    } finally {
      setActionInProgress(false);
    }
  };

  const handleReinstateCustomer = async (customerId: string) => {
    setActionInProgress(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_profiles')
        .update({
          account_status: 'active',
          suspension_reason: null,
          suspension_until: null
        })
        .eq('user_id', customerId);

      if (error) throw error;

      // Create audit log
      await supabase.from('admin_audit_logs').insert({
        admin_id: user.id,
        action: 'customer_reinstated',
        entity_type: 'customer',
        entity_id: customerId
      });

      toast({
        title: 'Customer reinstated',
        description: 'Account has been reactivated successfully'
      });

      setSelectedCustomer(null);
      fetchCustomers();
    } catch (error) {
      console.error('Error reinstating customer:', error);
      toast({
        title: 'Error',
        description: 'Failed to reinstate customer account',
        variant: 'destructive'
      });
    } finally {
      setActionInProgress(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any }> = {
      active: { variant: 'default', icon: CheckCircle },
      suspended: { variant: 'secondary', icon: Clock },
      banned: { variant: 'destructive', icon: Ban }
    };

    const config = variants[status] || variants.active;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant as any} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = searchTerm === '' ||
      customer.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filterStatus === 'all' || customer.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  const activeCustomers = customers.filter(c => c.status === 'active');
  const suspendedCustomers = customers.filter(c => c.status === 'suspended');
  const bannedCustomers = customers.filter(c => c.status === 'banned');
  const totalRevenue = customers.reduce((sum, c) => sum + c.total_spent_cents, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold">Customer Management</h2>
        <p className="text-muted-foreground">Manage customer accounts and view customer history</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <User className="h-4 w-4 text-green-500" />
              Active Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeCustomers.length}</div>
            <p className="text-xs text-muted-foreground">In good standing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              Suspended
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{suspendedCustomers.length}</div>
            <p className="text-xs text-muted-foreground">Temporarily suspended</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Ban className="h-4 w-4 text-red-500" />
              Banned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{bannedCustomers.length}</div>
            <p className="text-xs text-muted-foreground">Permanently banned</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-blue-500" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              ${(totalRevenue / 100).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant={filterStatus === 'all' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('all')}
          >
            All
          </Button>
          <Button
            variant={filterStatus === 'active' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('active')}
          >
            Active
          </Button>
          <Button
            variant={filterStatus === 'suspended' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('suspended')}
          >
            Suspended
          </Button>
          <Button
            variant={filterStatus === 'banned' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('banned')}
          >
            Banned
          </Button>
        </div>
      </div>

      {/* Customers List */}
      <div className="grid gap-4">
        {filteredCustomers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No customers found</p>
            </CardContent>
          </Card>
        ) : (
          filteredCustomers.map((customer) => (
            <Card key={customer.id} className="border">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{customer.full_name}</h4>
                        <p className="text-sm text-muted-foreground">{customer.email}</p>
                      </div>
                      {getStatusBadge(customer.status)}
                    </div>

                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Total Orders:</span>
                        <p className="font-medium">{customer.total_orders}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Total Spent:</span>
                        <p className="font-medium">${(customer.total_spent_cents / 100).toFixed(2)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Member Since:</span>
                        <p className="font-medium">{format(new Date(customer.created_at), 'MMM yyyy')}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Last Order:</span>
                        <p className="font-medium">
                          {customer.last_order_at 
                            ? format(new Date(customer.last_order_at), 'MMM dd, yyyy')
                            : 'Never'}
                        </p>
                      </div>
                    </div>

                    {customer.suspension_reason && (
                      <div className="text-sm bg-yellow-50 border border-yellow-200 p-3 rounded-md">
                        <span className="font-medium text-yellow-800">Suspension Reason:</span>
                        <p className="mt-1 text-yellow-700">{customer.suspension_reason}</p>
                        {customer.suspension_until && (
                          <p className="mt-1 text-xs text-yellow-600">
                            Until: {format(new Date(customer.suspension_until), 'PPp')}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="ml-4">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button onClick={() => setSelectedCustomer(customer)}>
                          View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Customer Details</DialogTitle>
                          <DialogDescription>{customer.full_name} - {customer.email}</DialogDescription>
                        </DialogHeader>

                        <Tabs defaultValue="info" className="w-full">
                          <TabsList>
                            <TabsTrigger value="info">Information</TabsTrigger>
                            <TabsTrigger value="orders">Order History</TabsTrigger>
                            <TabsTrigger value="actions">Account Actions</TabsTrigger>
                          </TabsList>

                          <TabsContent value="info" className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Full Name</Label>
                                <p className="text-sm font-medium mt-1">{customer.full_name}</p>
                              </div>
                              <div>
                                <Label>Email</Label>
                                <p className="text-sm font-medium mt-1">{customer.email}</p>
                              </div>
                              <div>
                                <Label>Phone</Label>
                                <p className="text-sm font-medium mt-1">{customer.phone || 'Not provided'}</p>
                              </div>
                              <div>
                                <Label>Status</Label>
                                <div className="mt-1">{getStatusBadge(customer.status)}</div>
                              </div>
                              <div>
                                <Label>Total Orders</Label>
                                <p className="text-sm font-medium mt-1">{customer.total_orders}</p>
                              </div>
                              <div>
                                <Label>Total Spent</Label>
                                <p className="text-sm font-medium mt-1">
                                  ${(customer.total_spent_cents / 100).toFixed(2)}
                                </p>
                              </div>
                              <div>
                                <Label>Average Order Value</Label>
                                <p className="text-sm font-medium mt-1">
                                  ${customer.total_orders > 0 
                                    ? ((customer.total_spent_cents / customer.total_orders) / 100).toFixed(2)
                                    : '0.00'}
                                </p>
                              </div>
                              <div>
                                <Label>Member Since</Label>
                                <p className="text-sm font-medium mt-1">
                                  {format(new Date(customer.created_at), 'PPP')}
                                </p>
                              </div>
                            </div>
                          </TabsContent>

                          <TabsContent value="orders" className="space-y-4">
                            <div className="space-y-2">
                              {customerOrders.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">No orders found</p>
                              ) : (
                                customerOrders.map((order) => (
                                  <Card key={order.id} className="border">
                                    <CardContent className="pt-4">
                                      <div className="flex items-center justify-between">
                                        <div>
                                          <p className="font-medium">Order #{order.order_number}</p>
                                          <p className="text-sm text-muted-foreground">
                                            {order.restaurant_name}
                                          </p>
                                          <p className="text-xs text-muted-foreground">
                                            {format(new Date(order.created_at), 'PPp')}
                                          </p>
                                        </div>
                                        <div className="text-right">
                                          <p className="font-medium">${(order.total_cents / 100).toFixed(2)}</p>
                                          <Badge>{order.order_status}</Badge>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))
                              )}
                            </div>
                          </TabsContent>

                          <TabsContent value="actions" className="space-y-4">
                            {customer.status === 'active' ? (
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="suspension-reason">Reason for Action</Label>
                                  <Textarea
                                    id="suspension-reason"
                                    placeholder="Explain why this action is being taken..."
                                    value={suspensionReason}
                                    onChange={(e) => setSuspensionReason(e.target.value)}
                                    rows={3}
                                  />
                                </div>

                                <div>
                                  <Label htmlFor="suspension-days">Suspension Duration (days)</Label>
                                  <Input
                                    id="suspension-days"
                                    type="number"
                                    value={suspensionDays}
                                    onChange={(e) => setSuspensionDays(e.target.value)}
                                    min="1"
                                    max="365"
                                  />
                                </div>

                                <div className="flex gap-3">
                                  <Button
                                    variant="secondary"
                                    onClick={() => handleSuspendCustomer(customer.id, true)}
                                    disabled={actionInProgress}
                                    className="flex-1"
                                  >
                                    <Clock className="h-4 w-4 mr-2" />
                                    Temporary Suspension
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    onClick={() => handleSuspendCustomer(customer.id, false)}
                                    disabled={actionInProgress}
                                    className="flex-1"
                                  >
                                    <Ban className="h-4 w-4 mr-2" />
                                    Permanent Ban
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md">
                                  <p className="font-medium text-yellow-800">Account Status: {customer.status}</p>
                                  {customer.suspension_reason && (
                                    <p className="text-sm text-yellow-700 mt-2">{customer.suspension_reason}</p>
                                  )}
                                </div>

                                <Button
                                  onClick={() => handleReinstateCustomer(customer.id)}
                                  disabled={actionInProgress}
                                  className="w-full"
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Reinstate Account
                                </Button>
                              </div>
                            )}
                          </TabsContent>
                        </Tabs>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default CustomerManagement;
