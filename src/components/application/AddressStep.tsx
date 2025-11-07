import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ApplicationStepProps, US_STATES } from "@/types/application";
import { AddressAutocomplete } from "@/components/common/AddressAutocomplete";
import { MapPin } from "lucide-react";

export const AddressStep = ({ data, onUpdate, onNext, onBack, isValid }: ApplicationStepProps) => {
  const [addressSearch, setAddressSearch] = React.useState('');

  const handleAddressParsed = (parsed: { street: string; city: string; state: string; zipCode: string }) => {
    onUpdate('streetAddress', parsed.street);
    onUpdate('city', parsed.city);
    if (parsed.state) {
      onUpdate('state', parsed.state.toUpperCase());
    }
    onUpdate('zipCode', parsed.zipCode);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Your Address</h2>
        <p className="text-muted-foreground">Where should we send your delivery earnings?</p>
      </div>

      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Search Address
        </Label>
        <AddressAutocomplete 
          value={addressSearch}
          onChange={(value) => setAddressSearch(value)}
          onAddressParsed={handleAddressParsed} 
        />
        <p className="text-xs text-muted-foreground">Or enter your address manually below</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="streetAddress">Street Address *</Label>
        <Input
          id="streetAddress"
          value={data.streetAddress}
          onChange={(e) => onUpdate('streetAddress', e.target.value)}
          placeholder="123 Main St, Apt 4B"
          required
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="city">City *</Label>
          <Input
            id="city"
            value={data.city}
            onChange={(e) => onUpdate('city', e.target.value)}
            placeholder="Los Angeles"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="state">State *</Label>
          <Select value={data.state} onValueChange={(value) => onUpdate('state', value)}>
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
        <Label htmlFor="zipCode">ZIP Code *</Label>
        <Input
          id="zipCode"
          value={data.zipCode}
          onChange={(e) => onUpdate('zipCode', e.target.value)}
          placeholder="90210"
          maxLength={10}
          required
        />
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
