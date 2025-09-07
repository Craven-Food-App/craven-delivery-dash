import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface AccessGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const AccessGuard: React.FC<AccessGuardProps> = ({ children, fallback }) => {
  const [isApproved, setIsApproved] = useState<boolean | null>(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkAccess = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setIsApproved(false);
        return;
      }

      setUser(user);

      const { data, error } = await (supabase as any)
        .from('craver_applications')
        .select('status')
        .eq('user_id', user.id)
        .eq('status', 'approved')
        .single();

      setIsApproved(!error && data?.status === 'approved');
    };

    checkAccess();
  }, []);

  if (isApproved === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user || !isApproved) {
    return fallback || (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="text-muted-foreground">You need an approved Craver application to access this page.</p>
      </div>
    );
  }

  return <>{children}</>;
};

export default AccessGuard;