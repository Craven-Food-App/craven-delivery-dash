import React from 'react';
import { Button } from '@/components/ui/button';

type EarningMode = 'perHour' | 'perOffer';

interface EarningModeToggleProps {
  mode: EarningMode;
  onModeChange: (mode: EarningMode) => void;
}

export const EarningModeToggle: React.FC<EarningModeToggleProps> = ({
  mode,
  onModeChange
}) => {
  return (
    <div className="px-4">
      <h3 className="text-sm font-medium text-muted-foreground mb-3">Earning Mode</h3>
      <div className="flex bg-muted rounded-lg p-1">
        <Button
          variant={mode === 'perHour' ? 'default' : 'ghost'}
          size="sm"
          className="flex-1 text-xs"
          onClick={() => onModeChange('perHour')}
        >
          Per Hour
        </Button>
        <Button
          variant={mode === 'perOffer' ? 'default' : 'ghost'}
          size="sm"
          className="flex-1 text-xs"
          onClick={() => onModeChange('perOffer')}
        >
          Per Offer
        </Button>
      </div>
      <div className="mt-2 text-center">
        {mode === 'perHour' ? (
          <p className="text-sm text-muted-foreground">$18/hr + tips</p>
        ) : (
          <p className="text-sm text-muted-foreground">see offers by pay + distance</p>
        )}
      </div>
    </div>
  );
};