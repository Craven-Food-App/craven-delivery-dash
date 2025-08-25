import React from 'react';
import { Car, Bike, Zap, PersonStanding, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type VehicleType = 'car' | 'bike' | 'scooter' | 'walk' | 'motorcycle';

interface VehicleOption {
  type: VehicleType;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  docsComplete: boolean;
}

interface VehicleSelectorProps {
  selectedVehicle: VehicleType;
  onVehicleSelect: (vehicle: VehicleType) => void;
  docsStatus: Record<VehicleType, boolean>;
}

const vehicleOptions: VehicleOption[] = [
  { type: 'car', icon: Car, label: 'Car', docsComplete: true },
  { type: 'bike', icon: Bike, label: 'Bike', docsComplete: true },
  { type: 'scooter', icon: Zap, label: 'Scooter', docsComplete: false },
  { type: 'walk', icon: PersonStanding, label: 'Walk', docsComplete: true },
  { type: 'motorcycle', icon: Calendar, label: 'Motorcycle', docsComplete: false },
];

export const VehicleSelector: React.FC<VehicleSelectorProps> = ({
  selectedVehicle,
  onVehicleSelect,
  docsStatus
}) => {
  return (
    <div className="w-full">
      <h3 className="text-sm font-medium text-muted-foreground mb-3">Vehicle</h3>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {vehicleOptions.map((vehicle) => {
          const Icon = vehicle.icon;
          const isSelected = selectedVehicle === vehicle.type;
          const docsComplete = docsStatus[vehicle.type];
          
          return (
            <Card
              key={vehicle.type}
              className={`min-w-[80px] cursor-pointer transition-smooth ${
                isSelected 
                  ? 'ring-2 ring-primary bg-primary/5' 
                  : 'hover:bg-accent'
              }`}
              onClick={() => onVehicleSelect(vehicle.type)}
            >
              <CardContent className="p-3 text-center">
                <div className="relative mb-2">
                  <Icon className="h-8 w-8 mx-auto text-foreground" />
                  <Badge
                    variant={docsComplete ? "secondary" : "destructive"}
                    className="absolute -top-1 -right-1 h-4 w-4 p-0 text-[10px] flex items-center justify-center"
                  >
                    {docsComplete ? '✓' : '✗'}
                  </Badge>
                </div>
                <p className="text-xs font-medium">{vehicle.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};