import React, { useState, useEffect } from 'react';
import { 
  Star, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  Award,
  Target,
  ThumbsUp,
  Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';

type DriverTier = 'bronze' | 'silver' | 'gold' | 'platinum';

interface RatingStats {
  overallRating: number;
  completionRate: number;
  onTimeRate: number;
  customerRating: number;
  totalDeliveries: number;
  acceptanceRate: number;
  tier: DriverTier;
}

interface TierRequirements {
  minRating: number;
  minCompletionRate: number;
  minAcceptanceRate: number;
  minOnTimeRate: number;
}

const tierConfig: Record<DriverTier, { 
  name: string; 
  color: string; 
  bgColor: string;
  icon: string;
  requirements: TierRequirements;
}> = {
  bronze: {
    name: 'Bronze',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    icon: '🥉',
    requirements: { minRating: 4.0, minCompletionRate: 80, minAcceptanceRate: 60, minOnTimeRate: 85 }
  },
  silver: {
    name: 'Silver',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    icon: '🥈',
    requirements: { minRating: 4.3, minCompletionRate: 85, minAcceptanceRate: 70, minOnTimeRate: 88 }
  },
  gold: {
    name: 'Gold',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    icon: '🥇',
    requirements: { minRating: 4.5, minCompletionRate: 90, minAcceptanceRate: 75, minOnTimeRate: 90 }
  },
  platinum: {
    name: 'Platinum',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    icon: '💎',
    requirements: { minRating: 4.7, minCompletionRate: 95, minAcceptanceRate: 80, minOnTimeRate: 95 }
  }
};

const getNextTier = (currentTier: DriverTier): DriverTier | null => {
  const tiers: DriverTier[] = ['bronze', 'silver', 'gold', 'platinum'];
  const currentIndex = tiers.indexOf(currentTier);
  return currentIndex < tiers.length - 1 ? tiers[currentIndex + 1] : null;
};

export const RatingsSection: React.FC = () => {
  const [stats] = useState<RatingStats>({
    overallRating: 4.6,
    completionRate: 92,
    onTimeRate: 88,
    customerRating: 4.8,
    totalDeliveries: 247,
    acceptanceRate: 78,
    tier: 'gold'
  });

  const currentTierConfig = tierConfig[stats.tier];
  const nextTier = getNextTier(stats.tier);
  const nextTierConfig = nextTier ? tierConfig[nextTier] : null;

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(rating) 
            ? 'fill-yellow-400 text-yellow-400' 
            : i < rating 
            ? 'fill-yellow-200 text-yellow-400' 
            : 'text-gray-300'
        }`}
      />
    ));
  };

  const getProgressToNextTier = () => {
    if (!nextTierConfig) return 100;
    
    const requirements = nextTierConfig.requirements;
    const current = stats;
    
    const ratingProgress = Math.min((current.overallRating / requirements.minRating) * 100, 100);
    const completionProgress = Math.min((current.completionRate / requirements.minCompletionRate) * 100, 100);
    const acceptanceProgress = Math.min((current.acceptanceRate / requirements.minAcceptanceRate) * 100, 100);
    const onTimeProgress = Math.min((current.onTimeRate / requirements.minOnTimeRate) * 100, 100);
    
    return Math.min((ratingProgress + completionProgress + acceptanceProgress + onTimeProgress) / 4, 100);
  };

  return (
    <div className="min-h-screen bg-background pb-16">
      <div className="max-w-md mx-auto p-4 space-y-4">
        
        {/* Current Tier Badge */}
        <Card className={`${currentTierConfig.bgColor} border-2`}>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-4xl mb-2">{currentTierConfig.icon}</div>
              <h1 className={`text-2xl font-bold ${currentTierConfig.color}`}>
                {currentTierConfig.name} Craver
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {stats.totalDeliveries} deliveries completed
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Overall Rating */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              Overall Rating
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {renderStars(stats.overallRating)}
                <span className="text-2xl font-bold ml-2">{stats.overallRating}</span>
              </div>
              <Badge variant="secondary">{stats.totalDeliveries} ratings</Badge>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Customer Rating</span>
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{stats.customerRating}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-500" />
                <p className="text-2xl font-bold">{stats.completionRate}%</p>
                <p className="text-xs text-muted-foreground">Completion Rate</p>
              </div>
              <div className="text-center">
                <Clock className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                <p className="text-2xl font-bold">{stats.onTimeRate}%</p>
                <p className="text-xs text-muted-foreground">On Time</p>
              </div>
            </div>
            
            <Separator />
            
            <div className="text-center">
              <ThumbsUp className="h-6 w-6 mx-auto mb-2 text-purple-500" />
              <p className="text-2xl font-bold">{stats.acceptanceRate}%</p>
              <p className="text-xs text-muted-foreground">Acceptance Rate</p>
            </div>
          </CardContent>
        </Card>

        {/* Next Tier Progress */}
        {nextTierConfig && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Progress to {nextTierConfig.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Overall Progress</span>
                <span className="text-sm text-muted-foreground">
                  {Math.round(getProgressToNextTier())}%
                </span>
              </div>
              <Progress value={getProgressToNextTier()} className="h-2" />
              
              <div className="space-y-3 mt-4">
                <h4 className="font-medium text-sm">Requirements for {nextTierConfig.name}:</h4>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span>Rating: {nextTierConfig.requirements.minRating}+</span>
                    <Badge variant={stats.overallRating >= nextTierConfig.requirements.minRating ? "default" : "secondary"}>
                      {stats.overallRating >= nextTierConfig.requirements.minRating ? "✓" : stats.overallRating}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span>Completion: {nextTierConfig.requirements.minCompletionRate}%+</span>
                    <Badge variant={stats.completionRate >= nextTierConfig.requirements.minCompletionRate ? "default" : "secondary"}>
                      {stats.completionRate >= nextTierConfig.requirements.minCompletionRate ? "✓" : `${stats.completionRate}%`}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span>Acceptance: {nextTierConfig.requirements.minAcceptanceRate}%+</span>
                    <Badge variant={stats.acceptanceRate >= nextTierConfig.requirements.minAcceptanceRate ? "default" : "secondary"}>
                      {stats.acceptanceRate >= nextTierConfig.requirements.minAcceptanceRate ? "✓" : `${stats.acceptanceRate}%`}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span>On Time: {nextTierConfig.requirements.minOnTimeRate}%+</span>
                    <Badge variant={stats.onTimeRate >= nextTierConfig.requirements.minOnTimeRate ? "default" : "secondary"}>
                      {stats.onTimeRate >= nextTierConfig.requirements.minOnTimeRate ? "✓" : `${stats.onTimeRate}%`}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tier Benefits */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              {currentTierConfig.name} Benefits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {stats.tier === 'bronze' && (
                <>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Basic support access</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Standard delivery opportunities</span>
                  </div>
                </>
              )}
              
              {stats.tier === 'silver' && (
                <>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Priority support access</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Higher paying opportunities</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Weekly performance bonuses</span>
                  </div>
                </>
              )}
              
              {stats.tier === 'gold' && (
                <>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Premium support access</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Priority on high-value orders</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>5% earnings boost on all deliveries</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Monthly performance bonuses</span>
                  </div>
                </>
              )}
              
              {stats.tier === 'platinum' && (
                <>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>VIP support line</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>First access to premium orders</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>10% earnings boost on all deliveries</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Exclusive high-value delivery access</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Special recognition and rewards</span>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Recent Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center text-muted-foreground">
              <Calendar className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">Performance trends coming soon</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};