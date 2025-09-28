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

// Generate time options starting from next 30-minute increment
const generateTimeOptions = () => {
  const now = new Date();
  const options = [];
  
  // Round up to next 30-minute increment
  const currentMinutes = now.getMinutes();
  const currentHour = now.getHours();
  
  let nextHour = currentHour;
  let nextMinute = 0;
  
  if (currentMinutes > 30) {
    // If past 30 minutes, go to next hour
    nextHour += 1;
    nextMinute = 0;
  } else if (currentMinutes > 0) {
    // If past 0 minutes but before 30, go to 30 minutes
    nextMinute = 30;
  }
  
  // Create 48 time slots (24 hours worth of 30-minute increments)
  for (let i = 0; i < 48; i++) {
    const timeSlot = new Date(now);
    timeSlot.setHours(nextHour, nextMinute, 0, 0);
    
    // Calculate minutes from now
    const minutesFromNow = Math.round((timeSlot.getTime() - now.getTime()) / (1000 * 60));
    
    const timeString = timeSlot.toLocaleTimeString([], { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    
    options.push({
      label: timeString,
      minutes: minutesFromNow,
      endTime: timeSlot
    });
    
    // Move to next 30-minute slot
    nextMinute += 30;
    if (nextMinute >= 60) {
      nextMinute = 0;
      nextHour += 1;
      if (nextHour >= 24) {
        nextHour = 0;
      }
    }
  }
  
  return options;
};

export const DriveTimeSelector: React.FC<DriveTimeSelectorProps> = ({ open, onClose, onSelect }) => {
  const [timeOptions] = useState(() => generateTimeOptions());
  const [selectedIndex, setSelectedIndex] = useState(7); // Default to about 4 hours out
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
    
    if (newIndex >= 0 && newIndex < timeOptions.length && newIndex !== selectedIndex) {
      setSelectedIndex(newIndex);
    }
  };

  const handleSelect = () => {
    onSelect(timeOptions[selectedIndex].minutes);
  };

  return (
    <Drawer open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-md">
          <DrawerHeader>
            <DrawerTitle>When do you want to stop driving?</DrawerTitle>
            <DrawerDescription>Select your end time.</DrawerDescription>
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
              {timeOptions.map((option, index) => (
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
