import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Gift, Star, TrendingUp, Award, Zap, 
  Calendar, ShoppingBag, Heart, Crown 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LoyaltyDashboardProps {
  userId?: string;
}

export const LoyaltyDashboard = ({ userId }: LoyaltyDashboardProps) => {
  const navigate = useNavigate();

  // Mock data - replace with real data from Supabase
  const userPoints = 850;
  const userTier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' = 'Gold';
  const pointsToNextTier = 150;
  const totalOrders = 24;
  const lifetimeSpent = 487.50;

  const tiers = [
    { name: 'Bronze', minPoints: 0, color: 'bg-orange-600', benefits: ['5% off', 'Birthday reward'] },
    { name: 'Silver', minPoints: 500, color: 'bg-gray-400', benefits: ['10% off', 'Free delivery monthly', 'Early access'] },
    { name: 'Gold', minPoints: 1000, color: 'bg-yellow-500', benefits: ['15% off', 'Free delivery always', 'Priority support'] },
    { name: 'Platinum', minPoints: 2500, color: 'bg-purple-600', benefits: ['20% off', 'Concierge service', 'Exclusive events'] },
  ];

  const rewards = [
    { id: 1, name: '$5 Off Order', points: 500, icon: Gift },
    { id: 2, name: 'Free Delivery', points: 200, icon: Zap },
    { id: 3, name: '$10 Off Order', points: 1000, icon: Gift },
    { id: 4, name: 'Free Appetizer', points: 300, icon: ShoppingBag },
  ];

  const recentActivity = [
    { date: '2025-01-15', description: 'Ordered from Italian Bistro', points: 50 },
    { date: '2025-01-12', description: 'Redeemed Free Delivery', points: -200 },
    { date: '2025-01-10', description: 'Ordered from Sushi Palace', points: 75 },
  ];

  const progressPercentage = (userPoints / (pointsToNextTier + userPoints)) * 100;

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-3xl font-bold mb-2">Crave'N Rewards</h2>
              <p className="opacity-90">Earn points with every order!</p>
            </div>
            <Crown className="h-16 w-16 opacity-50" />
          </div>
          
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div>
              <p className="text-sm opacity-75">Your Points</p>
              <p className="text-2xl font-bold">{userPoints}</p>
            </div>
            <div>
              <p className="text-sm opacity-75">Tier</p>
              <p className="text-2xl font-bold">{userTier}</p>
            </div>
            <div>
              <p className="text-sm opacity-75">Orders</p>
              <p className="text-2xl font-bold">{totalOrders}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress to Next Tier */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {userTier === 'Platinum' as string ? 'Maximum Tier Reached!' : 'Progress to Next Tier'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(userTier as string) === 'Platinum' ? (
            <div className="text-center py-4">
              <Crown className="h-12 w-12 mx-auto mb-2 text-purple-600" />
              <p className="font-semibold">You've reached the highest tier!</p>
              <p className="text-sm text-muted-foreground">Enjoy all premium benefits</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Current: {userPoints} points</span>
                <span>Next: {userPoints + pointsToNextTier} points</span>
              </div>
              <Progress value={progressPercentage} className="h-3" />
              <p className="text-sm text-muted-foreground">
                {pointsToNextTier} more points to reach next tier!
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tier Benefits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Membership Tiers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={`p-4 rounded-lg border-2 ${
                  tier.name === userTier ? 'border-primary bg-primary/5' : 'border-border'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${tier.color}`} />
                    <h4 className="font-semibold">{tier.name}</h4>
                  </div>
                  <Badge variant={tier.name === userTier ? 'default' : 'outline'}>
                    {tier.minPoints}+ points
                  </Badge>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {tier.benefits.map((benefit, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Award className="h-3 w-3" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Available Rewards */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Redeem Rewards
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rewards.map((reward) => {
              const Icon = reward.icon;
              const canRedeem = userPoints >= reward.points;
              
              return (
                <Card key={reward.id} className={!canRedeem ? 'opacity-50' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <Icon className="h-8 w-8 text-primary" />
                      <Badge variant={canRedeem ? 'default' : 'outline'}>
                        {reward.points} pts
                      </Badge>
                    </div>
                    <h4 className="font-semibold mb-2">{reward.name}</h4>
                    <Button 
                      size="sm" 
                      className="w-full" 
                      disabled={!canRedeem}
                      variant={canRedeem ? 'default' : 'outline'}
                    >
                      {canRedeem ? 'Redeem' : 'Not Enough Points'}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="font-medium text-sm">{activity.description}</p>
                  <p className="text-xs text-muted-foreground">{activity.date}</p>
                </div>
                <Badge variant={activity.points > 0 ? 'default' : 'outline'}>
                  {activity.points > 0 ? '+' : ''}{activity.points} pts
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <ShoppingBag className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{totalOrders}</p>
            <p className="text-sm text-muted-foreground">Total Orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Heart className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">${lifetimeSpent.toFixed(2)}</p>
            <p className="text-sm text-muted-foreground">Lifetime Spent</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
