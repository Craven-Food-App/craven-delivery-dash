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
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string, coordinates?: { lat: number; lng: number }) => void;
  onValidAddress?: (isValid: boolean, suggestion?: AddressSuggestion) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  error?: string;
}

export const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  value,
  onChange,
  onValidAddress,
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
      const { data } = await supabase.functions.invoke('get-mapbox-token');
      if (!data?.token) {
        throw new Error('Mapbox token not available');
      }

      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?` +
        `access_token=${data.token}&` +
        `country=US&` + // Limit to US addresses
        `types=address,poi&` + // Focus on addresses and points of interest
        `limit=5`
      );

      const result = await response.json();
      
      if (result.features) {
        const formatted: AddressSuggestion[] = result.features.map((feature: any) => ({
          id: feature.id,
          place_name: feature.place_name,
          center: feature.center,
          place_type: feature.place_type,
          address: feature.place_name
        }));
        
        setSuggestions(formatted);
        setShowSuggestions(true);
        
        // Check if current value matches any suggestion exactly
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

  const handleSuggestionClick = (suggestion: AddressSuggestion) => {
    const [lng, lat] = suggestion.center;
    onChange(suggestion.place_name, { lat, lng });
    setShowSuggestions(false);
    setIsValidAddress(true);
    onValidAddress?.(true, suggestion);
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