import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Store, CheckCircle, TrendingUp, Users, DollarSign, Star, Zap, Gift, Award, Target } from "lucide-react";
import Confetti from 'react-confetti';

interface MerchantWelcomeConfettiProps {
  restaurantName: string;
  onComplete: () => void;
}

const MerchantWelcomeConfetti: React.FC<MerchantWelcomeConfettiProps> = ({ 
  restaurantName, 
  onComplete 
}) => {
  const [showConfetti, setShowConfetti] = useState(true);
  const [windowDimensions, setWindowDimensions] = useState({ width: 0, height: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    const updateDimensions = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    // Stop confetti after 5 seconds
    const timer = setTimeout(() => {
      setShowConfetti(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleContinue = async () => {
    try {
      // Mark welcome screen as shown
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('restaurants')
          .update({
            merchant_welcome_shown: true,
            merchant_welcome_shown_at: new Date().toISOString()
          })
          .eq('owner_id', user.id);
      }
    } catch (error) {
      console.error('Error updating welcome status:', error);
    }
    
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100">
      {showConfetti && (
        <Confetti
          width={windowDimensions.width}
          height={windowDimensions.height}
          recycle={false}
          numberOfPieces={200}
          colors={['#ff6b35', '#f7931e', '#ffb347', '#ffd700', '#ff69b4']}
        />
      )}
      
      <div className="w-full max-w-2xl mx-4">
        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mb-6">
              <Store className="h-10 w-10 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
              Welcome to Crave'N! 🎉
            </CardTitle>
            <p className="text-lg text-gray-600">
              Your restaurant <span className="font-semibold text-orange-600">{restaurantName}</span> is now part of the Crave'N family!
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Success Message */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <h3 className="text-xl font-semibold text-green-800 mb-2">
                Restaurant Successfully Added!
              </h3>
              <p className="text-green-700">
                Your restaurant is now live on the Crave'N platform and ready to start receiving orders.
              </p>
            </div>

            {/* What's Next Section */}
            <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Target className="h-5 w-5 text-orange-600" />
                What's Next?
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-900">Start Receiving Orders</h5>
                    <p className="text-sm text-gray-600">Your restaurant is now visible to customers</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Users className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-900">Manage Your Menu</h5>
                    <p className="text-sm text-gray-600">Add items and update your offerings</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <DollarSign className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-900">Track Earnings</h5>
                    <p className="text-sm text-gray-600">Monitor your revenue and payouts</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Star className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-900">Build Your Reputation</h5>
                    <p className="text-sm text-gray-600">Deliver great food and earn reviews</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Benefits Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Gift className="h-5 w-5 text-blue-600" />
                Your Benefits
              </h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Zap className="h-5 w-5 text-blue-600" />
                  <span className="text-gray-700">Access to thousands of hungry customers</span>
                </div>
                <div className="flex items-center gap-3">
                  <Award className="h-5 w-5 text-blue-600" />
                  <span className="text-gray-700">Professional delivery and customer service</span>
                </div>
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <span className="text-gray-700">Real-time analytics and insights</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button 
                onClick={handleContinue}
                className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3"
              >
                <Store className="h-5 w-5 mr-2" />
                Go to Merchant Portal
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate('/')}
                className="flex-1 border-orange-300 text-orange-600 hover:bg-orange-50"
              >
                View Your Restaurant
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MerchantWelcomeConfetti;
