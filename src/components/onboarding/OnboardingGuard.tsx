import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface OnboardingGuardProps {
  children: React.ReactNode;
}

const OnboardingGuard: React.FC<OnboardingGuardProps> = ({ children }) => {
  const [isChecking, setIsChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkOnboardingAccess();
  }, []);

  const checkOnboardingAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/driver-auth');
        return;
      }

      // Check if user has an approved application
      const { data: application } = await supabase
        .from('craver_applications')
        .select('status, onboarding_completed_at')
        .eq('user_id', user.id)
        .single();

      if (!application) {
        navigate('/craver-hub');
        return;
      }

      if (application.status !== 'approved') {
        navigate('/craver-hub');
        return;
      }

      // If onboarding is already complete, redirect to mobile dashboard
      if (application.onboarding_completed_at) {
        navigate('/mobile');
        return;
      }

      setHasAccess(true);
    } catch (error) {
      console.error('Error checking onboarding access:', error);
      navigate('/driver-auth');
    } finally {
      setIsChecking(false);
    }
  };

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!hasAccess) {
    return null;
  }

  return <>{children}</>;
};

export default OnboardingGuard;
