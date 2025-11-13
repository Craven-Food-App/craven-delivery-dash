import React, { useState } from 'react';
import { Menu, Bell, Star, TrendingUp, ThumbsUp, Clock, Package } from 'lucide-react';
import { toast } from 'sonner';

type FeederRatingsTabProps = {
  onOpenMenu?: () => void;
  onOpenNotifications?: () => void;
};

const FeederRatingsTab: React.FC<FeederRatingsTabProps> = ({
  onOpenMenu,
  onOpenNotifications
}) => {
  const [selectedFilter, setSelectedFilter] = useState('all');

  const overallRating = 4.9;
  const totalRatings = 847;
  
  const stats = {
    onTime: 98,
    accuracy: 96,
    quality: 99,
    satisfaction: 94
  };

  const ratingBreakdown = [
    { stars: 5, count: 789, percentage: 93 },
    { stars: 4, count: 45, percentage: 5 },
    { stars: 3, count: 10, percentage: 1 },
    { stars: 2, count: 2, percentage: 0.5 },
    { stars: 1, count: 1, percentage: 0.5 }
  ];

  const recentReviews = [
    {
      rating: 5,
      customer: "Sarah M.",
      time: "2 hours ago",
      comment: "Amazing service! Food arrived hot and the driver was super friendly.",
      tags: ["On Time", "Professional"]
    },
    {
      rating: 5,
      customer: "Mike T.",
      time: "5 hours ago",
      comment: "Always reliable! Best delivery driver in Detroit.",
      tags: ["Fast", "Careful"]
    },
    {
      rating: 4,
      customer: "Lisa R.",
      time: "1 day ago",
      comment: "Good service, just took a bit longer than expected.",
      tags: ["Friendly"]
    }
  ];

  const getStatIconColor = (color: string) => {
    const colors: Record<string, { bg: string; icon: string }> = {
      blue: { bg: 'bg-blue-100', icon: 'text-blue-600' },
      green: { bg: 'bg-green-100', icon: 'text-green-600' },
      yellow: { bg: 'bg-yellow-100', icon: 'text-yellow-600' },
      purple: { bg: 'bg-purple-100', icon: 'text-purple-600' }
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="h-screen w-full bg-gradient-to-b from-red-600 via-orange-600 to-orange-500 overflow-y-auto safe-area-top" style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))' }}>
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between flex-shrink-0" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
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
        <h1 className="text-orange-400 text-3xl font-bold tracking-wide">RATINGS</h1>
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

      {/* Hero Rating Section */}
      <div className="px-6 mb-6">
        <div className="bg-gradient-to-br from-yellow-400 via-orange-400 to-red-500 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden">
          {/* Decorative stars background */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 left-8 text-6xl">⭐</div>
            <div className="absolute bottom-8 right-4 text-4xl">⭐</div>
            <div className="absolute top-1/2 right-12 text-3xl">⭐</div>
          </div>
          
          <div className="relative">
            <p className="text-white/90 text-sm font-semibold mb-2">Your Feeder Score</p>
            <h2 className="text-8xl font-black text-white mb-2">{overallRating}</h2>
            <div className="flex items-center justify-center gap-1 mb-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className="w-6 h-6 text-yellow-200"
                  fill="currentColor"
                />
              ))}
            </div>
            <p className="text-white font-semibold">Based on {totalRatings} feeds</p>
            <div className="mt-4 inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
              <TrendingUp className="w-4 h-4 text-white" />
              <span className="text-white text-sm font-bold">Top 5% in Detroit</span>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Stats */}
      <div className="px-6 mb-6">
        <h3 className="text-white text-xl font-bold mb-3 tracking-wide">PERFORMANCE PULSE</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: Clock, label: 'On Time', value: stats.onTime, color: 'blue' },
            { icon: Package, label: 'Accuracy', value: stats.accuracy, color: 'green' },
            { icon: Star, label: 'Quality', value: stats.quality, color: 'yellow' },
            { icon: ThumbsUp, label: 'Satisfaction', value: stats.satisfaction, color: 'purple' }
          ].map((stat, idx) => {
            const iconColors = getStatIconColor(stat.color);
            const Icon = stat.icon;
            return (
              <div key={idx} className="bg-orange-50 rounded-2xl p-4 shadow-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`${iconColors.bg} p-2 rounded-lg`}>
                    <Icon className={`w-5 h-5 ${iconColors.icon}`} />
                  </div>
                  <span className="text-gray-700 text-sm font-semibold">{stat.label}</span>
                </div>
                <p className="text-4xl font-black text-gray-900">{stat.value}%</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Rating Breakdown */}
      <div className="px-6 mb-6">
        <h3 className="text-white text-xl font-bold mb-3 tracking-wide">RATING BREAKDOWN</h3>
        <div className="bg-orange-50 rounded-2xl p-5 shadow-lg">
          {ratingBreakdown.map((item) => (
            <div key={item.stars} className="flex items-center gap-3 mb-3 last:mb-0">
              <div className="flex items-center gap-1 w-16">
                <span className="text-gray-900 font-bold">{item.stars}</span>
                <Star className="w-4 h-4 text-yellow-500" fill="currentColor" />
              </div>
              <div className="flex-1">
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full transition-all duration-500"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
              <span className="text-gray-700 text-sm font-semibold w-12 text-right">{item.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="px-6 mb-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {['All', '5 Stars', '4 Stars', 'Recent'].map((filter) => {
            const filterKey = filter.toLowerCase().replace(' ', '');
            const isSelected = selectedFilter === filterKey;
            return (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filterKey)}
                className={`px-4 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-white text-red-700 shadow-lg'
                    : 'bg-white/30 text-white'
                }`}
              >
                {filter}
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent Reviews */}
      <div className="px-6 pb-24">
        <h3 className="text-white text-xl font-bold mb-3 tracking-wide">RECENT REVIEWS</h3>
        <div className="space-y-3">
          {recentReviews.map((review, idx) => (
            <div key={idx} className="bg-orange-50 rounded-2xl p-4 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold">
                    {review.customer.charAt(0)}
                  </div>
                  <div>
                    <p className="text-gray-900 font-bold text-sm">{review.customer}</p>
                    <p className="text-gray-500 text-xs">{review.time}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-500" fill="currentColor" />
                  ))}
                </div>
              </div>
              <p className="text-gray-700 text-sm mb-3">{review.comment}</p>
              <div className="flex gap-2 flex-wrap">
                {review.tags.map((tag, i) => (
                  <span key={i} className="bg-orange-200 text-orange-800 px-3 py-1 rounded-full text-xs font-semibold">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeederRatingsTab;

