import React, { useState, useEffect } from 'react';
import { 
  User, Car, Shield, CreditCard, Settings, LogOut, 
  ChevronRight, Star, DollarSign, MessageCircle,
  Phone, Mail, MapPin, Calendar
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ProfileSection } from './ProfileSection';
import { PaymentMethodsSection } from './PaymentMethodsSection';
import { AppSettingsSection } from './AppSettingsSection';
import { VehicleManagementSection } from './VehicleManagementSection';
import { SafeDrivingSection } from './SafeDrivingSection';
import { InstantCashoutModal } from './InstantCashoutModal';
import { ProfilePhotoUpload } from './ProfilePhotoUpload';

interface CraverProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  status: string;
  profile_photo?: string;
}

export const AccountSection: React.FC<{
  activeTab: string;
  onTabChange: (tab: string) => void;
}> = ({ activeTab, onTabChange }) => {
  const [profile, setProfile] = useState<CraverProfile | null>(null);
  const [stats, setStats] = useState({
    rating: 5.0,
    totalDeliveries: 0,
    weekEarnings: 0,
    todayEarnings: 0,
    acceptanceRate: 100,
    completionRate: 100,
    onTimeRate: 100
  });
  const [loading, setLoading] = useState(true);
  const [currentSection, setCurrentSection] = useState<'main' | 'profile' | 'payments' | 'settings' | 'vehicle' | 'safety'>('main');
  const [showCashoutModal, setShowCashoutModal] = useState(false);
  const [availableCashout, setAvailableCashout] = useState(0);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Get profile from user_profiles table
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching user profile:', profileError);
      }

      // Get driver stats and rating details
      const { data: driverProfile, error: driverError } = await supabase
        .from('driver_profiles')
        .select('total_deliveries, rating, acceptance_rate, completion_rate, on_time_rate')
        .eq('user_id', user.id)
        .maybeSingle();

      if (driverError && driverError.code !== 'PGRST116') {
        console.error('Error fetching driver profile:', driverError);
      }

      // Get earnings
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);

      const { data: todayOrders } = await supabase
        .from('orders')
        .select('payout_cents')
        .eq('driver_id', user.id)
        .eq('order_status', 'delivered')
        .gte('created_at', todayStart.toISOString());

      const { data: weekOrders } = await supabase
        .from('orders')
        .select('payout_cents')
        .eq('driver_id', user.id)
        .eq('order_status', 'delivered')
        .gte('created_at', weekStart.toISOString());

      if (application) {
        setProfile(application);
      }

      setStats({
        rating: driverProfile?.rating || 5.0,
        totalDeliveries: driverProfile?.total_deliveries || 0,
        todayEarnings: (todayOrders?.reduce((sum, o) => sum + (o.payout_cents || 0), 0) || 0) / 100,
        weekEarnings: (weekOrders?.reduce((sum, o) => sum + (o.payout_cents || 0), 0) || 0) / 100,
        acceptanceRate: driverProfile?.acceptance_rate || 100,
        completionRate: driverProfile?.completion_rate || 100,
        onTimeRate: driverProfile?.on_time_rate || 100
      });

      // Calculate available cashout
      setAvailableCashout((todayOrders?.reduce((sum, o) => sum + (o.payout_cents || 0), 0) || 0) / 100);

    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Signed out successfully');
      window.location.href = '/mobile';
    } catch (error) {
      toast.error('Failed to sign out');
    }
  };

  // Render sub-sections
  if (currentSection === 'profile') {
    return <ProfileSection onBack={() => setCurrentSection('main')} />;
  }
  if (currentSection === 'payments') {
    return <PaymentMethodsSection onBack={() => setCurrentSection('main')} />;
  }
  if (currentSection === 'settings') {
    return <AppSettingsSection onBack={() => setCurrentSection('main')} />;
  }
  if (currentSection === 'vehicle') {
    return <VehicleManagementSection onBack={() => setCurrentSection('main')} />;
  }
  if (currentSection === 'safety') {
    return <SafeDrivingSection onBack={() => setCurrentSection('main')} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading your account...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b shadow-sm safe-area-top">
        <div className="p-4">
          <h1 className="text-3xl font-bold text-slate-900 text-right">Account</h1>
          <p className="text-sm text-slate-600 text-right">Manage your profile and settings</p>
        </div>
      </div>

      {/* Profile Card */}
      <div className="bg-gradient-to-br from-orange-500 to-orange-600 px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 rounded-full border-4 border-white shadow-lg overflow-hidden bg-white">
            {profile?.profile_photo ? (
              <img src={profile.profile_photo} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-200">
                <User className="h-10 w-10 text-slate-500" />
              </div>
            )}
          </div>
          <div className="flex-1 text-white">
            <h2 className="text-2xl font-bold">
              {profile?.first_name} {profile?.last_name}
            </h2>
            <p className="text-orange-100 text-sm capitalize">{profile?.status || 'Driver'}</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-white">
            <div className="flex items-center gap-2 mb-1">
              <Star className="h-4 w-4" />
              <span className="text-xs text-orange-100">Rating</span>
            </div>
            <div className="text-2xl font-bold">{stats.rating.toFixed(1)}</div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-white">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4" />
              <span className="text-xs text-orange-100">This Week</span>
            </div>
            <div className="text-2xl font-bold">${stats.weekEarnings.toFixed(0)}</div>
          </div>
        </div>

        {availableCashout > 0.50 && (
          <button
            onClick={() => setShowCashoutModal(true)}
            className="w-full mt-4 bg-white text-orange-600 font-semibold py-3 rounded-xl hover:bg-orange-50 transition-all"
          >
            Cash Out ${availableCashout.toFixed(2)}
          </button>
        )}
      </div>

      {/* Menu Sections */}
      <div className="px-4 py-4 space-y-3">
        {/* Personal */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Personal</h3>
          </div>
          
          <button onClick={() => setCurrentSection('profile')} className="w-full px-4 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <span className="font-medium text-slate-900">Profile Information</span>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-400" />
          </button>

          <button onClick={() => setCurrentSection('vehicle')} className="w-full px-4 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
                <Car className="h-5 w-5 text-purple-600" />
              </div>
              <div className="text-left">
                <span className="font-medium text-slate-900 block">Vehicle & Documents</span>
                <span className="text-xs text-slate-600 capitalize">{profile?.vehicle_type || 'Not set'}</span>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        {/* Financial */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Financial</h3>
          </div>
          
          <button onClick={() => setCurrentSection('payments')} className="w-full px-4 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-green-600" />
              </div>
              <span className="font-medium text-slate-900">Payment Methods</span>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        {/* App Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Settings</h3>
          </div>
          
          <button onClick={() => setCurrentSection('settings')} className="w-full px-4 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center">
                <Settings className="h-5 w-5 text-slate-600" />
              </div>
              <span className="font-medium text-slate-900">App Settings</span>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-400" />
          </button>

          <button onClick={() => setCurrentSection('safety')} className="w-full px-4 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                <Shield className="h-5 w-5 text-green-600" />
              </div>
              <span className="font-medium text-slate-900">Safety & Security</span>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        {/* Support */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Support</h3>
          </div>
          
          <a href="tel:+18883728368" className="w-full px-4 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                <Phone className="h-5 w-5 text-blue-600" />
              </div>
              <span className="font-medium text-slate-900">Call Support</span>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-400" />
          </a>

          <a href="mailto:support@crave-n.shop" className="w-full px-4 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
                <Mail className="h-5 w-5 text-purple-600" />
              </div>
              <span className="font-medium text-slate-900">Email Support</span>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-400" />
          </a>
        </div>

        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          className="w-full bg-white rounded-xl shadow-sm border border-slate-200 px-4 py-4 flex items-center justify-center gap-2 hover:bg-red-50 hover:border-red-200 transition-all text-red-600 font-semibold"
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </button>

        {/* App Version */}
        <div className="text-center py-6">
          <p className="text-xs text-slate-500">Feeder v2.0.0</p>
        </div>
      </div>

      <InstantCashoutModal
        isOpen={showCashoutModal}
        onClose={() => setShowCashoutModal(false)}
        availableAmount={availableCashout}
        onSuccess={fetchProfile}
      />
    </div>
  );
};

