import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Tablet, Plug, Mail, Badge } from "lucide-react";
import { OnboardingData } from "../RestaurantOnboardingWizard";

interface OrderMethodStepProps {
  data: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack?: () => void;
}

const OrderMethodStep = ({ data, updateData, onNext }: OrderMethodStepProps) => {
  const orderMethods = [
    {
      value: "tablet",
      icon: Tablet,
      title: "Crave'N Tablet",
      description: "Receive orders on a dedicated tablet with our easy-to-use interface",
      pricing: "Free tablet included",
      badge: "Most popular",
    },
    {
      value: "pos",
      icon: Plug,
      title: "Point of Sale (POS) Integration",
      description: "Connect directly to your existing POS system",
      pricing: "Setup fee may apply",
    },
    {
      value: "email",
      icon: Mail,
      title: "Email + Phone Confirmation",
      description: "Receive orders via email and confirm by phone",
      pricing: "No additional equipment needed",
    },
  ];

  return (
    <div className="max-w-3xl mx-auto py-8 px-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-3">Choose how you want to receive Crave'N orders</h2>
        <p className="text-muted-foreground text-lg">
          Select the method that works best for your restaurant operations
        </p>
      </div>

      <RadioGroup
        value={data.orderMethod || ""}
        onValueChange={(value) => updateData({ orderMethod: value })}
        className="space-y-4"
      >
        {orderMethods.map((method) => {
          const Icon = method.icon;
          const isSelected = data.orderMethod === method.value;

          return (
            <Label
              key={method.value}
              htmlFor={method.value}
              className="relative flex items-start gap-4 p-6 border-2 rounded-xl cursor-pointer transition-all hover:border-primary/50 hover:bg-accent/50"
              style={{
                borderColor: isSelected ? "hsl(var(--primary))" : "hsl(var(--border))",
                backgroundColor: isSelected ? "hsl(var(--accent))" : "transparent",
              }}
            >
              <RadioGroupItem value={method.value} id={method.value} className="mt-1" />
              
              <div className="flex-1 flex items-start gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold">{method.title}</h3>
                    {method.badge && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                        <Badge className="h-3 w-3" />
                        {method.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{method.description}</p>
                  <p className="text-sm font-medium text-primary">{method.pricing}</p>
                </div>
              </div>
            </Label>
          );
        })}
      </RadioGroup>

      <div className="flex justify-end mt-8">
        <Button
          onClick={onNext}
          disabled={!data.orderMethod}
          size="lg"
          className="min-w-32"
        >
          Continue
        </Button>
      </div>
    </div>
  );
};

export default OrderMethodStep;
