import { useState, useEffect } from 'react';
import { ApplicationData, ApplicationFiles, INITIAL_APPLICATION_DATA } from '@/types/application';
import { supabase } from '@/integrations/supabase/client';

const STORAGE_KEY = 'craver_application_draft';

export const useApplicationState = () => {
  const [data, setData] = useState<ApplicationData>(INITIAL_APPLICATION_DATA);
  const [files, setFiles] = useState<ApplicationFiles>({});
  const [currentStep, setCurrentStep] = useState(1);
  const [existingUser, setExistingUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load existing session and draft on mount
  useEffect(() => {
    const initializeState = async () => {
      try {
        // Check for existing session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setExistingUser(session.user);
          
          // Try to prefill from user profile
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .maybeSingle();
          
          const { data: address } = await supabase
            .from('delivery_addresses')
            .select('*')
            .eq('user_id', session.user.id)
            .eq('is_default', true)
            .maybeSingle();
          
          if (profile || address) {
            setData(prev => ({
              ...prev,
              firstName: profile?.full_name?.split(' ')[0] || prev.firstName,
              lastName: profile?.full_name?.split(' ').slice(1).join(' ') || prev.lastName,
              email: session.user.email || prev.email,
              phone: profile?.phone || prev.phone,
              streetAddress: address?.street_address || prev.streetAddress,
              city: address?.city || prev.city,
              state: address?.state || prev.state,
              zipCode: address?.zip_code || prev.zipCode,
            }));
          }
        } else {
          // Load draft from localStorage for new users
          const draft = localStorage.getItem(STORAGE_KEY);
          if (draft) {
            try {
              const parsed = JSON.parse(draft);
              setData(parsed.data || INITIAL_APPLICATION_DATA);
              setCurrentStep(parsed.step || 1);
            } catch (e) {
              console.error('Failed to parse draft:', e);
            }
          }
        }
      } catch (error) {
        console.error('Failed to initialize application state:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeState();
  }, []);

  // Auto-save draft to localStorage (debounced)
  useEffect(() => {
    if (!existingUser && !isLoading) {
      const timer = setTimeout(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ data, step: currentStep }));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [data, currentStep, existingUser, isLoading]);

  const updateData = (field: keyof ApplicationData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const updateFile = (field: keyof ApplicationFiles, file: File) => {
    setFiles(prev => ({ ...prev, [field]: file }));
  };

  const clearDraft = () => {
    localStorage.removeItem(STORAGE_KEY);
  };

  const nextStep = () => {
    setCurrentStep(prev => Math.min(prev + 1, 6));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const goToStep = (step: number) => {
    setCurrentStep(Math.max(1, Math.min(step, 6)));
  };

  return {
    data,
    files,
    currentStep,
    existingUser,
    isLoading,
    updateData,
    updateFile,
    nextStep,
    prevStep,
    goToStep,
    clearDraft,
  };
};
