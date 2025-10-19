import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import mobileDriverWelcomeImage from '@/assets/mobile-driver-welcome.png';
import MobileFeederLogin from './MobileFeederLogin';

interface MobileDriverWelcomeScreenProps {
  onStartFeeding?: () => void;
}

const MobileDriverWelcomeScreen: React.FC<MobileDriverWelcomeScreenProps> = ({ 
  onStartFeeding 
}) => {
  const navigate = useNavigate();
  const [showLogin, setShowLogin] = useState(false);
  
  console.log('MobileDriverWelcomeScreen rendered');
  console.log('Image source:', mobileDriverWelcomeImage);

  const handleFeedNow = () => {
    console.log('FEED NOW clicked, showing login screen');
    setShowLogin(true);
  };

  const handleLoginSuccess = () => {
    console.log('Login successful, proceeding to dashboard');
    setShowLogin(false);
    if (onStartFeeding) {
      onStartFeeding();
    } else {
      navigate('/mobile');
    }
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-white">
      {/* Wrong App Message */}
      <div className="absolute top-2 left-0 right-0 z-10">
        <div className="px-4 text-center">
          <span className="text-xs text-gray-600">
            Wrong app if you're Crave'N food{' '}
            <a 
              href="/" 
              className="text-black hover:text-black underline font-medium"
              style={{ color: 'black' }}
            >
              Download app for Customers
            </a>
          </span>
        </div>
      </div>

      {/* Full Screen Background Image */}
      <img 
        src={mobileDriverWelcomeImage}
        alt="CRAVE'N Delivery Rider"
        className="absolute inset-0 w-full h-full object-cover"
        onLoad={() => console.log('Mobile driver welcome image loaded successfully')}
        onError={(e) => {
          console.error('Mobile driver welcome image failed to load:', e);
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
      <div className="absolute left-0 right-0 px-6" style={{ bottom: '15px', marginTop: '-16px' }}>
        <Button 
          onClick={handleFeedNow}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white text-lg font-semibold py-4 rounded-b-lg shadow-2xl transition-all duration-200 transform hover:scale-105 border-2 border-white/20"
        >
          FEED NOW
        </Button>
      </div>

      {/* Mobile Feeder Login - Slides over the welcome screen */}
      {showLogin && (
        <MobileFeederLogin 
          onBack={() => setShowLogin(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      )}
    </div>
  );
};

export default MobileDriverWelcomeScreen;
  
