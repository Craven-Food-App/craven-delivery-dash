import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface MobileDriverWelcomeScreenProps {
  onStartFeeding?: () => void;
}

const MobileDriverWelcomeScreen: React.FC<MobileDriverWelcomeScreenProps> = ({ 
  onStartFeeding 
}) => {
  const navigate = useNavigate();
  
  console.log('MobileDriverWelcomeScreen rendered');

  const handleFeedNow = () => {
    if (onStartFeeding) {
      onStartFeeding();
    } else {
      // Navigate to the main mobile dashboard
      navigate('/mobile');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-orange-100 flex flex-col">
      {/* Header Image */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <img 
            src="/src/assets/mobile-driver-welcome.png"
            alt="CRAVE'N Delivery Rider"
            className="w-full max-w-sm mx-auto mb-8"
            onError={(e) => {
              // Fallback to a placeholder if image doesn't exist
              e.currentTarget.style.display = 'none';
              const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
              if (nextElement) {
                nextElement.style.display = 'block';
              }
            }}
          />
          {/* Fallback content if image doesn't load */}
          <div 
            className="hidden w-full max-w-sm mx-auto mb-8 bg-orange-200 rounded-lg p-8 text-center"
          >
            <div className="text-orange-600 text-6xl mb-4">🛴</div>
            <h2 className="text-2xl font-bold text-orange-800 mb-2">CRAVE'N</h2>
            <p className="text-orange-700">Ready to deliver happiness!</p>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            Welcome to CRAVE'N!
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            You're all set to start delivering amazing food experiences. 
            Ready to make some money and help hungry customers?
          </p>
        </div>
      </div>

      {/* Bottom Button */}
      <div className="px-6 pb-8 pt-4 bg-white border-t border-orange-200">
        <Button 
          onClick={handleFeedNow}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white text-lg font-semibold py-4 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105"
        >
          FEED NOW
        </Button>
      </div>
    </div>
  );
};

export default MobileDriverWelcomeScreen;
