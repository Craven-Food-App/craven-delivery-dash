import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import RestaurantOnboardingWizard from "@/components/restaurant/onboarding/RestaurantOnboardingWizard";

const RestaurantRegister = () => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkExistingRestaurant = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setChecking(false);
          return;
        }

        const { data: restaurant } = await supabase
          .from('restaurants')
          .select('id')
          .eq('owner_id', user.id)
          .maybeSingle();

        if (restaurant) {
          // Restaurant exists - redirect to merchant portal
          navigate('/merchant-portal');
        } else {
          setChecking(false);
        }
      } catch (error) {
        console.error('Error checking restaurant:', error);
        setChecking(false);
      }
    };

    checkExistingRestaurant();
  }, [navigate]);

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking your restaurant...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <RestaurantOnboardingWizard />
    </div>
  );
};

export default RestaurantRegister;
