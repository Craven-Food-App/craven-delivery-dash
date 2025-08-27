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
    <div className="flex flex-col h-full">
      {/* Mobile Header */}
      <div className="p-4 bg-card border-b border-border/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isPaused ? 'bg-orange-500 animate-pulse' : 'bg-green-500 animate-pulse'}`} />
            <div>
              <h1 className="text-lg font-semibold text-foreground">
                {isPaused ? 'Paused' : 'Looking for orders'}
              </h1>
              <p className="text-sm text-muted-foreground">Online since {formatTime(onlineTime)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={isPaused ? "default" : "outline"}
              size="sm"
              onClick={onPause}
              className="rounded-full"
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
                className="rounded-full text-xs"
              >
                End
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="p-4 space-y-4 flex-1">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card rounded-2xl p-4 border border-border/30">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">
                {formatTime(onlineTime)}
              </div>
              <div className="text-sm text-muted-foreground">Online time</div>
            </div>
          </div>
          <div className="bg-card rounded-2xl p-4 border border-border/30">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">$0.00</div>
              <div className="text-sm text-muted-foreground">Earned today</div>
            </div>
          </div>
        </div>

        {/* Activity Status */}
        <div className="bg-card rounded-2xl p-4 border border-border/30">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-foreground">Activity</h3>
            <div className="text-xs text-muted-foreground">
              Ends {formatEndTime(endTime)}
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-muted rounded-full h-2 mb-3">
            <div className="bg-primary h-2 rounded-full transition-all duration-1000" style={{ width: '60%' }} />
          </div>

          {/* Mode info */}
          {earningMode === 'perHour' ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Hourly mode</span>
              </div>
              <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                ${vehicleType === 'car' ? '15' : '12'}/hr + tips
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="text-sm text-muted-foreground">
                Optimizing for best offers
              </div>
            </div>
          )}
        </div>

        {/* No orders message */}
        {!isPaused && (
          <div className="bg-muted/30 rounded-2xl p-4 text-center">
            <div className="text-muted-foreground text-sm">
              Looking for nearby orders...
            </div>
            <div className="flex justify-center mt-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};