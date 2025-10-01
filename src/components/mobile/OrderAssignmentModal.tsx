import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Phone, MapPin, User, Package } from 'lucide-react';

interface OrderAssignmentModalProps {
  assignment: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept?: (assignment: any) => void;
  onDecline?: () => void;
}

export function OrderAssignmentModal({ assignment, open, onOpenChange, onAccept, onDecline }: OrderAssignmentModalProps) {
  if (!assignment) return null;

  // ✅ Address formatter (handles jsonb or string)
  const formatAddress = (addr: any): string => {
    if (!addr) return '';
    if (typeof addr === 'string') return addr;

    return [
      addr.street,
      addr.city,
      addr.state,
      addr.zip_code
    ].filter(Boolean).join(', ');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Order Assignment</DialogTitle>
        </DialogHeader>

        <Card>
          <CardContent className="space-y-4 pt-4">
            {/* Pickup Info */}
            <div className="flex items-start gap-3">
              <Package className="h-5 w-5 text-primary mt-1" />
              <div>
                <p className="font-medium">Pickup</p>
                <p className="text-muted-foreground">{formatAddress(assignment.pickup_address)}</p>
                {assignment.pickup_contact && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <User className="h-4 w-4" /> {assignment.pickup_contact}
                  </p>
                )}
                {assignment.pickup_phone && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Phone className="h-4 w-4" /> {assignment.pickup_phone}
                  </p>
                )}
              </div>
            </div>

            {/* Dropoff Info */}
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-primary mt-1" />
              <div>
                <p className="font-medium">Dropoff</p>
                <p className="text-muted-foreground">{formatAddress(assignment.dropoff_address)}</p>
                {assignment.dropoff_contact && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <User className="h-4 w-4" /> {assignment.dropoff_contact}
                  </p>
                )}
                {assignment.dropoff_phone && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Phone className="h-4 w-4" /> {assignment.dropoff_phone}
                  </p>
                )}
              </div>
            </div>

            {/* Status */}
            <div>
              <Badge variant="secondary">{assignment.status}</Badge>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 justify-end">
              {onDecline && (
                <Button variant="outline" onClick={() => {
                  onDecline();
                  onOpenChange(false);
                }}>
                  Decline
                </Button>
              )}
              {onAccept && (
                <Button onClick={() => {
                  onAccept(assignment);
                  onOpenChange(false);
                }}>
                  Accept
                </Button>
              )}
              {!onAccept && !onDecline && (
                <Button onClick={() => onOpenChange(false)}>Close</Button>
              )}
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
