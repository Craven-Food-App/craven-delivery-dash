import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import mobileDriverWelcomeImage from '@/assets/mobile-driver-welcome.png';

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
    <div className="fixed inset-0 w-full h-full bg-primary">
      {/* Full Screen Background Image */}
      <img 
        src={mobileDriverWelcomeImage}
        alt="CRAVE'N Delivery Rider"
        className="absolute inset-0 w-full h-full object-contain"
        onError={(e) => {
          // Fallback to a gradient background if image doesn't exist
          e.currentTarget.style.display = 'none';
          const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
          if (nextElement) {
            nextElement.style.display = 'block';
          }
        }}
      />
      
      {/* Fallback gradient background if image doesn't load */}
      <div 
        className="hidden absolute inset-0 w-full h-full bg-gradient-to-br from-orange-400 to-orange-600"
      >
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-white">
            <div className="text-8xl mb-6">🛴</div>
            <h2 className="text-4xl font-bold mb-4">CRAVE'N</h2>
            <p className="text-xl opacity-90">Ready to deliver happiness!</p>
          </div>
        </div>
      </div>

      {/* Message Bar - Transparent orange, touching the button */}
      <div className="absolute bottom-16 left-0 right-0 px-6">
        <div className="bg-orange-500/80 backdrop-blur-sm px-4 py-3 text-center">
          <h1 className="text-white text-lg font-semibold mb-1">
            Welcome to CRAVE'N!
          </h1>
          <p className="text-white/90 text-sm">
            Ready to make some money and help hungry customers?
          </p>
        </div>
      </div>

      {/* FEED NOW Button - Overlay at bottom, touching message box with 0px gap */}
      <div className="absolute bottom-0 left-0 right-0 px-6" style={{ marginTop: '-16px' }}>
        <Button 
          onClick={handleFeedNow}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white text-lg font-semibold py-4 rounded-b-lg shadow-2xl transition-all duration-200 transform hover:scale-105 border-2 border-white/20"
        >
          FEED NOW
        </Button>
      </div>
    </div>
  );
};

export default MobileDriverWelcomeScreen;
  
