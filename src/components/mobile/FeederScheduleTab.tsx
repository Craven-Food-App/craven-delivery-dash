import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Menu, Bell, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type FeederScheduleTabProps = {
  onOpenMenu?: () => void;
  onOpenNotifications?: () => void;
};

type ScheduleRecord = {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
  is_recurring: boolean;
};

type SurgeZone = {
  id: string;
  zone_name: string;
  city: string;
  demand_level: string;
  current_multiplier: number;
};

const FeederScheduleTab: React.FC<FeederScheduleTabProps> = ({
  onOpenMenu,
  onOpenNotifications
}) => {
  const today = useMemo(() => new Date(), []);
  const [activeDay, setActiveDay] = useState(0); // Start with today (first day in weekDays array)
  const [schedules, setSchedules] = useState<ScheduleRecord[]>([]);
  const [surgeZones, setSurgeZones] = useState<SurgeZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeToNextShift, setTimeToNextShift] = useState<{ hours: number; minutes: number } | null>(null);

  // Generate week days starting from today
  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      days.push({
        day: dayNames[date.getDay()],
        date: date.getDate().toString().padStart(2, '0'),
        dayOfWeek: date.getDay(),
        fullDate: date
      });
    }
    return days;
  }, [today]);

  // Fetch schedules from database
  const fetchSchedules = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setSchedules([]);
        return;
      }

      const { data, error } = await supabase
        .from('driver_schedules')
        .select('id, day_of_week, start_time, end_time, is_active, is_recurring')
        .eq('driver_id', user.id)
        .eq('is_active', true)
        .order('day_of_week')
        .order('start_time');

      if (error) throw error;
      setSchedules(data || []);
    } catch (error) {
      console.error('Error fetching schedules:', error);
      toast.error('Failed to load schedule');
    }
  }, []);

  // Fetch high demand zones
  const fetchSurgeZones = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('driver_surge_zones')
        .select('id, zone_name, city, demand_level, current_multiplier')
        .eq('is_active', true)
        .gte('active_until', new Date().toISOString())
        .or('demand_level.eq.high,demand_level.eq.very_high')
        .order('current_multiplier', { ascending: false })
        .limit(1);

      if (error) throw error;
      setSurgeZones(data || []);
    } catch (error) {
      console.error('Error fetching surge zones:', error);
      // Don't show error toast for surge zones, just use fallback
    }
  }, []);

  // Calculate time to next shift
  useEffect(() => {
    const calculateTimeToNextShift = () => {
      if (schedules.length === 0) {
        setTimeToNextShift(null);
        return;
      }

      const now = new Date();
      const currentDay = now.getDay();
      const currentTime = now.getHours() * 60 + now.getMinutes();

      // Find next shift
      let nextShift: ScheduleRecord | null = null;
      let nextShiftDate = new Date(now);

      // Check today's shifts first
      const todayShifts = schedules
        .filter(s => s.day_of_week === currentDay)
        .sort((a, b) => a.start_time.localeCompare(b.start_time));
      
      for (const shift of todayShifts) {
        const [startHour, startMin] = shift.start_time.split(':').map(Number);
        const startTime = startHour * 60 + startMin;
        if (startTime > currentTime) {
          nextShift = shift;
          nextShiftDate = new Date(now);
          break;
        }
      }

      // If no shift today, check upcoming days
      if (!nextShift) {
        for (let dayOffset = 1; dayOffset <= 7; dayOffset++) {
          const checkDate = new Date(now);
          checkDate.setDate(now.getDate() + dayOffset);
          checkDate.setHours(0, 0, 0, 0);
          const checkDay = checkDate.getDay();
          const dayShifts = schedules
            .filter(s => s.day_of_week === checkDay)
            .sort((a, b) => a.start_time.localeCompare(b.start_time));
          if (dayShifts.length > 0) {
            nextShift = dayShifts[0];
            nextShiftDate = checkDate;
            break;
          }
        }
      }

      // If still no shift found, wrap around to next week
      if (!nextShift && schedules.length > 0) {
        const sortedSchedules = [...schedules].sort((a, b) => {
          if (a.day_of_week !== b.day_of_week) {
            return a.day_of_week - b.day_of_week;
          }
          return a.start_time.localeCompare(b.start_time);
        });
        nextShift = sortedSchedules[0];
        nextShiftDate = new Date(now);
        const daysUntil = (nextShift.day_of_week - currentDay + 7) % 7 || 7;
        nextShiftDate.setDate(now.getDate() + daysUntil);
        nextShiftDate.setHours(0, 0, 0, 0);
      }

      if (nextShift) {
        const [startHour, startMin] = nextShift.start_time.split(':').map(Number);
        const shiftDateTime = new Date(nextShiftDate);
        shiftDateTime.setHours(startHour, startMin, 0, 0);
        
        // If shift time has passed, move to next week
        if (shiftDateTime <= now) {
          shiftDateTime.setDate(shiftDateTime.getDate() + 7);
        }

        const diffMs = shiftDateTime.getTime() - now.getTime();
        if (diffMs > 0) {
          const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
          const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
          setTimeToNextShift({ hours: diffHours, minutes: diffMinutes });
        } else {
          setTimeToNextShift(null);
        }
      } else {
        setTimeToNextShift(null);
      }
    };

    calculateTimeToNextShift();
    const interval = setInterval(calculateTimeToNextShift, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [schedules]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchSchedules(), fetchSurgeZones()]).finally(() => {
      setLoading(false);
    });

    // Listen for schedule updates
    const handleScheduleUpdate = () => {
      fetchSchedules();
    };

    window.addEventListener('scheduleUpdated', handleScheduleUpdate);
    return () => {
      window.removeEventListener('scheduleUpdated', handleScheduleUpdate);
    };
  }, [fetchSchedules, fetchSurgeZones]);

  // Get shifts for selected day
  const getShiftsForDay = (dayOfWeek: number) => {
    return schedules
      .filter(s => s.day_of_week === dayOfWeek)
      .map(shift => {
        const formatTime = (timeStr: string) => {
          const [hours, minutes] = timeStr.split(':');
          const hour = parseInt(hours);
          const ampm = hour >= 12 ? 'PM' : 'AM';
          const displayHour = hour % 12 || 12;
          return `${displayHour}:${minutes} ${ampm}`;
        };

        // Try to get location from surge zones or use default
        const location = surgeZones.length > 0 ? surgeZones[0].zone_name : 'Downtown';

        return {
          time: `${formatTime(shift.start_time)} – ${formatTime(shift.end_time)}`,
          location: location,
          id: shift.id
        };
      })
      .sort((a, b) => a.time.localeCompare(b.time));
  };

  const selectedDayShifts = getShiftsForDay(weekDays[activeDay]?.dayOfWeek || today.getDay());

  // Handle Start Shift button
  const handleStartShift = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please sign in to start a shift');
        return;
      }

      // Update driver profile to online
      const { error: profileError } = await supabase
        .from('driver_profiles')
        .update({
          status: 'online',
          is_available: true,
          last_location_update: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      // Update session
      await supabase
        .from('driver_sessions')
        .upsert({
          driver_id: user.id,
          is_online: true,
          last_activity: new Date().toISOString()
        }, {
          onConflict: 'driver_id'
        });

      toast.success('Shift started! You are now online.');
      window.dispatchEvent(new CustomEvent('driverStatusChange', { detail: { status: 'online' } }));
    } catch (error) {
      console.error('Error starting shift:', error);
      toast.error('Failed to start shift');
    }
  };

  // Handle Available button
  const handleAvailable = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please sign in');
        return;
      }

      const { error } = await supabase
        .from('driver_profiles')
        .update({
          is_available: true,
          status: 'online'
        })
        .eq('user_id', user.id);

      if (error) throw error;
      toast.success('You are now available');
    } catch (error) {
      console.error('Error setting available:', error);
      toast.error('Failed to update availability');
    }
  };

  // Handle Scheduled button - show scheduled shifts
  const handleScheduled = () => {
    toast.info(`You have ${selectedDayShifts.length} shift${selectedDayShifts.length !== 1 ? 's' : ''} scheduled for ${weekDays[activeDay]?.day}`);
  };

  // Format time remaining
  const formatTimeRemaining = () => {
    if (!timeToNextShift) return 'No upcoming shifts';
    if (timeToNextShift.hours === 0) {
      return `${timeToNextShift.minutes}m remaining`;
    }
    return `${timeToNextShift.hours}h ${timeToNextShift.minutes}m remaining`;
  };

  // Calculate progress percentage for circular progress (75% filled = 75 dash, 25 gap)
  const progressPercentage = useMemo(() => {
    if (!timeToNextShift) return 75; // Default to 75% if no shift
    // Calculate how close we are to the shift (inverse - less time = more progress)
    const totalMinutes = timeToNextShift.hours * 60 + timeToNextShift.minutes;
    const maxMinutes = 4 * 60; // 4 hours max
    const progress = Math.min(100, Math.max(0, ((maxMinutes - totalMinutes) / maxMinutes) * 100));
    return Math.round(progress);
  }, [timeToNextShift]);

  // Get high demand zone display
  const highDemandZone = surgeZones.length > 0 
    ? { name: surgeZones[0].zone_name, city: surgeZones[0].city }
    : { name: 'Downtown', city: 'Detroit Metro' }; // Fallback

  if (loading) {
    return (
      <div className="h-screen w-full bg-gradient-to-b from-red-600 via-orange-600 to-pink-600 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-gradient-to-b from-red-600 via-orange-600 to-pink-600 overflow-y-auto pb-20">
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between">
        <button 
          onClick={() => {
            if (onOpenMenu) {
              onOpenMenu();
            } else {
              toast.info('Menu coming soon.');
            }
          }}
          className="text-white"
        >
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="text-orange-400 text-3xl font-bold tracking-wide">SCHEDULE</h1>
        <button 
          onClick={() => {
            if (onOpenNotifications) {
              onOpenNotifications();
            } else {
              toast.info('Notifications coming soon.');
            }
          }}
          className="text-white"
        >
          <Bell className="w-7 h-7" />
        </button>
      </div>

      {/* Container */}
      <div className="px-6">
        {/* Next Shift Row */}
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-4">
            {/* Circular Progress */}
            <div className="relative w-20 h-20 flex-shrink-0">
              <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                <circle 
                  cx="18" 
                  cy="18" 
                  r="15.916" 
                  fill="none" 
                  stroke="rgba(255,255,255,0.3)" 
                  strokeWidth="3"
                />
                <circle 
                  cx="18" 
                  cy="18" 
                  r="15.916" 
                  fill="none" 
                  stroke="white" 
                  strokeWidth="2.5" 
                  strokeDasharray={`${progressPercentage}, 100`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white text-[9px] font-bold text-center leading-tight">NEXT<br/>SHIFT</span>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-white text-lg font-semibold">Time To Next Shift</p>
              <p className="text-white/80 text-sm">{formatTimeRemaining()}</p>
            </div>
          </div>
          
          {/* Buttons in horizontal row */}
          <div className="flex gap-2">
            <button 
              onClick={handleStartShift}
              className="flex-1 bg-red-900 text-white px-4 py-2 rounded-full font-bold text-xs shadow-lg hover:bg-red-800 transition-colors"
            >
              Start Shift
            </button>
            <button 
              onClick={handleAvailable}
              className="flex-1 bg-white text-red-700 px-4 py-2 rounded-full font-bold text-xs shadow-lg hover:bg-gray-50 transition-colors"
            >
              Available
            </button>
            <button 
              onClick={handleScheduled}
              className="flex-1 bg-white text-red-700 px-4 py-2 rounded-full font-bold text-xs shadow-lg hover:bg-gray-50 transition-colors"
            >
              Scheduled
            </button>
          </div>
        </div>

        {/* Zone Banner */}
        <div className="bg-orange-50 rounded-2xl py-2.5 px-4 text-center mb-6 shadow-lg">
          <p className="text-red-800 font-bold text-base">🔥 High Demand Zone</p>
          <p className="text-orange-800 text-xs">{highDemandZone.city}</p>
        </div>

        {/* Week Strip */}
        <div className="grid grid-cols-7 gap-2 mb-6">
          {weekDays.map((item, index) => (
            <button
              key={index}
              onClick={() => setActiveDay(index)}
              className={`rounded-full py-3 text-center transition-all ${
                activeDay === index
                  ? 'bg-red-900 text-white shadow-lg scale-105'
                  : 'bg-orange-400/60 text-white hover:bg-orange-400/80'
              }`}
            >
              <p className="text-xs font-semibold">{item.day}</p>
              <p className="text-lg font-bold">{item.date}</p>
            </button>
          ))}
        </div>

        {/* Shift List */}
        <div className="space-y-3 pb-24">
          <h3 className="text-white text-lg font-bold mb-3">
            {weekDays[activeDay]?.day === weekDays[0]?.day ? "Today's Shifts" : `${weekDays[activeDay]?.day}'s Shifts`}
          </h3>
          {selectedDayShifts.length > 0 ? (
            selectedDayShifts.map((shift, index) => (
              <div key={shift.id || index} className="bg-orange-50 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-shadow">
                <p className="text-gray-900 font-bold text-lg mb-1">{shift.time}</p>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-orange-600" />
                  <p className="text-orange-800 font-semibold">{shift.location}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-orange-50 rounded-2xl p-4 shadow-lg text-center">
              <p className="text-orange-800 font-semibold">No shifts scheduled for this day</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeederScheduleTab;

