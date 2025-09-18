import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Clock, MapPin, Truck, CheckCircle, Phone, MessageCircle, Package, ChefHat, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface OrderTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
}

interface OrderDetails {
  id: string;
  order_status: string;
  total_cents: number;
  estimated_delivery_time: string;
  created_at: string;
  delivery_address?: any;
  restaurants?: {
    name: string;
    phone?: string;
    address: string;
  };
}

const OrderTrackingModal: React.FC<OrderTrackingModalProps> = ({ isOpen, onClose, orderId }) => {
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && orderId) {
      fetchOrderDetails();
      
      // Set up real-time subscription
      const channel = supabase
        .channel(`order_${orderId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'orders',
            filter: `id=eq.${orderId}`
          },
          () => {
            fetchOrderDetails();
          }
        )
        .subscribe();

      // Auto-refresh every 30 seconds
      const interval = setInterval(() => {
        if (!refreshing) {
          fetchOrderDetails(true);
        }
      }, 30000);

      return () => {
        supabase.removeChannel(channel);
        clearInterval(interval);
      };
    }
  }, [isOpen, orderId]);

  const fetchOrderDetails = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_status,
          total_cents,
          estimated_delivery_time,
          created_at,
          delivery_address,
          driver_id,
          restaurants (
            name,
            phone,
            address
          )
        `)
        .eq('id', orderId)
        .single();

      if (error) {
        console.error('Error fetching order details:', error);
        toast({
          title: "Error loading order",
          description: "Please try again or contact support",
          variant: "destructive"
        });
        return;
      }
      
      setOrder(data);
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast({
        title: "Error loading order",
        description: "Please try again or contact support",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getStatusInfo = (status: string) => {
    const statusMap = {
      pending: { label: 'Order Placed', color: 'secondary', icon: Clock },
      confirmed: { label: 'Confirmed', color: 'secondary', icon: CheckCircle },
      preparing: { label: 'Being Prepared', color: 'secondary', icon: Clock },
      ready: { label: 'Ready for Pickup', color: 'secondary', icon: CheckCircle },
      picked_up: { label: 'Out for Delivery', color: 'default', icon: Truck },
      delivered: { label: 'Delivered', color: 'secondary', icon: CheckCircle },
      canceled: { label: 'Canceled', color: 'destructive', icon: Clock }
    };

    return statusMap[status as keyof typeof statusMap] || statusMap.pending;
  };

  const getProgressSteps = (currentStatus: string) => {
    const steps = [
      { key: 'pending', label: 'Order Placed', icon: Package },
      { key: 'confirmed', label: 'Confirmed', icon: CheckCircle },
      { key: 'preparing', label: 'Preparing', icon: ChefHat },
      { key: 'ready', label: 'Ready', icon: CheckCircle },
      { key: 'picked_up', label: 'Out for Delivery', icon: Truck },
      { key: 'delivered', label: 'Delivered', icon: CheckCircle }
    ];

    const currentIndex = steps.findIndex(step => step.key === currentStatus);
    
    return steps.map((step, index) => ({
      ...step,
      completed: index <= currentIndex,
      current: index === currentIndex
    }));
  };

  const getProgressPercentage = (currentStatus: string) => {
    const steps = ['pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'delivered'];
    const currentIndex = steps.findIndex(step => step === currentStatus);
    return currentIndex >= 0 ? ((currentIndex + 1) / steps.length) * 100 : 0;
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Track Your Order
            </DialogTitle>
            {refreshing && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            )}
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground">Loading order details...</p>
            </div>
          </div>
        ) : order ? (
          <div className="space-y-6">
            {/* Order Header */}
            <div className="text-center space-y-2">
              <h3 className="font-bold text-xl text-foreground">{order.restaurants?.name}</h3>
              <p className="text-muted-foreground">Order #{order.id.slice(0, 8).toUpperCase()}</p>
              <div className="flex items-center justify-center gap-2">
                <Badge variant={getStatusInfo(order.order_status).color as any} className="text-sm px-3 py-1">
                  {getStatusInfo(order.order_status).label}
                </Badge>
                {order.order_status === 'canceled' && (
                  <AlertCircle className="h-4 w-4 text-destructive" />
                )}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{Math.round(getProgressPercentage(order.order_status))}%</span>
              </div>
              <Progress value={getProgressPercentage(order.order_status)} className="h-2" />
            </div>

            {/* Progress Steps */}
            <div className="space-y-4">
              {getProgressSteps(order.order_status).map((step, index) => {
                const Icon = step.icon;
                return (
                  <div key={step.key} className="flex items-center space-x-4">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                      step.completed 
                        ? 'bg-primary border-primary text-primary-foreground' 
                        : step.current 
                          ? 'border-primary text-primary' 
                          : 'border-muted text-muted-foreground'
                    }`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <span className={`text-sm font-medium ${
                        step.completed 
                          ? 'text-foreground' 
                          : step.current 
                            ? 'text-foreground' 
                            : 'text-muted-foreground'
                      }`}>
                        {step.label}
                      </span>
                      {step.current && (
                        <p className="text-xs text-primary mt-1">Currently in progress</p>
                      )}
                    </div>
                    {step.completed && (
                      <CheckCircle className="h-4 w-4 text-primary" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Order Details */}
            <Card>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total</span>
                    <span className="font-medium">${(order.total_cents / 100).toFixed(2)}</span>
                  </div>
                  
                  {order.estimated_delivery_time && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Estimated Delivery</span>
                      <span className="font-medium">
                        {new Date(order.estimated_delivery_time).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
                  )}

                  {order.delivery_address && (
                    <div className="pt-2 border-t">
                      <div className="flex items-start space-x-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Delivery Address</p>
                          <p className="text-sm text-muted-foreground">
                            {typeof order.delivery_address === 'string' 
                              ? order.delivery_address 
                              : `${order.delivery_address.street}, ${order.delivery_address.city}`
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex space-x-2">
              {order.restaurants?.phone && (
                <Button variant="outline" size="sm" className="flex-1">
                  <Phone className="h-4 w-4 mr-2" />
                  Call Restaurant
                </Button>
              )}
              <Button variant="outline" size="sm" className="flex-1">
                <MessageCircle className="h-4 w-4 mr-2" />
                Chat Support
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Order not found</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default OrderTrackingModal;