import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Car, Bike, Footprints } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { ApplicationStepProps, US_STATES } from "@/types/application";
import { Card, CardContent } from "@/components/ui/card";

const VEHICLE_TYPES = [
  { value: 'car', label: 'Car', icon: Car },
  { value: 'bike', label: 'Bike / Scooter', icon: Bike },
  { value: 'walking', label: 'Walking', icon: Footprints },
];

export const VehicleStep = ({ data, onUpdate, onNext, onBack, isValid }: ApplicationStepProps) => {
  const needsVehicleInfo = data.vehicleType && data.vehicleType !== 'walking';

  const handleExpiryChange = (date: Date | undefined) => {
    if (date) {
      onUpdate('licenseExpiry', date.toISOString().split('T')[0]);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Vehicle & License</h2>
        <p className="text-muted-foreground">How will you make deliveries?</p>
      </div>

      <div className="space-y-3">
        <Label>Vehicle Type *</Label>
        <div className="grid gap-3 md:grid-cols-3">
          {VEHICLE_TYPES.map((type) => {
            const Icon = type.icon;
            return (
              <Card
                key={type.value}
                className={cn(
                  "cursor-pointer transition-all hover:border-primary",
                  data.vehicleType === type.value && "border-primary bg-primary/5"
                )}
                onClick={() => onUpdate('vehicleType', type.value)}
              >
                <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                  <Icon className={cn(
                    "h-8 w-8 mb-2",
                    data.vehicleType === type.value ? "text-primary" : "text-muted-foreground"
                  )} />
                  <span className="font-medium">{type.label}</span>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {needsVehicleInfo && (
        <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
          <p className="text-sm font-medium">Vehicle Information</p>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="vehicleMake">Make *</Label>
              <Input
                id="vehicleMake"
                value={data.vehicleMake}
                onChange={(e) => onUpdate('vehicleMake', e.target.value)}
                placeholder="Toyota"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vehicleModel">Model *</Label>
              <Input
                id="vehicleModel"
                value={data.vehicleModel}
                onChange={(e) => onUpdate('vehicleModel', e.target.value)}
                placeholder="Camry"
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="vehicleYear">Year *</Label>
              <Input
                id="vehicleYear"
                value={data.vehicleYear}
                onChange={(e) => onUpdate('vehicleYear', e.target.value)}
                placeholder="2020"
                maxLength={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vehicleColor">Color *</Label>
              <Input
                id="vehicleColor"
                value={data.vehicleColor}
                onChange={(e) => onUpdate('vehicleColor', e.target.value)}
                placeholder="Silver"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="licensePlate">License Plate *</Label>
              <Input
                id="licensePlate"
                value={data.licensePlate}
                onChange={(e) => onUpdate('licensePlate', e.target.value.toUpperCase())}
                placeholder="ABC123"
              />
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4 p-4 border rounded-lg">
        <p className="text-sm font-medium">Driver's License Information</p>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="licenseNumber">License Number *</Label>
            <Input
              id="licenseNumber"
              value={data.licenseNumber}
              onChange={(e) => onUpdate('licenseNumber', e.target.value)}
              placeholder="D1234567"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="licenseState">License State *</Label>
            <Select value={data.licenseState} onValueChange={(value) => onUpdate('licenseState', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
              <SelectContent>
                {US_STATES.map((state) => (
                  <SelectItem key={state} value={state}>
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Expiration Date *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !data.licenseExpiry && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {data.licenseExpiry ? format(new Date(data.licenseExpiry), "PPP") : "Pick expiry date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={data.licenseExpiry ? new Date(data.licenseExpiry) : undefined}
                onSelect={handleExpiryChange}
                disabled={(date) => date < new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="w-full" size="lg">
          Back
        </Button>
        <Button onClick={onNext} disabled={!isValid} className="w-full" size="lg">
          Continue
        </Button>
      </div>
    </div>
  );
};
