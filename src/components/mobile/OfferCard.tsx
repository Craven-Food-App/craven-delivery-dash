import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, MapPin, Clock, Package } from 'lucide-react';

interface Offer {
  id: string;
  pickupName: string;
  pickupRating: number;
  dropoffDistance: number;
  estimatedTime: number;
  estimatedPay: number;
  itemCount: number;
  miles: number;
}

interface OfferCardProps {
  offer: Offer;
  onAccept: (offerId: string) => void;
  onDecline: (offerId: string) => void;
  countdownSeconds?: number;
}

export const OfferCard: React.FC<OfferCardProps> = ({
  offer,
  onAccept,
  onDecline,
  countdownSeconds = 30
}) => {
  const [timeLeft, setTimeLeft] = useState(countdownSeconds);

  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          onDecline(offer.id); // Auto-decline when time runs out
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, offer.id, onDecline]);

  const progressPercentage = (timeLeft / countdownSeconds) * 100;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end">
      <div className="w-full p-4">
        <Card className="w-full animate-slide-up shadow-hover">
          <CardContent className="p-6">
            {/* Countdown bar */}
            <div className="w-full bg-muted rounded-full h-1 mb-4">
              <div 
                className="bg-primary h-1 rounded-full transition-all duration-1000 ease-linear"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>

            {/* Pickup info */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-lg">{offer.pickupName}</h3>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{offer.pickupRating}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{offer.dropoffDistance} mi</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{offer.estimatedTime} min</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Package className="h-4 w-4" />
                    <span>{offer.itemCount} items</span>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-2xl font-bold text-status-online">
                  ${offer.estimatedPay.toFixed(2)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {offer.miles.toFixed(1)} mi total
                </div>
              </div>
            </div>

            {/* Time remaining indicator */}
            <div className="text-center mb-4">
              <Badge variant="outline" className="text-sm">
                {timeLeft}s remaining
              </Badge>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => onDecline(offer.id)}
                className="flex-1"
              >
                Decline
              </Button>
              <Button
                onClick={() => onAccept(offer.id)}
                className="flex-1 bg-status-online hover:bg-status-online/90"
              >
                Accept
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};