import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Menu, Bell, MapPin, Pencil, X } from 'lucide-react';
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
  surge_multiplier: number;
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
  const [viewMode, setViewMode] = useState<'schedule' | 'available' | 'scheduled'>('available');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ zone: string; city: string; startTime: string; endTime: string; displayStart: string; displayEnd: string } | null>(null);
  const [selectedStartTime, setSelectedStartTime] = useState('09:00');
  const [selectedEndTime, setSelectedEndTime] = useState('17:00');

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
        .select('id, zone_name, surge_multiplier')
        .eq('is_active', true)
        .order('surge_multiplier', { ascending: false })
        .limit(1);

      if (error) throw error;
      setSurgeZones(data || []);
    } catch (error) {
      console.error('Error fetching surge zones:', error);
      // Don't show error toast for surge zones, just use fallback
    }
  }, []);

  // Calculate time to next shift using real schedule data
  useEffect(() => {
    const calculateTimeToNextShift = () => {
      console.log('Calculating time to next shift. Schedules:', schedules);
      
      if (!schedules || schedules.length === 0) {
        console.log('No schedules found, setting to null');
        setTimeToNextShift(null);
        return;
      }

      const now = new Date();
      const currentDay = now.getDay();
      const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();
      
      console.log('Current time:', now.toISOString(), 'Day:', currentDay, 'Minutes:', currentTimeMinutes);

      // Helper to parse time string (handles "HH:MM" or "HH:MM:SS" formats)
      const parseTime = (timeStr: string): { hour: number; minute: number } => {
        const parts = timeStr.split(':');
        return {
          hour: parseInt(parts[0], 10),
          minute: parseInt(parts[1] || '0', 10)
        };
      };

      // Find the next upcoming shift across all days
      let nextShiftDateTime: Date | null = null;
      let minDiffMs = Infinity;

      // Check all shifts in the next 14 days (2 weeks) to find the closest one
      for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
        const checkDate = new Date(now);
        checkDate.setDate(now.getDate() + dayOffset);
        checkDate.setHours(0, 0, 0, 0);
        const checkDay = checkDate.getDay();
        
        const dayShifts = schedules
          .filter(s => s.day_of_week === checkDay && s.is_active)
          .sort((a, b) => a.start_time.localeCompare(b.start_time));
        
        for (const shift of dayShifts) {
          const { hour: startHour, minute: startMin } = parseTime(shift.start_time);
          const shiftDateTime = new Date(checkDate);
          shiftDateTime.setHours(startHour, startMin, 0, 0);
          
          const diffMs = shiftDateTime.getTime() - now.getTime();
          
          console.log(`Checking shift: day ${checkDay}, time ${shift.start_time}, datetime ${shiftDateTime.toISOString()}, diff ${diffMs}ms`);
          
          // Only consider future shifts
          if (diffMs > 0 && diffMs < minDiffMs) {
            minDiffMs = diffMs;
            nextShiftDateTime = shiftDateTime;
            console.log('Found closer shift:', shiftDateTime.toISOString());
          }
        }
      }

      // If no future shift found in 2 weeks, wrap to next occurrence of earliest shift
      if (!nextShiftDateTime) {
        console.log('No shift found in 14 days, checking next week');
        const sortedSchedules = [...schedules]
          .filter(s => s.is_active)
          .sort((a, b) => {
            if (a.day_of_week !== b.day_of_week) {
              return a.day_of_week - b.day_of_week;
            }
            return a.start_time.localeCompare(b.start_time);
          });
        
        if (sortedSchedules.length > 0) {
          const earliestShift = sortedSchedules[0];
          const { hour: startHour, minute: startMin } = parseTime(earliestShift.start_time);
          nextShiftDateTime = new Date(now);
          
          // Calculate days until next occurrence
          let daysUntil = (earliestShift.day_of_week - currentDay + 7) % 7;
          if (daysUntil === 0) {
            // Same day - check if time has passed
            const shiftTimeMinutes = startHour * 60 + startMin;
            if (shiftTimeMinutes <= currentTimeMinutes) {
              daysUntil = 7; // Next week
            }
          }
          
          nextShiftDateTime.setDate(now.getDate() + daysUntil);
          nextShiftDateTime.setHours(startHour, startMin, 0, 0);
          console.log('Using earliest shift next week:', nextShiftDateTime.toISOString(), 'daysUntil:', daysUntil);
        }
      }

      if (nextShiftDateTime) {
        const diffMs = nextShiftDateTime.getTime() - now.getTime();
        console.log('Final shift datetime:', nextShiftDateTime.toISOString(), 'diff:', diffMs, 'ms');
        
        if (diffMs > 0) {
          const totalMinutes = Math.floor(diffMs / (1000 * 60));
          const diffHours = Math.floor(totalMinutes / 60);
          const diffMinutes = totalMinutes % 60;
          
          console.log('Setting time to next shift:', { hours: diffHours, minutes: diffMinutes });
          setTimeToNextShift({ hours: diffHours, minutes: diffMinutes });
        } else {
          console.log('Diff is negative or zero, setting to null');
          setTimeToNextShift(null);
        }
      } else {
        console.log('No next shift datetime found, setting to null');
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

  // Generate time slots from 12:00 AM to 11:59 PM
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = 0; hour < 24; hour++) {
      const startHour = hour.toString().padStart(2, '0');
      const endHour = ((hour + 1) % 24).toString().padStart(2, '0');
      const formatTime = (h: string) => {
        const hNum = parseInt(h);
        const ampm = hNum >= 12 ? 'PM' : 'AM';
        const displayHour = hNum % 12 || 12;
        return `${displayHour}:00 ${ampm}`;
      };
      slots.push({
        start: `${startHour}:00`,
        end: `${endHour}:00`,
        displayStart: formatTime(startHour),
        displayEnd: formatTime(endHour)
      });
    }
    return slots;
  }, []);

  // Get available shifts for selected day (based on surge zones)
  const getAvailableShifts = useMemo(() => {
    const selectedDayOfWeek = weekDays[activeDay]?.dayOfWeek || today.getDay();
    const availableShifts = [];
    
    // For each surge zone, create available time slots
    surgeZones.forEach(zone => {
      timeSlots.forEach(slot => {
        // Check if this slot conflicts with existing schedules
        const conflicts = schedules.some(s => {
          if (s.day_of_week !== selectedDayOfWeek || !s.is_active) return false;
          const [sStartHour] = s.start_time.split(':').map(Number);
          const [sEndHour] = s.end_time.split(':').map(Number);
          const [slotStartHour] = slot.start.split(':').map(Number);
          const [slotEndHour] = slot.end.split(':').map(Number);
          
          // Check for overlap
          return (slotStartHour >= sStartHour && slotStartHour < sEndHour) ||
                 (slotEndHour > sStartHour && slotEndHour <= sEndHour) ||
                 (slotStartHour <= sStartHour && slotEndHour >= sEndHour);
        });
        
        if (!conflicts) {
          availableShifts.push({
            zone: zone.zone_name,
            startTime: slot.start,
            endTime: slot.end,
            displayStart: slot.displayStart,
            displayEnd: slot.displayEnd
          });
        }
      });
    });
    
    // If no surge zones, show default zones
    if (availableShifts.length === 0) {
      timeSlots.forEach(slot => {
        const conflicts = schedules.some(s => {
          if (s.day_of_week !== selectedDayOfWeek || !s.is_active) return false;
          const [sStartHour] = s.start_time.split(':').map(Number);
          const [sEndHour] = s.end_time.split(':').map(Number);
          const [slotStartHour] = slot.start.split(':').map(Number);
          const [slotEndHour] = slot.end.split(':').map(Number);
          return (slotStartHour >= sStartHour && slotStartHour < sEndHour) ||
                 (slotEndHour > sStartHour && slotEndHour <= sEndHour) ||
                 (slotStartHour <= sStartHour && slotEndHour >= sEndHour);
        });
        
        if (!conflicts) {
          availableShifts.push({
            zone: 'Downtown',
            startTime: slot.start,
            endTime: slot.end,
            displayStart: slot.displayStart,
            displayEnd: slot.displayEnd
          });
        }
      });
    }
    
    return availableShifts;
  }, [surgeZones, timeSlots, schedules, activeDay, weekDays, today]);

  // Handle Available button - switch to available view
  const handleAvailable = () => {
    setViewMode('available');
  };

  // Handle Scheduled button - switch to scheduled view
  const handleScheduled = () => {
    setViewMode('scheduled');
  };

  // Handle pencil icon click - open time picker
  const handleEditTimeSlot = (slot: { zone: string; city: string; startTime: string; endTime: string; displayStart: string; displayEnd: string }) => {
    setSelectedSlot(slot);
    setSelectedStartTime(slot.startTime);
    setSelectedEndTime(slot.endTime);
    setShowTimePicker(true);
  };

  // Handle scheduling a shift
  const handleScheduleShift = async () => {
    if (!selectedSlot) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please sign in to schedule a shift');
        return;
      }

      const selectedDayOfWeek = weekDays[activeDay]?.dayOfWeek || today.getDay();
      const startTimeSql = `${selectedStartTime}:00`;
      const endTimeSql = selectedEndTime === '24:00' ? '00:00:00' : `${selectedEndTime}:00`;

      const { error } = await supabase
        .from('driver_schedules')
        .insert({
          driver_id: user.id,
          day_of_week: selectedDayOfWeek,
          start_time: startTimeSql,
          end_time: endTimeSql,
          is_active: true,
          is_recurring: false
        });

      if (error) throw error;

      toast.success('Shift scheduled successfully!');
      setShowTimePicker(false);
      setSelectedSlot(null);
      await fetchSchedules();
      setViewMode('schedule');
    } catch (error) {
      console.error('Error scheduling shift:', error);
      toast.error('Failed to schedule shift');
    }
  };

  // Format time remaining
  const formatTimeRemaining = () => {
    if (!timeToNextShift) return 'No upcoming shifts';
    
    const { hours, minutes } = timeToNextShift;
    
    // If more than 24 hours, show days
    if (hours >= 24) {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      if (remainingHours === 0) {
        return `${days}d remaining`;
      }
      return `${days}d ${remainingHours}h remaining`;
    }
    
    // Less than 24 hours
    if (hours === 0) {
      return `${minutes}m remaining`;
    }
    return `${hours}h ${minutes}m remaining`;
  };

  // Calculate progress percentage for circular progress based on real time to next shift
  const progressPercentage = useMemo(() => {
    if (!timeToNextShift) return 0; // No shift = 0% progress
    
    const totalMinutes = timeToNextShift.hours * 60 + timeToNextShift.minutes;
    
    // Use a dynamic max based on the furthest shift in the week (max 7 days = 168 hours)
    // For display purposes, cap at 24 hours (1440 minutes) for better visual feedback
    // Less time remaining = more progress filled
    const maxMinutes = 24 * 60; // 24 hours max for progress calculation
    const progress = Math.min(100, Math.max(0, ((maxMinutes - totalMinutes) / maxMinutes) * 100));
    
    return Math.round(progress);
  }, [timeToNextShift]);

  // Get high demand zone display
  const highDemandZone = surgeZones.length > 0 
    ? { name: surgeZones[0].zone_name }
    : { name: 'Downtown' }; // Fallback

  if (loading) {
    return (
      <div className="h-screen w-full bg-gradient-to-b from-red-600 via-orange-600 to-pink-600 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-gradient-to-b from-red-600 via-orange-600 to-pink-600 flex flex-col">
      {/* Header - Fixed at top */}
      <div className="px-6 pb-4 flex items-center justify-between flex-shrink-0 safe-area-top">
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
          <p className="text-red-800 font-bold text-base">🔥 High Demand Zone: {highDemandZone.name}</p>
        </div>

        {/* Week Strip - Always visible */}
        <div className="grid grid-cols-7 gap-2 mb-6">
          {weekDays.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                setActiveDay(index);
                if (viewMode === 'available' || viewMode === 'scheduled') {
                  // Keep current view mode when clicking days
                } else {
                  setViewMode('schedule');
                }
              }}
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

        {/* Section Title - Fixed */}
        {viewMode === 'schedule' && (
          <h3 className="text-white text-lg font-bold mb-3 flex-shrink-0">
            {weekDays[activeDay]?.day === weekDays[0]?.day ? "Today's Shifts" : `${weekDays[activeDay]?.day}'s Shifts`}
          </h3>
        )}

        {/* Available/Scheduled View Headers - Fixed */}
        {viewMode === 'available' && (
          <div className="flex items-center justify-between mb-3 flex-shrink-0">
            <h3 className="text-white text-lg font-bold">
              Available Shifts - {weekDays[activeDay]?.day}
            </h3>
            <button
              onClick={() => setViewMode('schedule')}
              className="text-white text-sm underline"
            >
              Back
            </button>
          </div>
        )}

        {viewMode === 'scheduled' && (
          <div className="flex items-center justify-between mb-3 flex-shrink-0">
            <h3 className="text-white text-lg font-bold">
              Scheduled Shifts - {weekDays[activeDay]?.day}
            </h3>
            <button
              onClick={() => setViewMode('schedule')}
              className="text-white text-sm underline"
            >
              Back
            </button>
          </div>
        )}
      </div>

      {/* Scrollable Content Area - Only the list scrolls */}
      <div className="flex-1 overflow-y-auto px-6" style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))' }}>
        {/* Content based on view mode */}
        {viewMode === 'schedule' && (
          <div className="space-y-3">
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
        )}

        {viewMode === 'available' && (
          <div className="space-y-3">
            {getAvailableShifts.length > 0 ? (
              getAvailableShifts.map((shift, index) => (
                <div key={index} className="bg-orange-50 rounded-2xl p-4 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-gray-900 font-bold text-lg mb-1">
                        {shift.displayStart} – {shift.displayEnd}
                      </p>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-orange-600" />
                        <p className="text-orange-800 font-semibold">{shift.zone}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleEditTimeSlot(shift)}
                      className="ml-4 p-2 bg-white rounded-full shadow hover:bg-gray-50 transition-colors"
                    >
                      <Pencil className="w-5 h-5 text-red-700" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-orange-50 rounded-2xl p-4 shadow-lg text-center">
                <p className="text-orange-800 font-semibold">No available shifts for this day</p>
              </div>
            )}
          </div>
        )}

        {viewMode === 'scheduled' && (
          <div className="space-y-3">
            {selectedDayShifts.length > 0 ? (
              selectedDayShifts.map((shift, index) => (
                <div key={shift.id || index} className="bg-orange-50 rounded-2xl p-4 shadow-lg">
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
        )}

        {/* Time Picker Modal */}
        {showTimePicker && selectedSlot && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Select Time Slot</h3>
                <button
                  onClick={() => {
                    setShowTimePicker(false);
                    setSelectedSlot(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Zone: <span className="font-semibold text-gray-900">{selectedSlot.zone}</span></p>
                <p className="text-sm text-gray-600 mb-2">City: <span className="font-semibold text-gray-900">{selectedSlot.city}</span></p>
                <p className="text-sm text-gray-600">Available: {selectedSlot.displayStart} – {selectedSlot.displayEnd}</p>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Start Time</label>
                  <input
                    type="time"
                    value={selectedStartTime}
                    onChange={(e) => setSelectedStartTime(e.target.value)}
                    min={selectedSlot.startTime}
                    max={selectedSlot.endTime}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-red-600 focus:outline-none text-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">End Time</label>
                  <input
                    type="time"
                    value={selectedEndTime}
                    onChange={(e) => setSelectedEndTime(e.target.value)}
                    min={selectedStartTime}
                    max={selectedSlot.endTime}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-red-600 focus:outline-none text-lg"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowTimePicker(false);
                    setSelectedSlot(null);
                  }}
                  className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleScheduleShift}
                  className="flex-1 px-4 py-3 bg-red-900 text-white rounded-xl font-bold hover:bg-red-800 transition-colors"
                >
                  Schedule Shift
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeederScheduleTab;

