import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { MapPin, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface AddressSuggestion {
  id: string;
  place_name: string;
  center: [number, number]; // [lng, lat]
  place_type: string[];
  address: string;
  text?: string; // Street name from Mapbox
  properties?: any; // Additional properties including unit numbers
  context?: any[]; // Mapbox context for parsing address components
}

interface ParsedAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string, coordinates?: { lat: number; lng: number }) => void;
  onValidAddress?: (isValid: boolean, suggestion?: AddressSuggestion) => void;
  onAddressParsed?: (parsed: ParsedAddress) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  error?: string;
}

export const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  value,
  onChange,
  onValidAddress,
  onAddressParsed,
  placeholder = "Enter address...",
  className,
  required = false,
  error
}) => {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isValidAddress, setIsValidAddress] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch address predictions from Mapbox
  const fetchSuggestions = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      setIsValidAddress(false);
      onValidAddress?.(false);
      return;
    }

    setIsLoading(true);
    try {
      let mapboxToken = '';
      
      // Try to get token from edge function first (production)
      try {
        const { data } = await supabase.functions.invoke('get-mapbox-token');
        if (data?.token) {
          mapboxToken = data.token;
        }
      } catch (edgeFunctionError) {
        console.warn('Edge function not available, using fallback token for development');
      }

      // Fallback to development token if edge function fails
      if (!mapboxToken) {
        mapboxToken = 'pk.eyJ1IjoiY3JhdmUtbiIsImEiOiJjbWVxb21qbTQyNTRnMm1vaHg5bDZwcmw2In0.aOsYrL2B0cjfcCGW1jHAdw';
      }

      if (!mapboxToken) {
        throw new Error('Mapbox token not available');
      }

      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?` +
        `access_token=${mapboxToken}&` +
        `country=US&` + // Limit to US addresses
        `autocomplete=true&` +
        `types=address,poi&` + // Focus on addresses and points of interest
        `limit=5`
      );

      const result = await response.json();

      let formatted: AddressSuggestion[] = [];
      if (response.ok && Array.isArray(result?.features)) {
        formatted = result.features.map((feature: any) => ({
          id: feature.id,
          place_name: feature.place_name,
          center: feature.center,
          place_type: feature.place_type,
          address: feature.address || '', // House number
          text: feature.text || '', // Street name
          properties: feature.properties,
          context: feature.context
        }));
      }

      // Fallback: use Nominatim (OpenStreetMap) if Mapbox fails or returns no features
      if (!formatted.length) {
        try {
          const nominatimResp = await fetch(
            `https://nominatim.openstreetmap.org/search?` +
            `q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5`
          );
          const nomiJson = await nominatimResp.json();
          if (Array.isArray(nomiJson)) {
            formatted = nomiJson.map((item: any) => ({
              id: `nominatim:${item.place_id}`,
              place_name: item.display_name,
              center: [Number(item.lon), Number(item.lat)] as [number, number],
              place_type: ['address'],
              address: item.display_name
            }));
          }
        } catch (fallbackErr) {
          console.warn('Nominatim fallback failed:', fallbackErr);
        }
      }

      if (formatted.length) {
        setSuggestions(formatted);
        setShowSuggestions(true);

        const exactMatch = formatted.find(s => 
          s.place_name.toLowerCase() === query.toLowerCase()
        );
        
        if (exactMatch) {
          setIsValidAddress(true);
          onValidAddress?.(true, exactMatch);
        } else {
          setIsValidAddress(false);
          onValidAddress?.(false);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
        setIsValidAddress(false);
        onValidAddress?.(false);
      }
    } catch (error) {
      console.error('Address prediction failed:', error);
      setSuggestions([]);
      setIsValidAddress(false);
      onValidAddress?.(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounce address input
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      if (value.trim()) {
        fetchSuggestions(value.trim());
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
        setIsValidAddress(false);
        onValidAddress?.(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [value]);

  const parseAddress = (suggestion: AddressSuggestion): ParsedAddress => {
    const parts = suggestion.place_name.split(',').map(p => p.trim());
    
    // Try to extract from Mapbox context
    let city = '';
    let state = '';
    let zipCode = '';
    
    if (suggestion.context && Array.isArray(suggestion.context)) {
      for (const ctx of suggestion.context) {
        if (ctx.id.startsWith('place.')) {
          city = ctx.text;
        } else if (ctx.id.startsWith('region.')) {
          state = ctx.short_code?.replace('US-', '') || ctx.text;
        } else if (ctx.id.startsWith('postcode.')) {
          zipCode = ctx.text;
        }
      }
    }
    
    // Fallback parsing from place_name if context not available
    if (!city || !state) {
      // Format: "Street Address, City, State ZIP, Country"
      if (parts.length >= 3) {
        city = city || parts[1];
        const stateZip = parts[2];
        const stateMatch = stateZip.match(/([A-Z]{2})/);
        const zipMatch = stateZip.match(/(\d{5})/);
        state = state || (stateMatch ? stateMatch[1] : '');
        zipCode = zipCode || (zipMatch ? zipMatch[1] : '');
      }
    }
    
    // Build street address from Mapbox components
    let street = '';
    
    // Use Mapbox's address (house number) and text (street name) if available
    if (suggestion.address && suggestion.text) {
      street = `${suggestion.address} ${suggestion.text}`;
      
      // Check for unit number in properties
      if (suggestion.properties?.unit) {
        street += ` ${suggestion.properties.unit}`;
      }
    } else {
      // Fallback: extract from place_name (first part only)
      street = parts[0] || '';
    }
    
    return {
      street,
      city,
      state,
      zipCode
    };
  };

  const handleSuggestionClick = (suggestion: AddressSuggestion) => {
    const [lng, lat] = suggestion.center;
    const parsed = parseAddress(suggestion);
    
    // Only set street address in the field
    onChange(parsed.street, { lat, lng });
    setShowSuggestions(false);
    setIsValidAddress(true);
    onValidAddress?.(true, suggestion);
    
    // Call the parsed address callback
    if (onAddressParsed) {
      onAddressParsed(parsed);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    if (newValue !== value) {
      setIsValidAddress(false);
      onValidAddress?.(false);
    }
  };

  const handleBlur = () => {
    // Delay hiding suggestions to allow clicks
    setTimeout(() => setShowSuggestions(false), 200);
  };

  return (
    <div className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={value}
          onChange={handleInputChange}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={cn(
            "pl-10 pr-10",
            error && "border-destructive",
            isValidAddress && "border-green-500",
            className
          )}
          required={required}
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
        {isValidAddress && !isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 h-2 w-2 bg-green-500 rounded-full" />
        )}
      </div>

      {/* Address Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.id}
              type="button"
              className="w-full px-4 py-3 text-left hover:bg-muted/50 focus:bg-muted/50 focus:outline-none border-b border-border last:border-b-0"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {suggestion.place_name.split(',')[0]}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {suggestion.place_name}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive mt-1">{error}</p>
      )}
      
      {required && !isValidAddress && value.length > 0 && (
        <p className="text-sm text-orange-600 mt-1">
          Please select a valid address from the suggestions
        </p>
      )}
    </div>
  );
};