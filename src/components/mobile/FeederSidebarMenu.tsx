import React from 'react';
import { X, Home, Calendar, DollarSign, Bell, User, Star, TrendingUp, MessageCircle, LogOut, Flame } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

type FeederSidebarMenuProps = {
  isOpen: boolean;
  onClose: () => void;
  activeTab?: string;
  onNavigate?: (path: string) => void;
};

const FeederSidebarMenu: React.FC<FeederSidebarMenuProps> = ({
  isOpen,
  onClose,
  activeTab = 'home',
  onNavigate
}) => {
  const [driverName, setDriverName] = React.useState('Torrance S');
  const [driverRating, setDriverRating] = React.useState(5.00);
  const [deliveries, setDeliveries] = React.useState(0);
  const [perfection, setPerfection] = React.useState(100);
  const [driverStatus, setDriverStatus] = React.useState('New Driver');
  const [driverPoints, setDriverPoints] = React.useState(87); // Diamond status

  // Fetch driver data
  React.useEffect(() => {
    const fetchDriverData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch driver profile
        const { data: profile } = await supabase
          .from('driver_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (profile) {
          setDriverRating(profile.rating || 5.00);
          setDeliveries(profile.total_deliveries || 0);
          setPerfection(profile.rating ? Math.round((profile.rating / 5) * 100) : 100);
          
          // Calculate points based on rating and deliveries
          const points = Math.round((profile.rating || 5) * 17 + (profile.total_deliveries || 0) * 0.1);
          setDriverPoints(points);
        }

        // Fetch user metadata for name
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser?.user_metadata?.full_name) {
          setDriverName(authUser.user_metadata.full_name);
        } else if (authUser?.email) {
          const emailName = authUser.email.split('@')[0];
          setDriverName(emailName.charAt(0).toUpperCase() + emailName.slice(1));
        }

        // Check if new driver (less than 10 deliveries)
        if (profile && (profile.total_deliveries || 0) < 10) {
          setDriverStatus('New Driver');
        } else {
          setDriverStatus('');
        }
      } catch (error) {
        console.error('Error fetching driver data:', error);
      }
    };

    if (isOpen) {
      fetchDriverData();
    }
  }, [isOpen]);

  const getStatus = (points: number) => {
    if (points >= 85) return { name: 'Diamond', gradient: 'from-cyan-200 via-blue-300 to-purple-300', icon: '💎' };
    if (points >= 76) return { name: 'Platinum', gradient: 'from-gray-300 via-gray-100 to-gray-300', icon: '⚪' };
    if (points >= 65) return { name: 'Gold', gradient: 'from-yellow-300 via-yellow-200 to-yellow-400', icon: '🥇' };
    return { name: 'Silver', gradient: 'from-gray-400 via-gray-300 to-gray-500', icon: '🥈' };
  };

  const status = getStatus(driverPoints);

  const menuItems = [
    { icon: Home, label: 'Home', path: 'home' },
    { icon: Calendar, label: 'Schedule', path: 'schedule' },
    { icon: DollarSign, label: 'Earnings', path: 'earnings' },
    { icon: Bell, label: 'Notifications', path: 'notifications' },
    { icon: User, label: 'Account', path: 'account' },
    { icon: Star, label: 'Ratings', path: 'ratings' },
    { icon: TrendingUp, label: 'Promos', path: 'promos' },
    { icon: MessageCircle, label: 'Help', path: 'help' }
  ];

  const handleMenuClick = (path: string) => {
    if (onNavigate) {
      // Convert path to capitalized format expected by handleMenuNavigation
      const capitalizedPath = path.charAt(0).toUpperCase() + path.slice(1);
      onNavigate(capitalizedPath);
    }
    onClose();
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = '/';
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <div className={`fixed inset-0 z-50 transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
      
      {/* Sidebar */}
      <div className="absolute left-0 top-0 h-full w-80 bg-white shadow-2xl overflow-y-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <style>{`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        `}</style>

        {/* Header Section */}
        <div className={`relative bg-gradient-to-br ${status.gradient} p-6 overflow-hidden`}>
          {/* Sparkle effects for Diamond */}
          {status.name === 'Diamond' && (
            <div className="absolute inset-0 opacity-30">
              <div className="absolute top-4 left-8 w-3 h-3 bg-white rounded-full animate-pulse"></div>
              <div className="absolute top-12 right-12 w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.3s' }}></div>
              <div className="absolute bottom-8 left-16 w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.6s' }}></div>
            </div>
          )}

          {/* Close Button */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 bg-white/30 backdrop-blur-sm p-2 rounded-full hover:bg-white/50 transition-colors"
          >
            <X className="w-6 h-6 text-gray-700" />
          </button>

          {/* Driver Info */}
          <div className="relative mt-8">
            <h2 className="text-3xl font-black text-gray-900 mb-2">{driverName}</h2>
            
            {/* Status Badge with Icon */}
            <div className="inline-flex items-center gap-2 bg-white/40 backdrop-blur-sm px-4 py-2 rounded-full border-2 border-white/60 shadow-lg mb-4">
              <span className="text-2xl">{status.icon}</span>
              <span className="text-gray-900 font-black">{status.name} Feeder</span>
            </div>

            {/* Stats Row */}
            <div className="flex items-center justify-between bg-white/30 backdrop-blur-sm rounded-2xl p-4 border border-white/50">
              <div className="text-center flex-1">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Star className="w-4 h-4 text-yellow-600" fill="currentColor" />
                  <span className="text-2xl font-black text-gray-900">{driverRating.toFixed(2)}</span>
                </div>
                <p className="text-xs text-gray-700 font-semibold">Rating</p>
              </div>
              <div className="w-px h-12 bg-white/50"></div>
              <div className="text-center flex-1">
                <p className="text-2xl font-black text-gray-900">{deliveries}</p>
                <p className="text-xs text-gray-700 font-semibold">deliveries</p>
              </div>
              <div className="w-px h-12 bg-white/50"></div>
              <div className="text-center flex-1">
                <p className="text-2xl font-black text-gray-900">{perfection}%</p>
                <p className="text-xs text-gray-700 font-semibold">perfect</p>
              </div>
            </div>
          </div>
        </div>

        {/* New Driver Badge */}
        {driverStatus && (
          <div className="px-6 -mt-4 relative z-10">
            <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl px-4 py-3 shadow-xl flex items-center gap-3">
              <div className="bg-white/30 p-2 rounded-full">
                <Flame className="w-5 h-5 text-white" />
              </div>
              <span className="text-white font-black text-sm">{driverStatus}</span>
            </div>
          </div>
        )}

        {/* Menu Items */}
        <div className="px-4 py-6 space-y-2">
          {menuItems.map((item, idx) => {
            const isActive = activeTab === item.path;
            return (
              <button
                key={idx}
                onClick={() => handleMenuClick(item.path)}
                className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all ${
                  isActive 
                    ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg scale-105' 
                    : 'bg-gray-50 text-gray-700 hover:bg-orange-50 hover:shadow-md'
                }`}
              >
                <div className={`${isActive ? 'bg-white/30' : 'bg-orange-100'} p-3 rounded-xl`}>
                  <item.icon className={`w-6 h-6 ${isActive ? 'text-white' : 'text-orange-600'}`} />
                </div>
                <span className="font-bold text-lg">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Logout */}
        <div className="px-4 pb-6">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl bg-red-50 border-2 border-red-200 text-red-600 hover:bg-red-100 transition-all"
          >
            <div className="bg-red-100 p-3 rounded-xl">
              <LogOut className="w-6 h-6 text-red-600" />
            </div>
            <span className="font-bold text-lg">Logout</span>
          </button>
        </div>

        {/* Bottom Accent */}
        <div className="h-20"></div>
      </div>
    </div>
  );
};

export default FeederSidebarMenu;

