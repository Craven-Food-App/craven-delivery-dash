import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer';

interface DriveTimeSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (minutes: number) => void;
}

const TIME_OPTIONS = [
  { label: '30 min', minutes: 30 },
  { label: '1 hour', minutes: 60 },
  { label: '1.5 hours', minutes: 90 },
  { label: '2 hours', minutes: 120 },
  { label: '2.5 hours', minutes: 150 },
  { label: '3 hours', minutes: 180 },
  { label: '4 hours', minutes: 240 },
  { label: '5 hours', minutes: 300 },
  { label: '6 hours', minutes: 360 },
  { label: '7 hours', minutes: 420 },
  { label: '8 hours', minutes: 480 },
];

export const DriveTimeSelector: React.FC<DriveTimeSelectorProps> = ({ open, onClose, onSelect }) => {
  const [selectedIndex, setSelectedIndex] = useState(2); // Default to "2 hours"
  const scrollRef = useRef<HTMLDivElement>(null);
  const itemHeight = 56; // Height of each item in pixels

  useEffect(() => {
    if (open && scrollRef.current) {
      // Scroll to selected item when opening
      const scrollTop = selectedIndex * itemHeight - (scrollRef.current.offsetHeight / 2) + (itemHeight / 2);
      scrollRef.current.scrollTop = scrollTop;
    }
  }, [open, selectedIndex]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    
    const scrollTop = scrollRef.current.scrollTop;
    const containerHeight = scrollRef.current.offsetHeight;
    const centerPosition = scrollTop + containerHeight / 2;
    const newIndex = Math.round(centerPosition / itemHeight);
    
    if (newIndex >= 0 && newIndex < TIME_OPTIONS.length && newIndex !== selectedIndex) {
      setSelectedIndex(newIndex);
    }
  };

  const handleSelect = () => {
    onSelect(TIME_OPTIONS[selectedIndex].minutes);
  };

  return (
    <Drawer open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-md">
          <DrawerHeader>
            <DrawerTitle>How long do you want to drive?</DrawerTitle>
            <DrawerDescription>Scroll to select your drive time.</DrawerDescription>
          </DrawerHeader>
          
          <div className="relative h-64 overflow-hidden">
            {/* Selection indicator */}
            <div className="absolute left-0 right-0 top-1/2 transform -translate-y-1/2 h-14 border-t-2 border-b-2 border-orange-500 bg-orange-50/50 pointer-events-none z-10" />
            
            {/* Scrollable time options */}
            <div
              ref={scrollRef}
              className="h-full overflow-y-scroll scrollbar-hide"
              onScroll={handleScroll}
              style={{ paddingTop: '104px', paddingBottom: '104px' }}
            >
              {TIME_OPTIONS.map((option, index) => (
                <div
                  key={option.minutes}
                  className={`h-14 flex items-center justify-center text-lg font-medium transition-colors ${
                    index === selectedIndex 
                      ? 'text-orange-600 font-semibold' 
                      : 'text-muted-foreground'
                  }`}
                >
                  {option.label}
                </div>
              ))}
            </div>
          </div>
          
          <DrawerFooter>
            <Button onClick={handleSelect} className="w-full h-12 text-base font-semibold bg-orange-500 hover:bg-orange-600">
              Continue
            </Button>
            <DrawerClose asChild>
              <Button variant="outline">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default DriveTimeSelector;
