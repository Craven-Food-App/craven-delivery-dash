import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

export interface ExecUser {
  id: string;
  user_id: string;
  role: string;
  access_level: number;
  title: string;
  department: string;
}

export const useExecAuth = (requiredRole?: 'ceo' | 'board_member' | 'cfo' | 'coo' | 'cto') => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [execUser, setExecUser] = useState<ExecUser | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setExecUser(null);
          setIsAuthorized(false);
          navigate('/auth');
        } else if (event === 'SIGNED_IN' && session?.user) {
          checkAuth();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const checkAuth = async () => {
    try {
      // Check if user is authenticated
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        setIsAuthorized(false);
        setLoading(false);
        navigate('/auth');
        return;
      }

      setUser(user);

      // OWNER ACCOUNT: craven@usa.com has universal access to everything
      if (user.email === 'craven@usa.com') {
        setIsAuthorized(true);
        // Create a mock execUser for owner to allow portal access
        setExecUser({
          id: user.id,
          user_id: user.id,
          role: 'ceo',
          access_level: 10,
          title: 'Owner & CEO',
          department: 'Executive'
        });
        setLoading(false);
        return;
      }

      // Check if user has executive access
      const { data: execData, error: execError } = await supabase
        .from('exec_users' as any)
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (execError || !execData) {
        setIsAuthorized(false);
        setExecUser(null);
      } else {
        setExecUser(execData as any);
        
        // Check role requirement if specified
        if (requiredRole) {
          setIsAuthorized((execData as any).role === requiredRole || (execData as any).role === 'ceo');
        } else {
          setIsAuthorized(true);
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setIsAuthorized(false);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return {
    loading,
    user,
    execUser,
    isAuthorized,
    signOut,
  };
};
