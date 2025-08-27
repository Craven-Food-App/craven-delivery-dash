import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Pause, Clock, Play } from 'lucide-react';

type EarningMode = 'perHour' | 'perOffer';
type VehicleType = 'car' | 'bike' | 'scooter' | 'walk' | 'motorcycle';

interface OnlineSearchPanelProps {
  earningMode: EarningMode;
  vehicleType: VehicleType;
  endTime: Date;
  onlineTime?: number; // seconds online
  onPause: () => void;
  onEndNow?: () => void;
  isPaused?: boolean;
}

export const OnlineSearchPanel: React.FC<OnlineSearchPanelProps> = ({
  earningMode,
  vehicleType,
  endTime,
  onlineTime = 0,
  onPause,
  onEndNow,
  isPaused = false
}) => {
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  };

  const formatEndTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <div className="absolute bottom-20 left-4 right-4 z-10">
      <Card className="backdrop-blur-md bg-card/90 border shadow-card">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isPaused ? 'bg-status-paused' : 'bg-status-online animate-pulse'}`} />
              <h2 className="text-lg font-semibold">
                {isPaused ? 'Paused' : 'Online & Ready'}
              </h2>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onPause}
                className="text-xs"
              >
                {isPaused ? (
                  <>
                    <Play className="h-3 w-3 mr-1" />
                    Resume
                  </>
                ) : (
                  <>
                    <Pause className="h-3 w-3 mr-1" />
                    Pause
                  </>
                )}
              </Button>
              {onEndNow && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={onEndNow}
                  className="text-xs"
                >
                  End Now
                </Button>
              )}
            </div>
          </div>

          {/* Progress indicator */}
          <div className="w-full bg-muted rounded-full h-1 mb-3">
            <div className="bg-primary h-1 rounded-full animate-pulse" style={{ width: '60%' }} />
          </div>

          {/* Info line */}
          <div className="text-xs text-muted-foreground mb-3">
            Filters: {vehicleType.charAt(0).toUpperCase() + vehicleType.slice(1)}, {earningMode === 'perHour' ? 'Per Hour' : 'Per Offer'} • Ends {formatEndTime(endTime)}
          </div>

          {/* Mode-specific content */}
          {earningMode === 'perHour' ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-status-online" />
                <span className="text-sm font-medium">On the clock: {formatTime(onlineTime)}</span>
              </div>
              <div className="bg-status-online/10 text-status-online px-2 py-1 rounded text-xs font-medium">
                Hourly + tips
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground text-center">
              Optimizing for best pay per mile & time
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};