import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Navigation, ExternalLink, Map as MapIcon, Phone } from 'lucide-react';

interface NavigationDestination {
  address: string;
  latitude?: number;
  longitude?: number;
  name?: string;
}

interface MapNavigationHelperProps {
  destination: NavigationDestination;
  type: 'pickup' | 'delivery';
  onNavigate?: () => void;
}

export const MapNavigationHelper: React.FC<MapNavigationHelperProps> = ({
  destination,
  type,
  onNavigate
}) => {
  
  const openInMaps = (app: 'google' | 'apple' | 'waze') => {
    const address = encodeURIComponent(destination.address);
    const coords = destination.latitude && destination.longitude 
      ? `${destination.latitude},${destination.longitude}`
      : null;
    
    let url = '';
    
    switch (app) {
      case 'google':
        // Google Maps - works on all platforms
        if (coords) {
          url = `https://www.google.com/maps/dir/?api=1&destination=${coords}&destination_place_id=${address}`;
        } else {
          url = `https://www.google.com/maps/search/?api=1&query=${address}`;
        }
        break;
        
      case 'apple':
        // Apple Maps - works on iOS devices
        if (coords) {
          url = `http://maps.apple.com/?daddr=${coords}`;
        } else {
          url = `http://maps.apple.com/?daddr=${address}`;
        }
        break;
        
      case 'waze':
        // Waze - popular among drivers
        if (coords) {
          url = `https://waze.com/ul?ll=${coords}&navigate=yes`;
        } else {
          url = `https://waze.com/ul?q=${address}&navigate=yes`;
        }
        break;
    }
    
    if (url) {
      window.open(url, '_blank');
      onNavigate?.();
    }
  };

  const callLocation = () => {
    // In a real app, you'd have the phone number from the order
    const phoneNumber = type === 'pickup' ? 'restaurant' : 'customer';
    alert(`Call ${phoneNumber} - Feature coming soon!`);
  };

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);

  return (
    <Card className="bg-blue-50 border-blue-200">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <MapIcon className="h-5 w-5 text-blue-600 mt-1" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-800">
                Navigate to {type === 'pickup' ? 'Restaurant' : 'Customer'}
              </h3>
              <p className="text-sm text-blue-700">{destination.address}</p>
              {destination.name && (
                <p className="text-sm font-medium text-blue-800">{destination.name}</p>
              )}
            </div>
          </div>

          {/* Navigation Options */}
          <div className="grid grid-cols-2 gap-2">
            {/* Google Maps - Universal */}
            <Button 
              onClick={() => openInMaps('google')}
              variant="outline"
              className="flex items-center gap-2 h-12 text-sm border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              <Navigation className="h-4 w-4" />
              Google Maps
            </Button>

            {/* Apple Maps - iOS only */}
            {isIOS && (
              <Button 
                onClick={() => openInMaps('apple')}
                variant="outline"
                className="flex items-center gap-2 h-12 text-sm border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                <MapIcon className="h-4 w-4" />
                Apple Maps
              </Button>
            )}

            {/* Waze - Popular with drivers */}
            <Button 
              onClick={() => openInMaps('waze')}
              variant="outline"
              className="flex items-center gap-2 h-12 text-sm border-purple-300 text-purple-700 hover:bg-purple-100"
            >
              <Navigation className="h-4 w-4" />
              Waze
            </Button>

            {/* Call Button */}
            <Button 
              onClick={callLocation}
              variant="outline"
              className="flex items-center gap-2 h-12 text-sm border-green-300 text-green-700 hover:bg-green-100"
            >
              <Phone className="h-4 w-4" />
              Call {type === 'pickup' ? 'Restaurant' : 'Customer'}
            </Button>
          </div>

          {/* Quick Tips */}
          <div className="text-xs text-blue-600 bg-blue-100 p-2 rounded-lg">
            💡 <strong>Tip:</strong> {type === 'pickup' 
              ? 'Call ahead if the restaurant is busy or you can\'t find parking.' 
              : 'Text the customer if you can\'t find their address or they\'re not available.'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};