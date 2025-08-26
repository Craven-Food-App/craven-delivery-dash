import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Bell, BellRing } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface NewOrderAlertProps {
  restaurantId: string;
}

export const NewOrderAlert = ({ restaurantId }: NewOrderAlertProps) => {
  const [hasNewOrders, setHasNewOrders] = useState(false);
  const [newOrderCount, setNewOrderCount] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Create audio element for ding sound
    audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhAS2ByPlslkMNDk2k5PH1lUcODk2k5PH1lUcODk2k5PH1lUcODk2k5PH1lUcODk2k5PH1lUcODk2k5PH1lUcODk2k5PH1lUcODk2k5PH1lUcODk2k5PH1lUcODk2k5PH1lUcODk2k5PH1lUcODk2k5PH1lUcODk2k5PH1lUcODk2k5PH1lUcODk2k5PH1lUcODk2k5PH1lUcODk2k5PH1lUcODk2k5PH1lUcODk2k5PH1lUcODk2k5PH1lUcODk2k5PH1lUcODk2k5PH1lUcODk2k5PH1lUcODk2k5PH1lUcODk2k5PH1lUcODk2k5PH1lUcODk2k5PH1lUcODk2k5PH1lUcODk2k5PH1lUcODk2k5PH1lUcODk2k5PH1lUcODk2k5PH1lUcODk2k5PH1lUcODk2k5PH1lUcODk2k5PH1lUcODk2k5PH1lUcODk2k5PH1lUcODk2k5PH1lUcODk2k5PH1lUcODk2k5PH1lUcODk2k5PH1lUcO');

    // Set up real-time subscription for new orders
    const channel = supabase
      .channel('restaurant-orders')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `restaurant_id=eq.${restaurantId}`
        },
        (payload) => {
          console.log('New order received:', payload);
          setHasNewOrders(true);
          setNewOrderCount(prev => prev + 1);
          
          // Play ding sound
          if (audioRef.current) {
            audioRef.current.volume = 0.8;
            audioRef.current.play().catch(console.error);
          }
          
          // Show toast notification
          toast({
            title: "🔔 New Order!",
            description: "You have received a new order. Check the Orders tab for details.",
            duration: 5000,
          });
        }
      )
      .subscribe();

    // Check for existing pending orders on mount
    const checkPendingOrders = async () => {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('id')
          .eq('restaurant_id', restaurantId)
          .eq('status', 'pending');
        
        if (!error && data && data.length > 0) {
          setHasNewOrders(true);
          setNewOrderCount(data.length);
        }
      } catch (err) {
        console.error('Error checking pending orders:', err);
      }
    };

    checkPendingOrders();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId, toast]);

  const handleClick = () => {
    setHasNewOrders(false);
    setNewOrderCount(0);
  };

  return (
    <div 
      className="flex items-center gap-2 cursor-pointer animate-pulse" 
      onClick={handleClick}
      title={hasNewOrders ? `${newOrderCount} new order(s)` : 'No new orders'}
    >
      {hasNewOrders ? (
        <>
          <BellRing className="h-6 w-6 text-primary animate-bounce" />
          <Badge variant="destructive" className="bg-red-500 text-white animate-pulse">
            {newOrderCount} New Order{newOrderCount !== 1 ? 's' : ''}!
          </Badge>
        </>
      ) : (
        <div className="flex items-center gap-2 opacity-60">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">No new orders</span>
        </div>
      )}
    </div>
  );
};