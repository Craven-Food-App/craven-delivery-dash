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

export const useExecAuth = (requiredRole?: 'ceo' | 'board_member') => {
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

      // Check if user has executive access
      const { data: execData, error: execError } = await supabase
        .from('exec_users')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (execError || !execData) {
        setIsAuthorized(false);
        setExecUser(null);
      } else {
        setExecUser(execData);
        
        // Check role requirement if specified
        if (requiredRole) {
          setIsAuthorized(execData.role === requiredRole || execData.role === 'ceo');
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
