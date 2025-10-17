import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight, ArrowLeft, Building2 } from 'lucide-react';
import { OnboardingData } from '../RestaurantOnboardingWizard';

interface BusinessDetailsStepProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const cuisineTypes = [
  'American', 'Italian', 'Mexican', 'Chinese', 'Japanese', 'Indian', 'Thai',
  'Mediterranean', 'French', 'Greek', 'Korean', 'Vietnamese', 'Lebanese',
  'Pizza', 'Burgers', 'Seafood', 'Vegetarian', 'Healthy', 'Fast Food', 'Other'
];

export function BusinessDetailsStep({ data, updateData, onNext, onBack }: BusinessDetailsStepProps) {
  const isValid =
    data.legalBusinessName.trim().length >= 2 &&
    data.businessType &&
    data.ein.trim().length >= 9 &&
    data.yearsInBusiness &&
    data.cuisineType &&
    data.description.trim().length >= 20;

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <Building2 className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-3xl font-bold mb-2">Business Information</h2>
        <p className="text-muted-foreground">
          Help us verify your business details for tax and legal purposes
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="legalBusinessName">Legal Business Name *</Label>
          <Input
            id="legalBusinessName"
            value={data.legalBusinessName}
            onChange={(e) => updateData({ legalBusinessName: e.target.value })}
            placeholder="As registered with the IRS"
            className="mt-1"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="businessType">Business Type *</Label>
            <Select
              value={data.businessType}
              onValueChange={(value: any) => updateData({ businessType: value })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="llc">LLC</SelectItem>
                <SelectItem value="corporation">Corporation</SelectItem>
                <SelectItem value="sole_proprietor">Sole Proprietor</SelectItem>
                <SelectItem value="partnership">Partnership</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="ein">EIN (Tax ID) *</Label>
            <Input
              id="ein"
              value={data.ein}
              onChange={(e) => updateData({ ein: e.target.value.replace(/\D/g, '').slice(0, 9) })}
              placeholder="XX-XXXXXXX"
              className="mt-1"
              maxLength={10}
            />
            <p className="text-xs text-muted-foreground mt-1">9-digit Employer Identification Number</p>
          </div>
        </div>

        <div>
          <Label htmlFor="yearsInBusiness">Years in Business *</Label>
          <Select
            value={data.yearsInBusiness}
            onValueChange={(value) => updateData({ yearsInBusiness: value })}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="less_than_1">Less than 1 year</SelectItem>
              <SelectItem value="1-3">1-3 years</SelectItem>
              <SelectItem value="3-5">3-5 years</SelectItem>
              <SelectItem value="5-10">5-10 years</SelectItem>
              <SelectItem value="10+">10+ years</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="cuisineType">Cuisine Type *</Label>
          <Select
            value={data.cuisineType}
            onValueChange={(value) => updateData({ cuisineType: value })}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select cuisine type" />
            </SelectTrigger>
            <SelectContent>
              {cuisineTypes.map((cuisine) => (
                <SelectItem key={cuisine} value={cuisine}>
                  {cuisine}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="description">Restaurant Description *</Label>
          <Textarea
            id="description"
            value={data.description}
            onChange={(e) => updateData({ description: e.target.value })}
            placeholder="Tell customers what makes your restaurant special..."
            className="mt-1 min-h-[120px]"
          />
          <p className="text-xs text-muted-foreground mt-1">
            {data.description.length}/500 characters (minimum 20)
          </p>
        </div>
      </div>

      <div className="flex justify-between pt-6 border-t">
        <Button onClick={onBack} variant="outline" size="lg">
          <ArrowLeft className="mr-2 w-4 h-4" />
          Back
        </Button>
        <Button onClick={onNext} disabled={!isValid} size="lg">
          Continue
          <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
