import React, { useState, useEffect } from 'react';
import { Menu, Bell, Flame, MapPin, Clock, Target, TrendingUp, Users, Zap, Award, ChevronRight, Package } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

type FeederPromotionsTabProps = {
  onOpenMenu?: () => void;
  onOpenNotifications?: () => void;
};

const FeederPromotionsTab: React.FC<FeederPromotionsTabProps> = ({
  onOpenMenu,
  onOpenNotifications
}) => {
  const [activeTab, setActiveTab] = useState('promos');
  const [loading, setLoading] = useState(true);
  const [promotions, setPromotions] = useState<any[]>([]);
  const [challenges, setChallenges] = useState<any[]>([]);

  useEffect(() => {
    fetchPromotionsData();
  }, [activeTab]);

  const fetchPromotionsData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const now = new Date().toISOString();

      // Fetch active promotions (surge zones)
      const { data: surgeZones } = await supabase
        .from('driver_surge_zones')
        .select('*')
        .eq('is_active', true)
        .gte('active_until', now)
        .order('surge_multiplier', { ascending: false })
        .limit(10);

      if (surgeZones) {
        const formattedPromos = surgeZones.map((zone: any) => {
          const startDate = new Date(zone.start_time);
          startDate.setHours(0, 0, 0, 0);
          const endDate = new Date(zone.end_time);
          endDate.setHours(23, 59, 59, 999);

          return {
            zone: zone.zone_name || 'Zone',
            date: startDate.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }),
            timeframe: `${new Date(zone.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} - ${new Date(zone.end_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`,
            description: `Surge ${zone.surge_multiplier}x`,
            bonus: `$${(zone.surge_multiplier - 1).toFixed(2)} multiplier`,
            type: 'peak',
            active: zone.is_active,
            id: zone.id
          };
        });
        setPromotions(formattedPromos);
      }

      // Fetch challenges (promotions with challenge_type)
      const { data: activePromotions } = await supabase
        .from('driver_promotions')
        .select('*')
        .eq('is_active', true)
        .gte('end_date', now)
        .lte('start_date', now)
        .limit(20);

      // Fetch user's participation in challenges
      const { data: participations } = await supabase
        .from('driver_promotion_participation')
        .select('*')
        .eq('driver_id', user.id)
        .eq('completed', false);

      if (activePromotions && participations) {
        const formattedChallenges = activePromotions.map(promo => {
          const participation = participations.find(p => p.promotion_id === promo.id);
          const progress = participation?.progress || 0;
          const total = 100; // Default requirement value
          const progressPercentage = total > 0 ? (progress / total) * 100 : 0;

          // Map challenge types to icons and colors
          const typeMap: Record<string, { icon: any; color: string }> = {
            delivery_count: { icon: Package, color: 'orange' },
            time_based: { icon: Zap, color: 'yellow' },
            peak_hours: { icon: TrendingUp, color: 'red' },
            geographic: { icon: MapPin, color: 'blue' },
            rating_based: { icon: Award, color: 'purple' },
            streak_based: { icon: Flame, color: 'red' },
            referral: { icon: Users, color: 'green' }
          };

          const typeInfo = typeMap[promo.promo_type] || { icon: Target, color: 'orange' };

          // Calculate deadline
          const endsAt = new Date(promo.end_date);
          const daysLeft = Math.ceil((endsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          const deadline = daysLeft > 0 
            ? `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`
            : 'Ending soon';

          // Format reward
          let reward = '$0';
          if (promo.reward_amount) {
            reward = `$${promo.reward_amount.toFixed(0)}`;
          }

          return {
            id: promo.id,
            title: promo.title,
            type: promo.promo_type?.replace('_', ' ') || 'Challenge',
            description: promo.description || '',
            progress: Math.min(progress, total),
            total,
            reward,
            icon: typeInfo.icon,
            color: typeInfo.color,
            deadline,
            participationId: participation?.id
          };
        });

        setChallenges(formattedChallenges);
      }
    } catch (error) {
      console.error('Error fetching promotions:', error);
      toast.error('Failed to load promotions');
    } finally {
      setLoading(false);
    }
  };

  const getChallengeColors = (color: string) => {
    const colors: Record<string, { bg: string; icon: string; badgeBg: string; badgeText: string; progressFrom: string; progressTo: string }> = {
      orange: { 
        bg: 'bg-orange-100', 
        icon: 'text-orange-600',
        badgeBg: 'bg-orange-100',
        badgeText: 'text-orange-700',
        progressFrom: 'from-orange-400',
        progressTo: 'to-orange-600'
      },
      yellow: { 
        bg: 'bg-yellow-100', 
        icon: 'text-yellow-600',
        badgeBg: 'bg-yellow-100',
        badgeText: 'text-yellow-700',
        progressFrom: 'from-yellow-400',
        progressTo: 'to-yellow-600'
      },
      red: { 
        bg: 'bg-red-100', 
        icon: 'text-red-600',
        badgeBg: 'bg-red-100',
        badgeText: 'text-red-700',
        progressFrom: 'from-red-400',
        progressTo: 'to-red-600'
      },
      blue: { 
        bg: 'bg-blue-100', 
        icon: 'text-blue-600',
        badgeBg: 'bg-blue-100',
        badgeText: 'text-blue-700',
        progressFrom: 'from-blue-400',
        progressTo: 'to-blue-600'
      },
      purple: { 
        bg: 'bg-purple-100', 
        icon: 'text-purple-600',
        badgeBg: 'bg-purple-100',
        badgeText: 'text-purple-700',
        progressFrom: 'from-purple-400',
        progressTo: 'to-purple-600'
      },
      green: { 
        bg: 'bg-green-100', 
        icon: 'text-green-600',
        badgeBg: 'bg-green-100',
        badgeText: 'text-green-700',
        progressFrom: 'from-green-400',
        progressTo: 'to-green-600'
      }
    };
    return colors[color] || colors.orange;
  };

  if (loading) {
    return (
      <div className="h-screen w-full bg-gradient-to-b from-red-600 via-orange-600 to-orange-500 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-gradient-to-b from-red-600 via-orange-600 to-orange-500 overflow-y-auto" style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))' }}>
      {/* Header */}
      <div className="px-6 pb-4 flex items-center justify-between flex-shrink-0 safe-area-top">
        <button 
          onClick={() => {
            if (onOpenMenu) {
              onOpenMenu();
            } else {
              toast.info('Menu coming soon.');
            }
          }}
          className="text-white"
        >
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="text-orange-400 text-3xl font-bold tracking-wide">PROMOS</h1>
        <button 
          onClick={() => {
            if (onOpenNotifications) {
              onOpenNotifications();
            } else {
              toast.info('Notifications coming soon.');
            }
          }}
          className="text-white"
        >
          <Bell className="w-7 h-7" />
        </button>
      </div>

      {/* Tab Switcher */}
      <div className="px-6 mb-6">
        <div className="bg-white/20 backdrop-blur-sm rounded-full p-1 flex gap-1">
          <button
            onClick={() => setActiveTab('promos')}
            className={`flex-1 py-2.5 rounded-full font-bold text-sm transition-all ${
              activeTab === 'promos'
                ? 'bg-white text-red-700 shadow-lg'
                : 'text-white'
            }`}
          >
            Active Promos
          </button>
          <button
            onClick={() => setActiveTab('challenges')}
            className={`flex-1 py-2.5 rounded-full font-bold text-sm transition-all ${
              activeTab === 'challenges'
                ? 'bg-white text-red-700 shadow-lg'
                : 'text-white'
            }`}
          >
            Challenges
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 pb-24">
        {activeTab === 'promos' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <Flame className="w-5 h-5 text-yellow-300" />
              <h3 className="text-white text-xl font-bold tracking-wide">ACTIVE NOW</h3>
            </div>
            
            {promotions.length > 0 ? promotions.map((promo, idx) => (
              <div 
                key={promo.id || idx} 
                className={`rounded-2xl p-5 shadow-xl relative overflow-hidden ${
                  promo.active 
                    ? 'bg-gradient-to-br from-yellow-50 to-orange-50' 
                    : 'bg-gray-100 opacity-75'
                }`}
              >
                {promo.active && (
                  <div className="absolute top-3 right-3">
                    <div className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 animate-pulse">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                      LIVE
                    </div>
                  </div>
                )}

                <div className="mb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-orange-600" />
                    <span className="text-gray-900 font-bold text-lg">{promo.zone}</span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-700 mb-3">
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                      </svg>
                      <span className="font-semibold">{promo.date}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span className="font-semibold">{promo.timeframe}</span>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-orange-400 to-red-500 rounded-xl p-3 mb-3">
                    <p className="text-white font-black text-xl text-center">
                      {promo.description}
                    </p>
                  </div>

                  <div className="bg-green-100 border-2 border-green-500 rounded-xl p-3 text-center">
                    <p className="text-green-800 font-black text-2xl">
                      {promo.bonus}
                    </p>
                  </div>
                </div>
              </div>
            )) : (
              <div className="bg-orange-50 rounded-2xl p-8 text-center shadow-lg">
                <p className="text-gray-500">No active promotions</p>
                <p className="text-sm text-gray-400 mt-2">Check back soon for new opportunities</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'challenges' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-5 h-5 text-yellow-300" />
              <h3 className="text-white text-xl font-bold tracking-wide">YOUR CHALLENGES</h3>
            </div>

            {challenges.length > 0 ? challenges.map((challenge) => {
              const IconComponent = challenge.icon;
              const progressPercentage = challenge.total > 0 ? (challenge.progress / challenge.total) * 100 : 0;
              const colors = getChallengeColors(challenge.color);
              
              return (
                <div key={challenge.id} className="bg-orange-50 rounded-2xl p-5 shadow-xl">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`${colors.bg} p-3 rounded-xl`}>
                        <IconComponent className={`w-6 h-6 ${colors.icon}`} />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-gray-900 font-bold text-lg mb-1">{challenge.title}</h4>
                        <span className={`inline-block ${colors.badgeBg} ${colors.badgeText} px-2 py-1 rounded-full text-xs font-bold mb-2`}>
                          {challenge.type}
                        </span>
                        <p className="text-gray-700 text-sm">{challenge.description}</p>
                      </div>
                    </div>
                    <div className="text-right ml-2">
                      <p className="text-green-600 font-black text-2xl">{challenge.reward}</p>
                      <p className="text-gray-500 text-xs">{challenge.deadline}</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-2">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-700 font-semibold">Progress</span>
                      <span className="text-gray-900 font-bold">{challenge.progress}/{challenge.total}</span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full bg-gradient-to-r ${colors.progressFrom} ${colors.progressTo} rounded-full transition-all duration-500`}
                        style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                      />
                    </div>
                  </div>

                  <button className="w-full mt-3 bg-gradient-to-r from-orange-500 to-red-600 text-white py-2.5 rounded-full font-bold text-sm shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2">
                    <span>View Details</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              );
            }) : (
              <div className="bg-orange-50 rounded-2xl p-8 text-center shadow-lg">
                <p className="text-gray-500">No active challenges</p>
                <p className="text-sm text-gray-400 mt-2">New challenges will appear here</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FeederPromotionsTab;
