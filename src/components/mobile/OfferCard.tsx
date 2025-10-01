import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Offer {
  id: string;
  pickupName: string;
  pickupRating: number;
  dropoffDistance: number;
  estimatedTime: number;
  estimatedPay: number;
  itemCount: number;
  miles: number;
  routeImageUrl?: string; // Optional map preview
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
    setTimeLeft(countdownSeconds); // Reset timer on offer change
  }, [offer.id, countdownSeconds]);

  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  useEffect(() => {
    if (timeLeft === 0) {
      onDecline(offer.id); // Auto-decline when timer hits zero
    }
  }, [timeLeft, offer.id, onDecline]);

  const progressPercentage = useMemo(() => (timeLeft / countdownSeconds) * 100, [timeLeft, countdownSeconds]);

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end">
      <div className="w-full p-4">
        <Card className="w-full animate-slide-up shadow-lg rounded-xl overflow-hidden">
          <CardContent className="p-0 relative">

            {/* Countdown badge */}
            <div className="absolute top-2 right-4 z-10">
              <Badge variant="outline" className="text-xs">
                {timeLeft}s left
              </Badge>
            </div>

            {/* Countdown bar */}
            <div className="w-full bg-muted h-1">
              <div
                className={`h-1 transition-all duration-1000 ease-linear ${timeLeft <= 10 ? 'bg-red-500' : 'bg-primary'}`}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>

            {/* Map preview */}
            {offer.routeImageUrl && (
              <div className="w-full h-48 bg-gray-200 animate-pulse">
                <img
                  src={offer.routeImageUrl}
                  alt="Route preview"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Route summary */}
            <div className="text-center py-4">
              <div className="text-lg font-semibold">
                {offer.itemCount} stops · {offer.miles.toFixed(1)} miles · {offer.estimatedTime} mins
              </div>
              <div className="text-sm text-muted-foreground">
                Just for you
              </div>
            </div>

            {/* Earnings breakdown */}
            <div className="text-center pb-4">
              <div className="text-2xl font-bold text-status-online">
                ${offer.estimatedPay.toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">
                Delivery ${(offer.estimatedPay - 1.52).toFixed(2)} · Extra Earnings $1.52
              </div>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-0 border-t border-muted">
              <Button
                variant="ghost"
                className="w-full py-4 text-lg font-semibold text-destructive hover:bg-destructive/10 rounded-none"
                onClick={() => onDecline(offer.id)}
              >
                REJECT
              </Button>
              <Button
                className="w-full py-4 text-lg font-semibold bg-status-online hover:bg-status-online/90 rounded-none"
                onClick={() => onAccept(offer.id)}
              >
                ACCEPT
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};