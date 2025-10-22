import { CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface WaitlistSuccessModalProps {
  firstName: string;
  city: string;
  state: string;
  waitlistPosition: number;
  onClose: () => void;
}

export const WaitlistSuccessModal = ({ 
  firstName, 
  city, 
  state, 
  waitlistPosition,
  onClose 
}: WaitlistSuccessModalProps) => {
  return (
    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="max-w-lg w-full p-8 text-center space-y-6 animate-in fade-in zoom-in duration-300">
        {/* Animated Checkmark */}
        <div className="mx-auto w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle className="w-12 h-12 text-green-600 animate-in zoom-in duration-500" />
        </div>
        
        {/* Headline */}
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-2">
            You're on the List! 🎉
          </h2>
          <p className="text-lg text-muted-foreground">
            Thanks for applying, {firstName}!
          </p>
        </div>
        
        {/* Body Text */}
        <div className="bg-muted/50 rounded-lg p-6 text-left space-y-3">
          <p className="text-sm text-foreground">
            Your application has been received and <strong>you've been placed on our driver waitlist</strong> for <strong>{city}, {state}</strong>.
          </p>
          
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">What happens next:</p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>We'll review your documents within 48 hours</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>You'll receive an email confirmation shortly</span>
              </li>
              <li className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>When routes open in {city}, we'll send you an invitation to complete your background check and start delivering</span>
              </li>
            </ul>
          </div>
          
          <div className="bg-primary/10 border border-primary/20 rounded p-3 text-sm">
            <p className="text-foreground">
              <strong>Your Position:</strong> #{waitlistPosition} in {city}
            </p>
            <p className="text-muted-foreground text-xs mt-1">
              Estimated wait time: 2-8 weeks (we're growing fast!)
            </p>
          </div>
        </div>
        
        {/* Contact Info */}
        <p className="text-sm text-muted-foreground">
          Questions? Email us at <a href="mailto:drivers@craven.com" className="text-primary hover:underline">drivers@craven.com</a> or text <span className="font-medium">(419) 555-CRAVE</span>
        </p>
        
        {/* CTA Buttons */}
        <div className="space-y-3">
          <Button 
            size="lg" 
            className="w-full"
            onClick={() => window.open('/', '_blank')}
          >
            Explore Crave'N
          </Button>
          <Button 
            variant="outline" 
            size="lg" 
            className="w-full"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
        
        {/* Social Proof */}
        <p className="text-xs text-muted-foreground">
          Join 1,200+ drivers already on our waitlist across 15 cities
        </p>
      </Card>
    </div>
  );
};