import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, Star } from 'lucide-react';

interface TestCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TestCompletionModal: React.FC<TestCompletionModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      
      {/* Modal Content */}
      <div className="relative bg-card rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center">
        {/* Success Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-foreground mb-2">
          Test Delivery Complete!
        </h2>

        {/* Message */}
        <p className="text-muted-foreground mb-6">
          Thank you for participating in our testing process! Your feedback helps us improve the Crave'N driver experience.
        </p>

        {/* Stars decoration */}
        <div className="flex justify-center gap-1 mb-6">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className="h-5 w-5 text-yellow-400 fill-current"
            />
          ))}
        </div>

        {/* Action Button */}
        <Button
          onClick={onClose}
          className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3 rounded-xl"
        >
          Continue Testing
        </Button>

        {/* Footer note */}
        <p className="text-xs text-muted-foreground mt-4">
          This was a simulated delivery for testing purposes only.
        </p>
      </div>
    </div>
  );
};