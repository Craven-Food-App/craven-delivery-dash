import React, { useState } from 'react';
import { Menu, Bell, Flame, MapPin, Clock, Target, TrendingUp, Users, Zap, Award, ChevronRight, Package } from 'lucide-react';
import { toast } from 'sonner';

type FeederPromotionsTabProps = {
  onOpenMenu?: () => void;
  onOpenNotifications?: () => void;
};

const FeederPromotionsTab: React.FC<FeederPromotionsTabProps> = ({
  onOpenMenu,
  onOpenNotifications
}) => {
  const [activeTab, setActiveTab] = useState('promos');

  const promotions = [
    {
      zone: "Downtown Detroit",
      date: "11/14/2024",
      timeframe: "3:30 AM - 5:29 AM",
      description: "Fire Pay",
      bonus: "$2.50 on top of deliveries",
      type: "peak",
      active: true
    },
    {
      zone: "Airport Zone",
      date: "11/14/2024",
      timeframe: "11:00 AM - 2:00 PM",
      description: "Lunch Rush Boost",
      bonus: "$1.00 on top of deliveries",
      type: "peak",
      active: true
    },
    {
      zone: "Midtown",
      date: "11/15/2024",
      timeframe: "5:00 PM - 9:00 PM",
      description: "Dinner Surge",
      bonus: "$3.00 on top of deliveries",
      type: "peak",
      active: false
    },
    {
      zone: "All Zones",
      date: "11/14-11/20",
      timeframe: "All Day",
      description: "Weekend Warrior",
      bonus: "$1.50 on top of deliveries",
      type: "extended",
      active: true
    }
  ];

  const challenges = [
    {
      title: "Feed Frenzy",
      type: "Delivery Count",
      description: "Complete 50 deliveries this week",
      progress: 34,
      total: 50,
      reward: "$75",
      icon: Package,
      color: "orange",
      deadline: "3 days left"
    },
    {
      title: "Speed Demon",
      type: "Time-Based",
      description: "Maintain under 25min average delivery time",
      progress: 22,
      total: 25,
      reward: "$50",
      icon: Zap,
      color: "yellow",
      deadline: "Ongoing"
    },
    {
      title: "Peak Master",
      type: "Peak Hours",
      description: "Work 15 hours during peak times",
      progress: 9,
      total: 15,
      reward: "$100",
      icon: TrendingUp,
      color: "red",
      deadline: "5 days left"
    },
    {
      title: "Zone Explorer",
      type: "Geographic",
      description: "Deliver to 5 different zones",
      progress: 3,
      total: 5,
      reward: "$40",
      icon: MapPin,
      color: "blue",
      deadline: "2 days left"
    },
    {
      title: "Elite Status",
      type: "Rank-Based",
      description: "Stay in top 10% of drivers",
      progress: 1,
      total: 1,
      reward: "$200",
      icon: Award,
      color: "purple",
      deadline: "End of month"
    },
    {
      title: "Hot Streak",
      type: "Streak-Based",
      description: "Complete 7 consecutive days",
      progress: 5,
      total: 7,
      reward: "$60",
      icon: Flame,
      color: "red",
      deadline: "2 days left"
    },
    {
      title: "Feeder Recruiter",
      type: "Referral",
      description: "Refer 3 new drivers who complete 10 deliveries",
      progress: 1,
      total: 3,
      reward: "$150",
      icon: Users,
      color: "green",
      deadline: "No deadline"
    }
  ];

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
            
            {promotions.map((promo, idx) => (
              <div 
                key={idx} 
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
            ))}
          </div>
        )}

        {activeTab === 'challenges' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-5 h-5 text-yellow-300" />
              <h3 className="text-white text-xl font-bold tracking-wide">YOUR CHALLENGES</h3>
            </div>

            {challenges.map((challenge, idx) => {
              const IconComponent = challenge.icon;
              const progressPercentage = (challenge.progress / challenge.total) * 100;
              const colors = getChallengeColors(challenge.color);
              
              return (
                <div key={idx} className="bg-orange-50 rounded-2xl p-5 shadow-xl">
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
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                  </div>

                  <button className="w-full mt-3 bg-gradient-to-r from-orange-500 to-red-600 text-white py-2.5 rounded-full font-bold text-sm shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2">
                    <span>View Details</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default FeederPromotionsTab;

