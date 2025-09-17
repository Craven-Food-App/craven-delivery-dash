import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, MapPin, Truck, CheckCircle, Phone, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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

  useEffect(() => {
    if (isOpen && orderId) {
      fetchOrderDetails();
    }
  }, [isOpen, orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_status,
          total_cents,
          estimated_delivery_time,
          created_at,
          delivery_address,
          restaurants (
            name,
            phone,
            address
          )
        `)
        .eq('id', orderId)
        .single();

      if (error) throw error;
      setOrder(data);
    } catch (error) {
      console.error('Error fetching order details:', error);
    } finally {
      setLoading(false);
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
      { key: 'pending', label: 'Order Placed' },
      { key: 'confirmed', label: 'Confirmed' },
      { key: 'preparing', label: 'Preparing' },
      { key: 'ready', label: 'Ready' },
      { key: 'picked_up', label: 'Out for Delivery' },
      { key: 'delivered', label: 'Delivered' }
    ];

    const currentIndex = steps.findIndex(step => step.key === currentStatus);
    
    return steps.map((step, index) => ({
      ...step,
      completed: index <= currentIndex,
      current: index === currentIndex
    }));
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Track Your Order</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : order ? (
          <div className="space-y-6">
            {/* Order Header */}
            <div className="text-center">
              <h3 className="font-semibold text-lg">{order.restaurants?.name}</h3>
              <p className="text-sm text-muted-foreground">Order #{order.id.slice(0, 8)}</p>
              <Badge variant={getStatusInfo(order.order_status).color as any} className="mt-2">
                {getStatusInfo(order.order_status).label}
              </Badge>
            </div>

            {/* Progress Steps */}
            <div className="space-y-3">
              {getProgressSteps(order.order_status).map((step, index) => (
                <div key={step.key} className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    step.completed ? 'bg-primary' : step.current ? 'bg-primary/50' : 'bg-muted'
                  }`} />
                  <span className={`text-sm ${
                    step.completed ? 'text-foreground font-medium' : 
                    step.current ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {step.label}
                  </span>
                </div>
              ))}
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