import React from 'react';

interface MobileMapboxProps {
  className?: string;
}

export const MobileMapbox: React.FC<MobileMapboxProps> = ({
  className = ""
}) => {
  return (
    <div className={`w-full h-full flex items-center justify-center bg-muted/20 rounded-lg ${className}`}>
      <div className="text-center">
        <p className="text-sm text-muted-foreground">Map is temporarily disabled for troubleshooting.</p>
      </div>
    </div>
  );
};

export default MobileMapbox;
