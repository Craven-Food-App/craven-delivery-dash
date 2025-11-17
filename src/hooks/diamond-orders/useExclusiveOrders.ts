import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ExclusiveOrder } from '@/types/diamond-orders';

export const useExclusiveOrders = (isDiamond: boolean) => {
  const [orders, setOrders] = useState<ExclusiveOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExclusiveOrders();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('exclusive_orders')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'orders', filter: `exclusive_type=neq.none` },
        () => {
          fetchExclusiveOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isDiamond]);

  const fetchExclusiveOrders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const now = new Date().toISOString();
      
      // Build query based on diamond status
      let query = supabase
        .from('orders')
        .select(`
          *,
          restaurant:restaurants(name),
          order_assignments!left(id, status)
        `)
        .neq('exclusive_type', 'none')
        .in('order_status', ['pending', 'confirmed', 'preparing', 'ready']);

      // If not diamond, only show orders past diamond_only_until
      if (!isDiamond) {
        query = query.or(`diamond_only_until.is.null,diamond_only_until.lt.${now}`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      // Filter out orders with accepted assignments
      const availableOrders = (data || []).filter(order => {
        const assignments = order.order_assignments || [];
        return !assignments.some((a: any) => a.status === 'accepted');
      });

      setOrders(availableOrders as unknown as ExclusiveOrder[]);
    } catch (error) {
      console.error('Error fetching exclusive orders:', error);
    } finally {
      setLoading(false);
    }
  };

  return { orders, loading, refetch: fetchExclusiveOrders };
};

