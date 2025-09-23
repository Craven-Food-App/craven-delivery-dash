import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Pause, Play, Square, Clock, DollarSign, MapPin, Zap } from 'lucide-react';

type EarningMode = 'perHour' | 'perOffer';
type VehicleType = 'car' | 'bike' | 'scooter' | 'walk' | 'motorcycle';

interface OnlineSearchPanelProps {
  earningMode: EarningMode;
  vehicleType: VehicleType;
  endTime: Date | null;
  onlineTime: number;
  onPause: () => void;
  onEnd: () => void;
}

export const OnlineSearchPanel: React.FC<OnlineSearchPanelProps> = ({
  earningMode,
  vehicleType,
  endTime,
  onlineTime,
  onPause,
  onEnd
}) => {
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  };

  const formatEndTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getProgress = (): number => {
    if (!endTime) return 0;
    const now = new Date();
    const start = new Date(now.getTime() - onlineTime * 1000);
    const total = endTime.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    return Math.min((elapsed / total) * 100, 100);
  };

  const getVehicleIcon = () => {
    switch(vehicleType) {
      case 'car': return '🚗';
      case 'bike': return '🚲';
      case 'scooter': return '🛴';
      case 'motorcycle': return '🏍️';
      case 'walk': return '🚶';
      default: return '🚗';
    }
  };

  return (
    <div className="absolute bottom-20 left-4 right-4 z-10 space-y-4">
      {/* Main Status Card */}
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 backdrop-blur-md">
        <CardContent className="p-6">
          {/* Status Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
                <div className="absolute inset-0 w-4 h-4 bg-green-500/30 rounded-full animate-ping"></div>
              </div>
              <div>
                <h3 className="font-bold text-lg text-green-800">Online & Ready</h3>
                <p className="text-sm text-green-600">Searching for delivery offers</p>
              </div>
            </div>
            <div className="text-2xl">{getVehicleIcon()}</div>
          </div>

          {/* Time Display */}
          <div className="text-center mb-6">
            <div className="text-4xl font-bold text-green-700 mb-2">
              {formatTime(onlineTime)}
            </div>
            {endTime && (
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span className="text-sm">Until {formatEndTime(endTime)}</span>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          {endTime && (
            <div className="mb-6">
              <Progress value={getProgress()} className="h-3 bg-green-100" />
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>Session progress</span>
                <span>{Math.round(getProgress())}%</span>
              </div>
            </div>
          )}

          {/* Earning Mode Display */}
          <div className="flex items-center justify-center gap-3 mb-6 p-3 bg-white/50 rounded-lg">
            {earningMode === 'perHour' ? (
              <>
                <DollarSign className="h-5 w-5 text-green-600" />
                <div className="text-center">
                  <div className="font-semibold text-green-800">$18/hour</div>
                  <div className="text-xs text-muted-foreground">+ 100% of tips</div>
                </div>
              </>
            ) : (
              <>
                <Zap className="h-5 w-5 text-blue-600" />
                <div className="text-center">
                  <div className="font-semibold text-blue-800">Per Offer Mode</div>
                  <div className="text-xs text-muted-foreground">Higher earning potential</div>
                </div>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={onPause} 
              className="flex-1 border-green-200 hover:bg-green-50" 
              size="lg"
            >
              <Pause className="h-4 w-4 mr-2" />
              Pause
            </Button>
            <Button 
              variant="destructive" 
              onClick={onEnd} 
              className="flex-1" 
              size="lg"
            >
              <Square className="h-4 w-4 mr-2" />
              End Session
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-blue-50 border-blue-200 backdrop-blur-md">
          <CardContent className="p-3 text-center">
            <MapPin className="h-5 w-5 mx-auto mb-1 text-blue-600" />
            <div className="text-lg font-bold text-blue-800">0</div>
            <div className="text-xs text-muted-foreground">Offers</div>
          </CardContent>
        </Card>
        
        <Card className="bg-purple-50 border-purple-200 backdrop-blur-md">
          <CardContent className="p-3 text-center">
            <DollarSign className="h-5 w-5 mx-auto mb-1 text-purple-600" />
            <div className="text-lg font-bold text-purple-800">$0</div>
            <div className="text-xs text-muted-foreground">Earned</div>
          </CardContent>
        </Card>
        
        <Card className="bg-orange-50 border-orange-200 backdrop-blur-md">
          <CardContent className="p-3 text-center">
            <Clock className="h-5 w-5 mx-auto mb-1 text-orange-600" />
            <div className="text-lg font-bold text-orange-800">0</div>
            <div className="text-xs text-muted-foreground">Deliveries</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};