import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { OnboardingData } from "../RestaurantOnboardingWizard";
import { useState } from "react";

interface StoreHoursStepProps {
  data: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack?: () => void;
}

const daysOfWeek = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

const StoreHoursStep = ({ data, updateData, onNext }: StoreHoursStepProps) => {
  const [hours, setHours] = useState<Record<number, { open: string; close: string; closed: boolean }>>(
    data.storeHours || {
      0: { open: "09:00", close: "22:00", closed: false },
      1: { open: "09:00", close: "22:00", closed: false },
      2: { open: "09:00", close: "22:00", closed: false },
      3: { open: "09:00", close: "22:00", closed: false },
      4: { open: "09:00", close: "22:00", closed: false },
      5: { open: "09:00", close: "22:00", closed: false },
      6: { open: "09:00", close: "22:00", closed: false },
    }
  );

  const handleHourChange = (day: number, field: "open" | "close" | "closed", value: string | boolean) => {
    const newHours = {
      ...hours,
      [day]: {
        ...hours[day],
        [field]: value,
      },
    };
    setHours(newHours);
    updateData({ storeHours: newHours });
  };

  const copyToAllDays = (sourceDay: number) => {
    const sourceHours = hours[sourceDay];
    const newHours = { ...hours };
    daysOfWeek.forEach((day) => {
      newHours[day.value] = { ...sourceHours };
    });
    setHours(newHours);
    updateData({ storeHours: newHours });
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-3">Set your store hours</h2>
        <p className="text-muted-foreground text-lg">
          Let customers know when you're open for orders
        </p>
      </div>

      <div className="space-y-3">
        {daysOfWeek.map((day) => {
          const dayHours = hours[day.value];
          const isClosed = dayHours?.closed;

          return (
            <div
              key={day.value}
              className="flex items-center gap-4 p-5 border-2 rounded-xl hover:border-primary/30 transition-colors"
            >
              <div className="w-28">
                <Label className="font-semibold">{day.label}</Label>
              </div>

              <div className="flex-1 flex items-center gap-4">
                {!isClosed ? (
                  <>
                    <div className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={dayHours?.open || "09:00"}
                        onChange={(e) => handleHourChange(day.value, "open", e.target.value)}
                        className="w-32"
                      />
                      <span className="text-muted-foreground">to</span>
                      <Input
                        type="time"
                        value={dayHours?.close || "22:00"}
                        onChange={(e) => handleHourChange(day.value, "close", e.target.value)}
                        className="w-32"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToAllDays(day.value)}
                      className="text-xs"
                    >
                      Copy to all
                    </Button>
                  </>
                ) : (
                  <span className="text-muted-foreground">Closed</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Label htmlFor={`closed-${day.value}`} className="text-sm">
                  Closed
                </Label>
                <Switch
                  id={`closed-${day.value}`}
                  checked={isClosed}
                  onCheckedChange={(checked) => handleHourChange(day.value, "closed", checked)}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-end mt-8">
        <Button onClick={onNext} size="lg" className="min-w-32">
          Continue
        </Button>
      </div>
    </div>
  );
};

export default StoreHoursStep;
