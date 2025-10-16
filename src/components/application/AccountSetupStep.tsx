import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { ApplicationStepProps } from "@/types/application";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const AccountSetupStep = ({ data, onUpdate, onNext, isValid }: ApplicationStepProps) => {
  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      onUpdate('dateOfBirth', date.toISOString().split('T')[0]);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Let's Get Started</h2>
        <p className="text-muted-foreground">Tell us about yourself</p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {data.email ? "If you already have an account, you'll be asked to sign in during submission." : "We'll create your account when you submit the application."}
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name *</Label>
          <Input
            id="firstName"
            value={data.firstName}
            onChange={(e) => onUpdate('firstName', e.target.value)}
            placeholder="John"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name *</Label>
          <Input
            id="lastName"
            value={data.lastName}
            onChange={(e) => onUpdate('lastName', e.target.value)}
            placeholder="Doe"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email Address *</Label>
        <Input
          id="email"
          type="email"
          value={data.email}
          onChange={(e) => onUpdate('email', e.target.value)}
          placeholder="john.doe@example.com"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number *</Label>
        <Input
          id="phone"
          type="tel"
          value={data.phone}
          onChange={(e) => onUpdate('phone', e.target.value)}
          placeholder="(555) 123-4567"
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Date of Birth *</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !data.dateOfBirth && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {data.dateOfBirth ? format(new Date(data.dateOfBirth), "PPP") : "Pick your birth date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={data.dateOfBirth ? new Date(data.dateOfBirth) : undefined}
              onSelect={handleDateChange}
              disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        <p className="text-xs text-muted-foreground">You must be at least 18 years old</p>
      </div>

      <Button onClick={onNext} disabled={!isValid} className="w-full" size="lg">
        Continue
      </Button>
    </div>
  );
};
