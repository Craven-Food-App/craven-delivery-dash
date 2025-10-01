import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, MapPin } from 'lucide-react';

interface OrderAssignment {
  assignment_id: string;
  order_id: string;
  restaurant_name: string;
  pickup_address: any;
  dropoff_address: any;
  payout_cents: number;
  distance_km: number;
  distance_mi: string;
  expires_at: string;
  estimated_time: number;
  isTestOrder?: boolean;
}

interface OrderAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: OrderAssignment | null;
  onAccept: (assignment: OrderAssignment) => void;
  onDecline: () => void;
}

const formatCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`;

const formatAddress = (address: any) => {
  if (typeof address === 'string') return address;
  if (address && typeof address === 'object') {
    return [address.address, address.city, address.state]
      .filter(Boolean)
      .join(', ');
  }
  return '';
};

const OrderAssignmentModal: React.FC<OrderAssignmentModalProps> = ({
  isOpen,
  onClose,
  assignment,
  onAccept,
  onDecline,
}) => {
  const [timeLeft, setTimeLeft] = useState(25);

  useEffect(() => {
    if (!isOpen || !assignment) {
      setTimeLeft(25);
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          onDecline();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, assignment, onDecline]);

  if (!assignment) return null;

  const pickupAddr = formatAddress(assignment.pickup_address);
  const dropoffAddr = formatAddress(assignment.dropoff_address);
  const distanceMiles = parseFloat(assignment.distance_mi) || (assignment.distance_km * 0.621371);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-0 gap-0">
        <Card className="border-0 shadow-none">
          {/* Map placeholder */}
          <div className="w-full h-48 bg-gradient-to-br from-orange-100 to-orange-50 relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <MapPin className="w-12 h-12 text-orange-500" />
            </div>
          </div>

          <CardContent className="p-4 space-y-4">
            {/* Route info */}
            <div className="flex justify-between items-center text-sm font-semibold text-gray-700 border-b pb-4">
              <span>2 stops</span>
              <span className="mx-2">•</span>
              <span>{distanceMiles.toFixed(1)} miles</span>
              <span className="mx-2">•</span>
              <span>{assignment.estimated_time} mins</span>
            </div>

            {/* Timer section */}
            <div className="flex items-center justify-between bg-orange-50 px-3 py-2 rounded-lg">
              <span className="font-semibold text-lg text-orange-700">Just for you</span>
              <div className="relative w-8 h-8 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-gray-200"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  />
                  <path
                    className="text-orange-500"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeDasharray="100, 100"
                    strokeDashoffset={100 - (timeLeft / 25) * 100}
                  />
                </svg>
                <span className="absolute text-xs font-medium text-orange-700">
                  0:{timeLeft.toString().padStart(2, '0')}
                </span>
              </div>
            </div>

            {/* Addresses */}
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500 mt-1 flex-shrink-0" />
                <div>
                  <div className="font-semibold">{assignment.restaurant_name}</div>
                  <div className="text-gray-600">{pickupAddr}</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-3 h-3 text-orange-500 mt-1 flex-shrink-0" />
                <div className="text-gray-600">{dropoffAddr}</div>
              </div>
            </div>

            {/* Payout info */}
            <div className="space-y-1 pt-2 border-t">
              <div className="flex justify-between items-center">
                <span className="text-2xl font-bold text-gray-800">Estimated Total</span>
                <span className="text-2xl font-bold text-gray-800">
                  {formatCurrency(assignment.payout_cents)}
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                onClick={onDecline}
                variant="outline"
                className="flex-1 border-orange-500 text-orange-500 hover:bg-orange-50"
              >
                REJECT
              </Button>
              <Button
                onClick={() => onAccept(assignment)}
                className="flex-1 bg-orange-500 text-white hover:bg-orange-600"
              >
                ACCEPT
              </Button>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};

export default OrderAssignmentModal;
