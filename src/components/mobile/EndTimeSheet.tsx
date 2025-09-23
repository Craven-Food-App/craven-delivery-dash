import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
interface EndTimeSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onGoOnline: (endTime: Date, autoExtend: boolean, breakReminder: boolean) => void;
}
export const EndTimeSheet: React.FC<EndTimeSheetProps> = ({
  isOpen,
  onClose,
  onGoOnline
}) => {
  const [selectedHours, setSelectedHours] = useState<number | null>(null);
  const [customTime, setCustomTime] = useState('');
  const [autoExtend, setAutoExtend] = useState(true);
  const [breakReminder, setBreakReminder] = useState(true);
  if (!isOpen) return null;
  const handleQuickSelect = (hours: number) => {
    setSelectedHours(hours);
    setCustomTime('');
  };
  const handleGoOnline = () => {
    let endTime: Date;
    if (selectedHours) {
      endTime = new Date();
      endTime.setHours(endTime.getHours() + selectedHours);
    } else if (customTime) {
      const [time, period] = customTime.split(' ');
      const [hours, minutes] = time.split(':').map(Number);
      endTime = new Date();
      endTime.setHours(period === 'PM' && hours !== 12 ? hours + 12 : hours === 12 && period === 'AM' ? 0 : hours);
      endTime.setMinutes(minutes);
    } else {
      // Default to end of day
      endTime = new Date();
      endTime.setHours(23, 59, 59);
    }
    onGoOnline(endTime, autoExtend, breakReminder);
  };
  return <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed bottom-0 left-0 right-0 p-4">
        <Card className="w-full animate-slide-up py-0">
          <CardHeader className="py-0">
            <CardTitle className="text-lg py-0">How long do you want to drive?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Quick Duration Chips */}
            

            {/* Custom Time Input */}
            <div className="space-y-2">
              
              <Input id="custom-time" placeholder="10:30 PM" value={customTime} onChange={e => {
              setCustomTime(e.target.value);
              setSelectedHours(null);
            }} />
            </div>

            {/* Toggles */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-extend" className="text-sm">
                  Auto-extend if on delivery at end time
                </Label>
                <Switch id="auto-extend" checked={autoExtend} onCheckedChange={setAutoExtend} />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="break-reminder" className="text-sm">
                  Break reminder after 2 hrs
                </Label>
                <Switch id="break-reminder" checked={breakReminder} onCheckedChange={setBreakReminder} />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleGoOnline} className="flex-1">
                Go Online
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>;
};