import { useState } from "react";
import OnboardingHeader from "./OnboardingHeader";
import OnboardingSidebar from "./OnboardingSidebar";
import OrderMethodStep from "./steps/OrderMethodStep";
import { QualificationStep } from "./steps/QualificationStep";
import { BasicInfoStep } from "./steps/BasicInfoStep";
import { BusinessDetailsStep } from "./steps/BusinessDetailsStep";
import { LocationStep } from "./steps/LocationStep";
import StoreHoursStep from "./steps/StoreHoursStep";
import MenuSetupMethodStep from "./steps/MenuSetupMethodStep";
import { MenuBuilderStep } from "./steps/MenuBuilderStep";
import { EnhancedBankingStep } from "./steps/EnhancedBankingStep";
import { OwnerVerificationStep } from "./steps/OwnerVerificationStep";
import { ReviewStep } from "./steps/ReviewStep";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface OnboardingData {
  // Order Method
  orderMethod?: string;
  
  // Qualification
  restaurantType: string;
  hasPhysicalLocation: boolean;
  expectedMonthlyOrders: number;
  posSystem: string;
  
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
  businessLicenseUrl: string;
  insuranceCertificateUrl: string;
  healthPermitUrl: string;
  
  // Owner Verification
  ownerIdUrl: string;
  ssnLast4: string;
  backgroundCheckAuthorized: boolean;
  
  // Location
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  latitude?: number;
  longitude?: number;
  
  // Store Hours
  storeHours?: Record<number, { open: string; close: string; closed: boolean }>;
  hours: {
    [key: string]: {
      isOpen: boolean;
      openTime: string;
      closeTime: string;
    };
  };
  
  // Menu Setup Method
  menuSetupMethod?: string;
  
  // Menu & Photos
  logoUrl: string;
  coverImageUrl: string;
  menuPdfUrl: string;
  menuItems: any[];
  
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
  accountNumberConfirm: string;
  w9Completed: boolean;
  
  // Marketing
  marketingOptIn: boolean;
  commissionTier: string;
}

const INITIAL_DATA: OnboardingData = {
  orderMethod: "",
  restaurantType: '',
  hasPhysicalLocation: true,
  expectedMonthlyOrders: 0,
  posSystem: '',
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
  businessLicenseUrl: '',
  insuranceCertificateUrl: '',
  healthPermitUrl: '',
  ownerIdUrl: '',
  ssnLast4: '',
  backgroundCheckAuthorized: false,
  streetAddress: '',
  city: '',
  state: '',
  zipCode: '',
  menuSetupMethod: "",
  storeHours: {
    0: { open: "09:00", close: "22:00", closed: false },
    1: { open: "09:00", close: "22:00", closed: false },
    2: { open: "09:00", close: "22:00", closed: false },
    3: { open: "09:00", close: "22:00", closed: false },
    4: { open: "09:00", close: "22:00", closed: false },
    5: { open: "09:00", close: "22:00", closed: false },
    6: { open: "09:00", close: "22:00", closed: false },
  },
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
  menuItems: [],
  deliveryRadius: 5,
  minPrepTime: 20,
  maxPrepTime: 40,
  deliveryFeeCents: 299,
  minimumOrderCents: 1000,
  bankAccountType: '',
  routingNumber: '',
  accountNumber: '',
  accountNumberConfirm: '',
  w9Completed: false,
  marketingOptIn: false,
  commissionTier: 'basic',
};

const STEPS = [
  {
    id: "order-method",
    title: "Order method",
    component: OrderMethodStep,
    number: 1,
  },
  {
    id: "qualification",
    title: "Qualification",
    component: QualificationStep,
    number: 2,
  },
  {
    id: "basic-info",
    title: "Get started",
    component: BasicInfoStep,
    number: 3,
  },
  {
    id: "business",
    title: "Business details",
    component: BusinessDetailsStep,
    number: 4,
  },
  {
    id: "location",
    title: "Location",
    component: LocationStep,
    number: 5,
  },
  {
    id: "hours",
    title: "Store hours",
    component: StoreHoursStep,
    number: 6,
  },
  {
    id: "menu-method",
    title: "Menu setup",
    component: MenuSetupMethodStep,
    number: 7,
  },
  {
    id: "menu-builder",
    title: "Menu builder",
    component: MenuBuilderStep,
    number: 8,
  },
  {
    id: "owner",
    title: "Owner verification",
    component: OwnerVerificationStep,
    number: 9,
  },
  {
    id: "banking",
    title: "Payout info",
    component: EnhancedBankingStep,
    number: 10,
  },
  {
    id: "review",
    title: "Review & submit",
    component: ReviewStep,
    number: 11,
  },
];

const RestaurantOnboardingWizard = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<OnboardingData>(INITIAL_DATA);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const handleNext = () => {
    // Mark current step as completed
    if (!completedSteps.includes(STEPS[currentStep].number)) {
      setCompletedSteps([...completedSteps, STEPS[currentStep].number]);
    }
    
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleStepClick = (stepNumber: number) => {
    const stepIndex = STEPS.findIndex(s => s.number === stepNumber);
    if (stepIndex !== -1) {
      setCurrentStep(stepIndex);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const updateData = (newData: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...newData }));
  };

  const handleSave = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        localStorage.setItem(`restaurant-onboarding-${user.id}`, JSON.stringify(data));
        toast.success("Progress saved");
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save progress");
    }
  };

  const CurrentStepComponent = STEPS[currentStep].component;

  return (
    <div className="min-h-screen bg-background w-full">
      <OnboardingHeader onSave={handleSave} />
      
      <OnboardingSidebar
        steps={STEPS}
        currentStep={STEPS[currentStep].number}
        completedSteps={completedSteps}
        storeName={data.restaurantName}
        onStepClick={handleStepClick}
      />

      <main className="ml-64 pt-16 min-h-screen w-full">
        <CurrentStepComponent
          data={data}
          updateData={updateData}
          onNext={handleNext}
          onBack={handleBack}
          isFirstStep={currentStep === 0}
          isLastStep={currentStep === STEPS.length - 1}
        />
      </main>
    </div>
  );
};

export default RestaurantOnboardingWizard;
