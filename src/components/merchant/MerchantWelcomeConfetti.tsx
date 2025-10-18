import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  BarChart3, 
  Users, 
  Zap, 
  ArrowRight, 
  CheckCircle2,
  Sparkles,
  Target,
  DollarSign,
  Clock,
  Shield
} from "lucide-react";

interface MerchantWelcomeConfettiProps {
  restaurantName: string;
  onComplete: () => void;
}

const MerchantWelcomeConfetti: React.FC<MerchantWelcomeConfettiProps> = ({ 
  restaurantName, 
  onComplete 
}) => {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    // Animate through steps
    const timers = [
      setTimeout(() => setStep(1), 500),
      setTimeout(() => setStep(2), 1200),
      setTimeout(() => setStep(3), 1900),
    ];

    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  const handleContinue = async () => {
    try {
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

  const stats = [
    { label: 'Active Customers', value: '50K+', icon: Users, color: 'text-blue-600' },
    { label: 'Avg. Order Value', value: '$38', icon: DollarSign, color: 'text-green-600' },
    { label: 'Delivery Time', value: '28min', icon: Clock, color: 'text-purple-600' },
    { label: 'Merchant Support', value: '24/7', icon: Shield, color: 'text-orange-600' },
  ];

  const features = [
    {
      icon: BarChart3,
      title: 'Real-Time Analytics',
      description: 'Track orders, revenue, and customer insights instantly',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Zap,
      title: 'Instant Order Alerts',
      description: 'Never miss an order with real-time notifications',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      icon: Target,
      title: 'Marketing Tools',
      description: 'Promote your restaurant and boost visibility',
      gradient: 'from-orange-500 to-red-500'
    },
    {
      icon: TrendingUp,
      title: 'Growth Insights',
      description: 'Data-driven recommendations to increase sales',
      gradient: 'from-green-500 to-emerald-500'
    },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="min-h-screen flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-6xl">
          {/* Header Section */}
          <div className="text-center mb-12 space-y-6">
            {/* Animated Logo/Badge */}
            <div 
              className={`
                inline-flex items-center justify-center w-20 h-20 mx-auto
                bg-gradient-to-br from-slate-900 to-slate-700 rounded-2xl
                transform transition-all duration-700 ease-out
                ${step >= 1 ? 'scale-100 rotate-0 opacity-100' : 'scale-50 rotate-12 opacity-0'}
                shadow-2xl shadow-slate-900/20
              `}
            >
              <Sparkles className="w-10 h-10 text-white" />
            </div>

            {/* Welcome Message */}
            <div 
              className={`
                space-y-3 transition-all duration-700 delay-300
                ${step >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
              `}
            >
              <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">
                Welcome to Crave'N,
                <br />
                <span className="bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
                  {restaurantName}
                </span>
              </h1>
              <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
                Your restaurant is now live and ready to receive orders. Let's grow your business together.
              </p>
            </div>

            {/* Status Badge */}
            <div 
              className={`
                inline-flex items-center gap-2 px-4 py-2 
                bg-green-50 border border-green-200 rounded-full
                transition-all duration-700 delay-500
                ${step >= 3 ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}
              `}
            >
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <span className="text-sm font-semibold text-green-700">Restaurant Activated</span>
            </div>
          </div>

          {/* Stats Grid */}
          <div 
            className={`
              grid grid-cols-2 md:grid-cols-4 gap-4 mb-12
              transition-all duration-700 delay-700
              ${step >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
            `}
          >
            {stats.map((stat, index) => (
              <div 
                key={stat.label}
                className="bg-white border border-slate-200 rounded-xl p-6 text-center hover:shadow-lg transition-shadow"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <stat.icon className={`w-6 h-6 ${stat.color} mx-auto mb-2`} />
                <div className="text-2xl font-bold text-slate-900 mb-1">{stat.value}</div>
                <div className="text-sm text-slate-600">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Features Grid */}
          <div 
            className={`
              grid md:grid-cols-2 gap-6 mb-12
              transition-all duration-700 delay-900
              ${step >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
            `}
          >
            {features.map((feature, index) => (
              <div 
                key={feature.title}
                className="group bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-xl hover:border-slate-300 transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className={`
                    w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} 
                    flex items-center justify-center flex-shrink-0
                    group-hover:scale-110 transition-transform duration-300
                  `}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900 mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA Section */}
          <div 
            className={`
              bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 md:p-10 text-center
              shadow-2xl shadow-slate-900/30
              transition-all duration-700 delay-1100
              ${step >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
            `}
          >
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Ready to Start Your Journey?
            </h2>
            <p className="text-slate-300 mb-8 max-w-xl mx-auto">
              Access your merchant dashboard to manage orders, update your menu, and grow your business.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                onClick={handleContinue}
                size="lg"
                className="
                  bg-white text-slate-900 hover:bg-slate-100
                  font-semibold px-8 py-6 text-lg
                  shadow-xl hover:shadow-2xl
                  transition-all duration-300
                  group
                "
              >
                Launch Merchant Portal
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              
              <Button 
                variant="ghost"
                size="lg"
                onClick={() => navigate('/')}
                className="text-white hover:bg-white/10 px-8 py-6 text-lg"
              >
                Preview Your Restaurant
              </Button>
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-center mt-8 text-sm text-slate-500">
            Need help getting started? Our support team is available 24/7 at{' '}
            <span className="text-orange-600 font-medium">support@craven.com</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MerchantWelcomeConfetti;
