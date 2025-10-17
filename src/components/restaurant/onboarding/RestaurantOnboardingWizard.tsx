import React, { useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { BasicInfoStep } from './steps/BasicInfoStep';
import { BusinessDetailsStep } from './steps/BusinessDetailsStep';
import { LocationStep } from './steps/LocationStep';
import { HoursStep } from './steps/HoursStep';
import { MenuSetupStep } from './steps/MenuSetupStep';
import { BankingStep } from './steps/BankingStep';
import { ReviewStep } from './steps/ReviewStep';

export interface OnboardingData {
  // Basic Info
  restaurantName: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  
  // Business Details
  legalBusinessName: string;
  businessType: 'llc' | 'corporation' | 'sole_proprietor' | 'partnership' | '';
  ein: string;
  yearsInBusiness: string;
  cuisineType: string;
  description: string;
  
  // Location
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  latitude?: number;
  longitude?: number;
  
  // Hours
  hours: {
    [key: string]: {
      isOpen: boolean;
      openTime: string;
      closeTime: string;
    };
  };
  
  // Menu & Photos
  logoUrl: string;
  coverImageUrl: string;
  menuPdfUrl: string;
  
  // Delivery Settings
  deliveryRadius: number;
  minPrepTime: number;
  maxPrepTime: number;
  deliveryFeeCents: number;
  minimumOrderCents: number;
  
  // Banking
  bankAccountType: 'checking' | 'savings' | '';
  routingNumber: string;
  accountNumber: string;
  w9Completed: boolean;
}

const INITIAL_DATA: OnboardingData = {
  restaurantName: '',
  contactName: '',
  contactPhone: '',
  contactEmail: '',
  legalBusinessName: '',
  businessType: '',
  ein: '',
  yearsInBusiness: '',
  cuisineType: '',
  description: '',
  streetAddress: '',
  city: '',
  state: '',
  zipCode: '',
  hours: {
    monday: { isOpen: true, openTime: '09:00', closeTime: '21:00' },
    tuesday: { isOpen: true, openTime: '09:00', closeTime: '21:00' },
    wednesday: { isOpen: true, openTime: '09:00', closeTime: '21:00' },
    thursday: { isOpen: true, openTime: '09:00', closeTime: '21:00' },
    friday: { isOpen: true, openTime: '09:00', closeTime: '22:00' },
    saturday: { isOpen: true, openTime: '09:00', closeTime: '22:00' },
    sunday: { isOpen: true, openTime: '10:00', closeTime: '20:00' },
  },
  logoUrl: '',
  coverImageUrl: '',
  menuPdfUrl: '',
  deliveryRadius: 5,
  minPrepTime: 20,
  maxPrepTime: 40,
  deliveryFeeCents: 299,
  minimumOrderCents: 1000,
  bankAccountType: '',
  routingNumber: '',
  accountNumber: '',
  w9Completed: false,
};

const STEPS = [
  { id: 1, name: 'Get Started', component: BasicInfoStep },
  { id: 2, name: 'Business Details', component: BusinessDetailsStep },
  { id: 3, name: 'Location', component: LocationStep },
  { id: 4, name: 'Hours', component: HoursStep },
  { id: 5, name: 'Menu & Photos', component: MenuSetupStep },
  { id: 6, name: 'Banking', component: BankingStep },
  { id: 7, name: 'Review', component: ReviewStep },
];

export default function RestaurantOnboardingWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<OnboardingData>(INITIAL_DATA);

  const progress = ((currentStep - 1) / (STEPS.length - 1)) * 100;

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const updateData = (updates: Partial<OnboardingData>) => {
    setData({ ...data, ...updates });
  };

  const CurrentStepComponent = STEPS[currentStep - 1].component;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Partner with Crave'N
          </h1>
          <p className="text-lg text-gray-600">
            Join thousands of restaurants delivering with us
          </p>
        </div>

        {/* Progress Bar */}
        <div className="max-w-4xl mx-auto mb-8">
          <Progress value={progress} className="h-2 mb-4" />
          
          {/* Step Indicators */}
          <div className="flex justify-between">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex flex-col items-center">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center font-semibold mb-2 transition-all',
                    currentStep > step.id
                      ? 'bg-primary text-white'
                      : currentStep === step.id
                      ? 'bg-primary text-white ring-4 ring-primary/20'
                      : 'bg-gray-200 text-gray-500'
                  )}
                >
                  {currentStep > step.id ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    step.id
                  )}
                </div>
                <p className="text-xs text-center hidden md:block text-gray-600">
                  {step.name}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="max-w-3xl mx-auto">
          <Card className="p-6 md:p-8 shadow-xl">
            <CurrentStepComponent
              data={data}
              updateData={updateData}
              onNext={handleNext}
              onBack={handleBack}
              isFirstStep={currentStep === 1}
              isLastStep={currentStep === STEPS.length}
            />
          </Card>
        </div>

        {/* Help Text */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>
            Need help? Contact us at{' '}
            <a href="mailto:partners@cravenusa.com" className="text-primary hover:underline">
              partners@cravenusa.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
