import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, 
  Clock, 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle,
  AlertCircle,
  Play,
  Pause,
  Settings
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ScheduleBlock {
  id: string;
  day_of_week: number; // 0=Sunday, 1=Monday, etc.
  start_time: string;
  end_time: string;
  is_active: boolean;
  is_recurring: boolean;
  created_at: string;
}

interface AvailabilitySettings {
  auto_online: boolean;
  break_reminders: boolean;
  max_hours_per_day: number;
  preferred_zones: string[];
}

const DAYS_OF_WEEK = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

export const ScheduleSection: React.FC = () => {
  const [scheduleBlocks, setScheduleBlocks] = useState<ScheduleBlock[]>([]);
  const [availabilitySettings, setAvailabilitySettings] = useState<AvailabilitySettings>({
    auto_online: true,
    break_reminders: true,
    max_hours_per_day: 12,
    preferred_zones: ['Downtown', 'University District']
  });
  const [isEditing, setIsEditing] = useState(false);
  const [selectedDay, setSelectedDay] = useState(new Date().getDay());
  const [currentStatus, setCurrentStatus] = useState<'offline' | 'scheduled' | 'online'>('offline');
  const [todayHours, setTodayHours] = useState({ scheduled: 8, worked: 3.5 });
  const [loading, setLoading] = useState(true);

  const { toast } = useToast();

  useEffect(() => {
    fetchScheduleData();
    checkCurrentScheduleStatus();
  }, []);

  const fetchScheduleData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch real schedule data from driver_schedules table
      const { data: scheduleData, error } = await supabase
        .from('driver_schedules')
        .select('*')
        .eq('driver_id', user.id)
        .order('day_of_week');

      if (error) {
        console.error('Error fetching schedule:', error);
        // Create default schedule if none exists
        const defaultSchedule: ScheduleBlock[] = [
          {
            id: '1',
            day_of_week: 1, // Monday
            start_time: '09:00',
            end_time: '17:00',
            is_active: true,
            is_recurring: true,
            created_at: new Date().toISOString()
          }
        ];
        setScheduleBlocks(defaultSchedule);
      } else {
        setScheduleBlocks(scheduleData || []);
      }
    } catch (error) {
      console.error('Error fetching schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkCurrentScheduleStatus = () => {
    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = now.toTimeString().slice(0, 5);
    
    const todaySchedule = scheduleBlocks.find(block => 
      block.day_of_week === currentDay && 
      block.is_active &&
      currentTime >= block.start_time && 
      currentTime <= block.end_time
    );

    if (todaySchedule) {
      setCurrentStatus('scheduled');
    } else {
      setCurrentStatus('offline');
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const calculateWeeklyHours = () => {
    return scheduleBlocks
      .filter(block => block.is_active)
      .reduce((total, block) => {
        const [startHours, startMinutes] = block.start_time.split(':').map(Number);
        const [endHours, endMinutes] = block.end_time.split(':').map(Number);
        const startTime = startHours + startMinutes / 60;
        const endTime = endHours + endMinutes / 60;
        return total + (endTime - startTime);
      }, 0);
  };

  const getNextScheduledBlock = () => {
    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = now.toTimeString().slice(0, 5);
    
    // Find next scheduled block (today or future days)
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const checkDay = (currentDay + dayOffset) % 7;
      const dayBlocks = scheduleBlocks
        .filter(block => block.day_of_week === checkDay && block.is_active)
        .sort((a, b) => a.start_time.localeCompare(b.start_time));
      
      for (const block of dayBlocks) {
        if (dayOffset === 0 && block.start_time <= currentTime) continue;
        return { ...block, dayOffset };
      }
    }
    return null;
  };

  const handleQuickSchedule = (hours: number) => {
    const now = new Date();
    const startTime = now.toTimeString().slice(0, 5);
    const endDate = new Date(now.getTime() + hours * 60 * 60 * 1000);
    const endTime = endDate.toTimeString().slice(0, 5);
    
    const newBlock: ScheduleBlock = {
      id: Date.now().toString(),
      day_of_week: now.getDay(),
      start_time: startTime,
      end_time: endTime,
      is_active: true,
      is_recurring: false,
      created_at: new Date().toISOString()
    };

    // Save to database
    const saveScheduleBlock = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
          .from('driver_schedules')
          .insert({
            driver_id: user.id,
            day_of_week: newBlock.day_of_week,
            start_time: newBlock.start_time,
            end_time: newBlock.end_time,
            is_active: newBlock.is_active,
            is_recurring: newBlock.is_recurring
          });

        if (error) throw error;

        setScheduleBlocks([...scheduleBlocks, newBlock]);
        toast({
          title: "Schedule Added",
          description: `Added ${hours}-hour block starting now`,
        });
      } catch (error) {
        console.error('Error saving schedule:', error);
        toast({
          title: "Error",
          description: "Failed to save schedule",
          variant: "destructive"
        });
      }
    };

    saveScheduleBlock();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pb-16">
        <div className="animate-pulse space-y-4">
          <div className="h-20 w-64 bg-muted rounded-lg"></div>
          <div className="h-4 w-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  const nextBlock = getNextScheduledBlock();
  const weeklyHours = calculateWeeklyHours();

  return (
    <div className="min-h-screen bg-background pb-16">
      <div className="max-w-md mx-auto p-4 space-y-4">
        
        {/* Current Status Card */}
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                {currentStatus === 'scheduled' ? (
                  <>
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-semibold">On Schedule</span>
                  </>
                ) : (
                  <>
                    <Clock className="h-5 w-5" />
                    <span className="font-semibold">Not Scheduled</span>
                  </>
                )}
              </div>
              
              {nextBlock && (
                <div className="text-blue-100 text-sm">
                  Next: {DAYS_OF_WEEK[nextBlock.day_of_week]} at {formatTime(nextBlock.start_time)}
                  {nextBlock.dayOffset === 0 && ' (Today)'}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Schedule Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Quick Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <Button 
                variant="outline" 
                className="h-12 flex flex-col gap-1"
                onClick={() => handleQuickSchedule(2)}
              >
                <span className="font-bold">2h</span>
                <span className="text-xs">Now</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-12 flex flex-col gap-1"
                onClick={() => handleQuickSchedule(4)}
              >
                <span className="font-bold">4h</span>
                <span className="text-xs">Now</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-12 flex flex-col gap-1"
                onClick={() => handleQuickSchedule(8)}
              >
                <span className="font-bold">8h</span>
                <span className="text-xs">Now</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Today's Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Today's Progress
              </div>
              <Badge variant="secondary">
                {todayHours.worked}h / {todayHours.scheduled}h
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-green-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${(todayHours.worked / todayHours.scheduled) * 100}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Started at 9:00 AM</span>
                <span>{todayHours.scheduled - todayHours.worked}h remaining</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Weekly Schedule
              </div>
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(!isEditing)}>
                <Edit className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span>Total Weekly Hours</span>
                <span className="font-semibold">{weeklyHours.toFixed(1)} hours</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Active Days</span>
                <span className="font-semibold">{scheduleBlocks.filter(b => b.is_active).length} days</span>
              </div>
            </div>

            <div className="space-y-2">
              {DAYS_OF_WEEK.map((day, index) => {
                const dayBlocks = scheduleBlocks.filter(
                  block => block.day_of_week === index && block.is_active
                );
                
                return (
                  <div key={day} className="flex items-center justify-between p-2 rounded-lg border">
                    <div className="font-medium text-sm">{day}</div>
                    <div className="text-right">
                      {dayBlocks.length > 0 ? (
                        dayBlocks.map((block, blockIndex) => (
                          <div key={blockIndex} className="text-sm text-muted-foreground">
                            {formatTime(block.start_time)} - {formatTime(block.end_time)}
                          </div>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">Off</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Availability Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Availability Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Auto Go Online</p>
                <p className="text-xs text-muted-foreground">Automatically go online during scheduled times</p>
              </div>
              <Switch 
                checked={availabilitySettings.auto_online}
                onCheckedChange={(checked) => 
                  setAvailabilitySettings(prev => ({ ...prev, auto_online: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Break Reminders</p>
                <p className="text-xs text-muted-foreground">Get notified to take breaks</p>
              </div>
              <Switch 
                checked={availabilitySettings.break_reminders}
                onCheckedChange={(checked) => 
                  setAvailabilitySettings(prev => ({ ...prev, break_reminders: checked }))
                }
              />
            </div>

            <div>
              <p className="font-medium text-sm mb-2">Daily Hour Limit</p>
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setAvailabilitySettings(prev => ({ 
                    ...prev, 
                    max_hours_per_day: Math.max(4, prev.max_hours_per_day - 1)
                  }))}
                >
                  -
                </Button>
                <span className="font-semibold">{availabilitySettings.max_hours_per_day} hours</span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setAvailabilitySettings(prev => ({ 
                    ...prev, 
                    max_hours_per_day: Math.min(14, prev.max_hours_per_day + 1)
                  }))}
                >
                  +
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preferred Zones */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge className="h-5 w-5" />
              Preferred Zones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {availabilitySettings.preferred_zones.map((zone, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {zone}
                </Badge>
              ))}
              <Button variant="outline" size="sm" className="h-6 px-2">
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              You'll receive more offers in these areas
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};