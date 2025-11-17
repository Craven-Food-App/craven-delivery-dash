import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RatingTier } from '@/types/diamond-orders';

export const useDriverTier = () => {
  const [tier, setTier] = useState<RatingTier>('Bronze');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDriverTier();
  }, []);

  const fetchDriverTier = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('driver_profiles')
        .select('rating_tier')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setTier((data?.rating_tier as RatingTier) || 'Bronze');
    } catch (error) {
      console.error('Error fetching driver tier:', error);
    } finally {
      setLoading(false);
    }
  };

  return { tier, isDiamond: tier === 'Diamond', loading };
};

