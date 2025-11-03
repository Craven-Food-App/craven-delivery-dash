import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function usePermission(permissionKey: string): boolean {
  const [allowed, setAllowed] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (!cancelled) setAllowed(false);
        return;
      }
      const { data, error } = await supabase.rpc('has_permission', {
        p_user_id: user.id,
        p_permission: permissionKey,
      });
      if (!cancelled) setAllowed(!error && Boolean(data));
    })();
    return () => {
      cancelled = true;
    };
  }, [permissionKey]);

  return allowed;
}


