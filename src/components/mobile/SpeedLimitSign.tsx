import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SpeedLimitSignProps {
  currentSpeed?: number; // in mph
  location?: {
    latitude: number;
    longitude: number;
  };
  className?: string;
}

export const SpeedLimitSign: React.FC<SpeedLimitSignProps> = ({
  currentSpeed = 0,
  location,
  className = ""
}) => {
  const [speedLimit, setSpeedLimit] = useState<number | null>(null);
  const [isOverLimit, setIsOverLimit] = useState(false);

  // Fetch speed limit for current location
  useEffect(() => {
    if (!location) return;

    const fetchSpeedLimit = async () => {
      try {
        // Get Mapbox token
        const { data } = await supabase.functions.invoke('get-mapbox-token');
        if (!data?.token) return;

        // Try to get speed limit from Mapbox Isochrone API (requires premium)
        // For now, we'll use a mock based on typical city limits
        // In production, you'd use Mapbox Speed Limits API or similar service
        
        // Mock speed limits based on area (this would be replaced with real API call)
        const mockSpeedLimits = [25, 30, 35, 40, 45, 50, 55]; // Common city speeds
        const mockLimit = mockSpeedLimits[Math.floor(Math.random() * mockSpeedLimits.length)];
        
        // You could also try reverse geocoding to determine road type
        const geocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${location.longitude},${location.latitude}.json?access_token=${data.token}`;
        const response = await fetch(geocodeUrl);
        const geocodeData = await response.json();
        
        // Determine speed limit based on road type from geocoding
        const place = geocodeData.features?.[0];
        const context = place?.context || [];
        
        let estimatedLimit = 25; // Default city limit
        
        // Check if it's a highway or major road
        if (place?.place_name?.toLowerCase().includes('highway') || 
            place?.place_name?.toLowerCase().includes('interstate')) {
          estimatedLimit = 70;
        } else if (place?.place_name?.toLowerCase().includes('boulevard') ||
                   place?.place_name?.toLowerCase().includes('avenue')) {
          estimatedLimit = 35;
        } else if (context.some((c: any) => c.id?.includes('neighborhood'))) {
          estimatedLimit = 25;
        } else {
          estimatedLimit = 30;
        }

        setSpeedLimit(estimatedLimit);
      } catch (error) {
        console.warn('Could not fetch speed limit:', error);
        // Fallback to common city speed limit
        setSpeedLimit(30);
      }
    };

    fetchSpeedLimit();
  }, [location]);

  // Check if over speed limit
  useEffect(() => {
    if (speedLimit && currentSpeed > speedLimit + 5) { // 5 mph buffer
      setIsOverLimit(true);
    } else {
      setIsOverLimit(false);
    }
  }, [currentSpeed, speedLimit]);

  if (!speedLimit) {
    return null; // Don't show until we have speed limit data
  }

  return (
    <div className={`${className}`}>
      {/* Speed Limit Sign */}
      <div className={`relative bg-white border-4 border-black rounded-lg shadow-lg transition-all duration-300 ${
        isOverLimit ? 'border-red-500 bg-red-50' : 'border-black bg-white'
      }`} style={{ width: '80px', height: '100px' }}>
        
        {/* Speed Limit Header */}
        <div className="text-center py-1 border-b-2 border-black">
          <div className="text-[8px] font-bold text-black leading-none">SPEED</div>
          <div className="text-[8px] font-bold text-black leading-none">LIMIT</div>
        </div>
        
        {/* Speed Limit Number */}
        <div className="flex-1 flex items-center justify-center py-2">
          <div className="text-4xl font-black text-black leading-none">
            {speedLimit}
          </div>
        </div>
        
        {/* Warning indicator if over speed */}
        {isOverLimit && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse">
            <div className="w-full h-full bg-red-600 rounded-full animate-ping"></div>
          </div>
        )}
      </div>

      {/* Current Speed Display */}
      <div className={`mt-2 bg-black/80 text-white rounded-lg px-3 py-2 text-center transition-all duration-300 ${
        isOverLimit ? 'bg-red-600/90 animate-pulse' : 'bg-black/80'
      }`}>
        <div className="text-xs font-medium">YOUR SPEED</div>
        <div className="text-2xl font-bold">
          {Math.round(currentSpeed)}
          <span className="text-sm ml-1">mph</span>
        </div>
        
        {/* Speed status */}
        <div className="text-xs mt-1">
          {currentSpeed === 0 ? (
            <span className="text-gray-300">STOPPED</span>
          ) : isOverLimit ? (
            <span className="text-red-200 font-bold">OVER LIMIT!</span>
          ) : currentSpeed > speedLimit - 5 ? (
            <span className="text-yellow-200">APPROACHING</span>
          ) : (
            <span className="text-green-200">SAFE</span>
          )}
        </div>
      </div>
    </div>
  );
};