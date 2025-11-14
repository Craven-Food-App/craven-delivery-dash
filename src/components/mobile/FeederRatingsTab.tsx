import React, { useState, useEffect } from 'react';
import { Menu, Bell, Star, TrendingUp, ThumbsUp, Clock, Package } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

type FeederRatingsTabProps = {
  onOpenMenu?: () => void;
  onOpenNotifications?: () => void;
};

const FeederRatingsTab: React.FC<FeederRatingsTabProps> = ({
  onOpenMenu,
  onOpenNotifications
}) => {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [overallRating, setOverallRating] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);
  const [stats, setStats] = useState({
    onTime: 0,
    accuracy: 0,
    quality: 0,
    satisfaction: 0
  });
  const [ratingBreakdown, setRatingBreakdown] = useState<Array<{ stars: number; count: number; percentage: number }>>([]);
  const [recentReviews, setRecentReviews] = useState<Array<{
    rating: number;
    customer: string;
    time: string;
    comment: string;
    tags: string[];
  }>>([]);
  const [cityPercentile, setCityPercentile] = useState<number | null>(null);

  useEffect(() => {
    fetchRatingsData();
  }, [selectedFilter]);

  const fetchRatingsData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch driver profile for overall rating
      const { data: profile } = await supabase
        .from('driver_profiles')
        .select('rating, total_deliveries')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        setOverallRating(Number(profile.rating) || 0);
        setTotalRatings(profile.total_deliveries || 0);
      }

      // Fetch performance metrics - table not available yet
      // Using fallback: calculate from order_feedback
      // const { data: metrics } = await supabase
      //   .from('driver_performance_metrics')
      //   .select('*')
      //   .eq('driver_id', user.id)
      //   .single();

      // Fallback: calculate from order_feedback
      const { data: feedback } = await supabase
          .from('order_feedback')
          .select('rating, comment, created_at, customer_id')
          .eq('driver_id', user.id)
          .eq('feedback_type', 'customer_to_driver')
          .not('rating', 'is', null)
          .order('created_at', { ascending: false });

        if (feedback && feedback.length > 0) {
          const avgRating = feedback.reduce((sum, f) => sum + (f.rating || 0), 0) / feedback.length;
          setStats({
            onTime: Math.round(avgRating * 20),
            accuracy: Math.round(avgRating * 20),
            quality: Math.round(avgRating * 20),
            satisfaction: Math.round(avgRating * 20)
          });
        }

      // Fetch rating breakdown from order_feedback
      const { data: allFeedback } = await supabase
        .from('order_feedback')
        .select('rating')
        .eq('driver_id', user.id)
        .eq('feedback_type', 'customer_to_driver')
        .not('rating', 'is', null);

      if (allFeedback && allFeedback.length > 0) {
        const breakdown = [5, 4, 3, 2, 1].map(stars => {
          const count = allFeedback.filter(f => f.rating === stars).length;
          const percentage = (count / allFeedback.length) * 100;
          return { stars, count, percentage: Math.round(percentage * 10) / 10 };
        });
        setRatingBreakdown(breakdown);
        setTotalRatings(allFeedback.length);
      } else {
        // Default empty breakdown
        setRatingBreakdown([
          { stars: 5, count: 0, percentage: 0 },
          { stars: 4, count: 0, percentage: 0 },
          { stars: 3, count: 0, percentage: 0 },
          { stars: 2, count: 0, percentage: 0 },
          { stars: 1, count: 0, percentage: 0 }
        ]);
      }

      // Fetch recent reviews with customer info
      let reviewsQuery = supabase
        .from('order_feedback')
        .select('rating, comment, created_at, customer_id, order_id, customer:users!order_feedback_customer_id_fkey(email, full_name)')
        .eq('driver_id', user.id)
        .eq('feedback_type', 'customer_to_driver')
        .not('rating', 'is', null)
        .order('created_at', { ascending: false })
        .limit(10);

      // Apply filter
      if (selectedFilter === '5stars') {
        reviewsQuery = reviewsQuery.eq('rating', 5);
      } else if (selectedFilter === '4stars') {
        reviewsQuery = reviewsQuery.eq('rating', 4);
      } else if (selectedFilter === 'recent') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        reviewsQuery = reviewsQuery.gte('created_at', weekAgo.toISOString());
      }

      const { data: reviews } = await reviewsQuery;

      if (reviews) {
        const formattedReviews = reviews.map(review => {
          const customer = review.customer as any;
          const customerName = customer?.full_name || customer?.email?.split('@')[0] || 'Customer';
          const nameParts = customerName.split(' ');
          const displayName = nameParts.length > 1 
            ? `${nameParts[0]} ${nameParts[nameParts.length - 1].charAt(0)}.`
            : customerName;

          const timeAgo = getTimeAgo(new Date(review.created_at));
          
          // Extract tags from comment or use defaults
          const tags: string[] = [];
          if (review.comment) {
            const commentLower = review.comment.toLowerCase();
            if (commentLower.includes('fast') || commentLower.includes('quick')) tags.push('Fast');
            if (commentLower.includes('friendly') || commentLower.includes('nice')) tags.push('Friendly');
            if (commentLower.includes('professional')) tags.push('Professional');
            if (commentLower.includes('careful') || commentLower.includes('care')) tags.push('Careful');
            if (commentLower.includes('on time') || commentLower.includes('timely')) tags.push('On Time');
          }
          if (tags.length === 0 && review.rating === 5) {
            tags.push('Great Service');
          }

          return {
            rating: review.rating || 5,
            customer: displayName,
            time: timeAgo,
            comment: review.comment || 'No comment provided',
            tags: tags.length > 0 ? tags : ['Satisfied']
          };
        });
        setRecentReviews(formattedReviews);
      }
    } catch (error) {
      console.error('Error fetching ratings:', error);
      toast.error('Failed to load ratings');
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getStatIconColor = (color: string) => {
    const colors: Record<string, { bg: string; icon: string }> = {
      blue: { bg: 'bg-blue-100', icon: 'text-blue-600' },
      green: { bg: 'bg-green-100', icon: 'text-green-600' },
      yellow: { bg: 'bg-yellow-100', icon: 'text-yellow-600' },
      purple: { bg: 'bg-purple-100', icon: 'text-purple-600' }
    };
    return colors[color] || colors.blue;
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
            <h2 className="text-8xl font-black text-white mb-2">{overallRating.toFixed(1)}</h2>
            <div className="flex items-center justify-center gap-1 mb-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-6 h-6 ${star <= Math.round(overallRating) ? 'text-yellow-200' : 'text-white/30'}`}
                  fill={star <= Math.round(overallRating) ? 'currentColor' : 'none'}
                />
              ))}
            </div>
            <p className="text-white font-semibold">Based on {totalRatings} {totalRatings === 1 ? 'feed' : 'feeds'}</p>
            {cityPercentile && (
              <div className="mt-4 inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                <TrendingUp className="w-4 h-4 text-white" />
                <span className="text-white text-sm font-bold">Top {cityPercentile}% in your city</span>
              </div>
            )}
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
          {ratingBreakdown.length > 0 ? ratingBreakdown.map((item) => (
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
          )) : (
            <p className="text-gray-500 text-center py-4">No ratings yet</p>
          )}
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
        {recentReviews.length > 0 ? (
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
                {review.tags.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {review.tags.map((tag, i) => (
                      <span key={i} className="bg-orange-200 text-orange-800 px-3 py-1 rounded-full text-xs font-semibold">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-orange-50 rounded-2xl p-8 text-center shadow-lg">
            <p className="text-gray-500">No reviews yet</p>
            <p className="text-sm text-gray-400 mt-2">Your customer reviews will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeederRatingsTab;
