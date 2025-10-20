import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Star,
  TrendingUp,
  TrendingDown,
  Award,
  MessageCircle,
  CheckCircle,
  Clock,
  Target
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getRatingColor, getRatingTier, formatRating, getTrendIcon, getTrendColor, COMPLIMENT_OPTIONS } from '@/utils/ratingHelpers';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

export function DriverRatingsPage() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<any>(null);
  const [recentRatings, setRecentRatings] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [ratingHistory, setRatingHistory] = useState<any[]>([]);

  useEffect(() => {
    fetchRatingData();
  }, []);

  const fetchRatingData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch driver profile (use existing table)
      const { data: profileData } = await supabase
        .from('driver_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // Fetch recent ratings from order_feedback
      const { data: ratingsData } = await supabase
        .from('order_feedback')
        .select('*')
        .eq('driver_id', user.id)
        .not('driver_rating', 'is', null)
        .order('created_at', { ascending: false })
        .limit(10);

      setRecentRatings(ratingsData || []);

      // Set metrics from profile data
      setMetrics({
        overall_rating: Number(profileData?.rating) || 5.0,
        total_ratings: ratingsData?.length || 0,
        total_deliveries: profileData?.total_deliveries || 0,
        avg_communication: 5.0,
        avg_professionalism: 5.0,
        avg_speed: 5.0,
        avg_food_care: 5.0,
        acceptance_rate: 100,
        completion_rate: 100,
        on_time_rate: 100,
        rating_trend_7d: 0,
        current_5star_streak: 0,
      });

      // Achievements - mock for now
      setAchievements([]);

      // Mock rating history for chart (last 7 days)
      const history = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        history.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          rating: 4.8 + (Math.random() * 0.3)
        });
      }
      setRatingHistory(history);

    } catch (error) {
      console.error('Error fetching rating data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Star className="h-12 w-12 animate-pulse" style={{ color: RATING_COLORS.GOLD }} />
      </div>
    );
  }

  const tier = getRatingTier(metrics?.overall_rating || 5.0, metrics?.total_deliveries || 0);
  const ratingColor = getRatingColor(metrics?.overall_rating || 5.0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b shadow-sm safe-area-top">
        <div className="p-4">
          <h1 className="text-3xl font-bold text-slate-900 text-right">Ratings</h1>
          <p className="text-sm text-slate-600 text-right">Performance breakdown and feedback</p>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Overall Rating Card */}
        <Card className="border-2" style={{ borderColor: ratingColor }}>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Star className="h-8 w-8 fill-current" style={{ color: ratingColor }} />
                  <span className="text-5xl font-bold" style={{ color: ratingColor }}>
                    {formatRating(metrics?.overall_rating || 5.0)}
                  </span>
                </div>
                <p className="text-sm text-gray-600">out of 5.00</p>
              </div>

              <Badge 
                className="text-white text-lg px-4 py-2"
                style={{ backgroundColor: tier.color }}
              >
                {tier.icon} {tier.name}
              </Badge>

              {metrics?.rating_trend_7d !== 0 && (
                <div 
                  className="text-sm font-semibold"
                  style={{ color: getTrendColor(metrics.rating_trend_7d) }}
                >
                  {getTrendIcon(metrics.rating_trend_7d)} {metrics.rating_trend_7d > 0 ? '+' : ''}
                  {metrics.rating_trend_7d.toFixed(2)} this week
                </div>
              )}

              <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
                <span>{metrics?.total_ratings || 0} ratings</span>
                <span>•</span>
                <span>{metrics?.total_deliveries || 0} deliveries</span>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full transition-all duration-500"
                    style={{ 
                      width: `${((metrics?.overall_rating || 5.0) / 5) * 100}%`,
                      backgroundColor: ratingColor
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  {((metrics?.overall_rating || 5.0) / 5 * 100).toFixed(1)}% perfect rating
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Rating Categories</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: 'Communication', value: metrics?.avg_communication || 5.0, icon: MessageCircle },
              { label: 'Professionalism', value: metrics?.avg_professionalism || 5.0, icon: Award },
              { label: 'Speed', value: metrics?.avg_speed || 5.0, icon: TrendingUp },
              { label: 'Food Care', value: metrics?.avg_food_care || 5.0, icon: CheckCircle },
            ].map((category) => (
              <div key={category.label} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <category.icon className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium">{category.label}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3 w-3 ${i < Math.floor(category.value) ? 'fill-current' : ''}`}
                        style={{ color: i < Math.floor(category.value) ? getRatingColor(category.value) : '#d1d5db' }}
                      />
                    ))}
                    <span className="text-sm font-bold ml-1" style={{ color: getRatingColor(category.value) }}>
                      {category.value.toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all"
                    style={{
                      width: `${(category.value / 5) * 100}%`,
                      backgroundColor: getRatingColor(category.value)
                    }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: 'Acceptance Rate', value: metrics?.acceptance_rate || 100, icon: CheckCircle, target: 90 },
              { label: 'Completion Rate', value: metrics?.completion_rate || 100, icon: Target, target: 95 },
              { label: 'On-Time Rate', value: metrics?.on_time_rate || 100, icon: Clock, target: 90 },
            ].map((metric) => (
              <div key={metric.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <metric.icon className="h-4 w-4 text-gray-600" />
                  <span className="text-sm">{metric.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold ${metric.value >= metric.target ? 'text-green-600' : 'text-orange-600'}`}>
                    {metric.value.toFixed(0)}%
                  </span>
                  {metric.value >= metric.target && (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* 7-Day Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Last 7 Days Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={ratingHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" style={{ fontSize: '12px' }} />
                <YAxis domain={[4.0, 5.0]} style={{ fontSize: '12px' }} />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="rating" 
                  stroke={ratingColor}
                  fill={ratingColor}
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
            <p className="text-center text-sm text-gray-600 mt-2">
              {metrics?.rating_trend_7d > 0 ? '📈' : metrics?.rating_trend_7d < 0 ? '📉' : '→'} 
              {' '}{metrics?.rating_trend_7d > 0 ? '+' : ''}{(metrics?.rating_trend_7d || 0).toFixed(2)} from last week
            </p>
          </CardContent>
        </Card>

        {/* Achievements */}
        {achievements.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🏆 Achievements Unlocked</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {achievements.map((unlock: any) => (
                  <div
                    key={unlock.id}
                    className="p-3 rounded-lg border-2 bg-gradient-to-br from-white to-gray-50"
                    style={{ borderColor: unlock.achievement?.tier === 'platinum' ? RATING_COLORS.PLATINUM : 
                                         unlock.achievement?.tier === 'gold' ? RATING_COLORS.GOLD :
                                         unlock.achievement?.tier === 'silver' ? RATING_COLORS.SILVER :
                                         RATING_COLORS.BRONZE }}
                  >
                    <div className="text-center space-y-1">
                      <div className="text-3xl">{unlock.achievement?.icon}</div>
                      <p className="font-semibold text-xs">{unlock.achievement?.title}</p>
                      <p className="text-xs text-gray-500">{unlock.achievement?.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Current Streak */}
        {metrics?.current_5star_streak > 0 && (
          <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="text-4xl">🔥</div>
                <div>
                  <p className="font-bold text-lg">
                    {metrics.current_5star_streak} Delivery Streak!
                  </p>
                  <p className="text-sm text-gray-600">
                    {metrics.current_5star_streak} five-star ratings in a row
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Feedback */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">💬 Recent Feedback</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentRatings.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <Star className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>No ratings yet. Complete deliveries to get feedback!</p>
              </div>
            ) : (
              recentRatings.map((rating) => (
                <div key={rating.id} className="p-3 bg-gray-50 rounded-lg border">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${i < (rating.driver_rating || 0) ? 'fill-current text-yellow-500' : 'text-gray-300'}`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(rating.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  {rating.comments && (
                    <p className="text-sm text-gray-700 italic">"{rating.comments}"</p>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Tips to Improve */}
        {metrics?.overall_rating < 4.8 && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <TrendingUp className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                <div className="space-y-2">
                  <h4 className="font-semibold text-blue-900">Tips to Reach {tier.name === 'Elite' ? 'Elite Status' : 'Next Tier'}:</h4>
                  <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                    {metrics?.avg_communication < 4.8 && (
                      <li>Keep customers updated with delivery status</li>
                    )}
                    {metrics?.avg_speed < 4.8 && (
                      <li>Aim to deliver 2-3 minutes earlier than estimated</li>
                    )}
                    {metrics?.avg_food_care < 4.8 && (
                      <li>Use insulated bags and keep food level</li>
                    )}
                    {metrics?.acceptance_rate < 90 && (
                      <li>Accept more orders to improve acceptance rate</li>
                    )}
                    <li>Maintain a {tier.name === 'Elite' ? '4.8+' : '4.5+'} rating for {tier.name === 'Elite' ? '100' : '50'} deliveries</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// Import this in the component
import { RATING_COLORS } from '@/utils/ratingHelpers';

