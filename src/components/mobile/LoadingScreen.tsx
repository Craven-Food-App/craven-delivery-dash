import React from 'react';
import cravenLogo from '@/assets/craven-c-new.png';

interface LoadingScreenProps {
  isLoading: boolean;
}

const LoadingScreen = ({ isLoading }: LoadingScreenProps) => {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-orange-500 to-orange-600">
      <div className="flex flex-col items-center space-y-8">
        {/* Spinning C Logo */}
        <div className="relative">
          <img 
            src={cravenLogo} 
            alt="Crave'n" 
            className="w-32 h-32 animate-spin"
            style={{ 
              animationDuration: '2s',
              animationTimingFunction: 'ease-in-out',
              animationIterationCount: 'infinite'
            }}
          />
          {/* Loading dots */}
          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '0s' }}></div>
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        </div>
        
        {/* Loading text */}
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-2">CRAVE'N</h1>
          <p className="text-lg opacity-90">Getting ready...</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;