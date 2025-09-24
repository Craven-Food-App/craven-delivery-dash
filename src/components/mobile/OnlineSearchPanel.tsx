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
    <>
      {/* Compact Status Bar - Top */}
      <div className="absolute top-4 left-4 right-4 z-10">
        <Card className="bg-background/95 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <div className="absolute inset-0 w-2 h-2 bg-green-500/30 rounded-full animate-ping"></div>
                </div>
                <span className="text-sm font-medium text-green-700">ONLINE</span>
                <span className="text-xl">{getVehicleIcon()}</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-lg font-bold">{formatTime(onlineTime)}</div>
                  {endTime && (
                    <div className="text-xs text-muted-foreground">
                      Until {formatEndTime(endTime)}
                    </div>
                  )}
                </div>
                {earningMode === 'perHour' ? (
                  <div className="text-right">
                    <div className="text-sm font-semibold text-green-600">$18/hr</div>
                    <div className="text-xs text-muted-foreground">+ tips</div>
                  </div>
                ) : (
                  <div className="text-right">
                    <div className="text-sm font-semibold text-blue-600">Per Offer</div>
                    <div className="text-xs text-muted-foreground">High pay</div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Floating Action Button - Bottom Right */}
      <div className="absolute bottom-20 right-4 z-10 flex flex-col gap-2">
        <Button 
          onClick={onPause} 
          size="sm"
          variant="outline"
          className="h-12 w-12 rounded-full bg-background/95 backdrop-blur-sm border-0 shadow-lg"
        >
          <Pause className="h-5 w-5" />
        </Button>
        <Button 
          onClick={onEnd} 
          size="sm"
          variant="destructive"
          className="h-12 w-12 rounded-full shadow-lg"
        >
          <Square className="h-4 w-4" />
        </Button>
      </div>

      {/* Minimal Stats Bar - Bottom */}
      <div className="absolute bottom-20 left-4 z-10">
        <Card className="bg-background/95 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-2">
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3 text-blue-500" />
                <span className="font-medium">0</span>
              </div>
              <div className="flex items-center gap-1">
                <DollarSign className="h-3 w-3 text-green-500" />
                <span className="font-medium">$0</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-orange-500" />
                <span className="font-medium">0</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};