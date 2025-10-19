import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Calendar,
  Clock,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
  Play,
  Settings,
  X,
  Menu,
  ChevronDown,
  ChevronUp,
  CircleDot,
  Power,
} from 'lucide-react';

// --- MOCK UI COMPONENTS (Based on shadcn/ui structure) ---

const Card = ({ children, className = '' }) => (
  <div className={`rounded-2xl border border-gray-200 bg-white text-card-foreground shadow-xl transition-shadow ${className}`}>
    {children}
  </div>
);
const CardHeader = ({ children, className = '' }) => (
  <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>{children}</div>
);
const CardTitle = ({ children, className = '' }) => (
  <h3 className={`font-extrabold tracking-tight text-lg text-gray-800 ${className}`}>{children}</h3>
);
const CardContent = ({ children, className = '' }) => (
  <div className={`p-6 pt-0 ${className}`}>{children}</div>
);

const Button = ({ children, variant = 'default', size = 'default', className = '', onClick, disabled = false, type = 'button' }) => {
  let baseClasses = 'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background';
  
  // CHANGED: Blue -> Orange
  if (variant === 'default') baseClasses += ' bg-orange-600 text-white hover:bg-orange-700 shadow-lg hover:shadow-xl active:scale-[0.98]';
  if (variant === 'secondary') baseClasses += ' bg-gray-200 text-gray-800 hover:bg-gray-300 shadow-sm';
  if (variant === 'outline') baseClasses += ' border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 shadow-sm';
  if (variant === 'ghost') baseClasses += ' hover:bg-gray-100 text-gray-600';
  if (variant === 'destructive') baseClasses += ' bg-amber-600 text-white hover:bg-amber-700 shadow-lg';

  if (size === 'default') baseClasses += ' h-11 py-2 px-5';
  if (size === 'sm') baseClasses += ' h-9 px-4 rounded-lg';
  if (size === 'icon') baseClasses += ' h-10 w-10';

  return (
    <button type={type as "button" | "submit" | "reset"} className={`${baseClasses} ${className}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
};

const Badge = ({ children, variant = 'default', className = '' }) => {
  let baseClasses = 'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold tracking-wider transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2';
  
  // CHANGED: Blue -> Orange
  if (variant === 'default') baseClasses += ' border-transparent bg-orange-500 text-white';
  if (variant === 'secondary') baseClasses += ' border-transparent bg-gray-200 text-gray-800';
  if (variant === 'outline') baseClasses += ' text-foreground border-gray-300';

  return <span className={`${baseClasses} ${className}`}>{children}</span>;
};

const Switch = ({ checked, onCheckedChange }) => (
  <button
    role="switch"
    aria-checked={checked}
    onClick={() => onCheckedChange(!checked)}
    // CHANGED: Blue -> Orange
    className={`peer inline-flex h-[24px] w-[44px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 ${checked ? 'bg-orange-600' : 'bg-gray-400'}`}
  >
    <span
      className={`pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`}
    />
  </button>
);

const Input = ({ type = 'text', value, onChange, placeholder = '', className = '', name }) => (
    <input 
        type={type} 
        name={name}
        value={value} 
        onChange={onChange} 
        placeholder={placeholder} 
        // CHANGED: Blue -> Orange (Focus Ring)
        className={`flex h-11 w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    />
);

const Select = ({ value, onChange, options, className = '', name }) => (
    <select 
        name={name}
        value={value} 
        onChange={onChange} 
        // CHANGED: Blue -> Orange (Focus Ring)
        className={`flex h-11 w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
        {options.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
        ))}
    </select>
);

const Label = ({ children, className = '' }) => (
    <label className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`}>{children}</label>
);

// --- MOCK HOOKS AND UTILITIES (Same as before) ---
const useToast = () => {
  const [toasts, setToasts] = useState([]);
  const toast = ({ title, description, variant = 'default' }) => {
    const id = Date.now();
    const newToast = { id, title, description, variant };
    setToasts((prev) => [...prev, newToast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter(t => t.id !== id));
    }, 3000);
  };
  const ToastContainer = () => (
    <div className="fixed bottom-4 right-4 z-[9999] space-y-2">
      {toasts.map((t) => (
        <div 
          key={t.id} 
          className={`p-4 rounded-lg shadow-xl text-white max-w-xs transition-opacity duration-300 opacity-100 ${
            t.variant === 'destructive' ? 'bg-amber-500' : 'bg-green-500' // Keeping green for success/default, amber for destructive
          }`}
        >
          <div className="font-bold">{t.title}</div>
          <div className="text-sm">{t.description}</div>
        </div>
      ))}
    </div>
  );
  return { toast, ToastContainer };
};

// Mock Data (unchanged)
const MOCK_SCHEDULE_DATA = [
  {
    id: '1',
    day_of_week: 1, // Monday
    start_time: '09:00',
    end_time: '17:00',
    is_active: true,
    is_recurring: true,
    created_at: new Date(new Date().setDate(new Date().getDate() - 3)).toISOString(),
  },
  {
    id: '2',
    day_of_week: 3, // Wednesday
    start_time: '10:00',
    end_time: '14:00',
    is_active: true,
    is_recurring: true,
    created_at: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString(),
  },
  {
    id: '3',
    day_of_week: 5, // Friday
    start_time: '18:00',
    end_time: '23:00',
    is_active: true,
    is_recurring: true,
    created_at: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(),
  },
];

const mockSupabase = {
  auth: {
    getUser: () => Promise.resolve({ data: { user: { id: 'mock-user-123' } }, error: null }),
  },
  from: (tableName) => ({
    select: (fields) => ({
      eq: (col, val) => ({
        order: (col) => new Promise(resolve => {
          setTimeout(() => resolve({ data: MOCK_SCHEDULE_DATA, error: null }), 500);
        }),
      }),
    }),
    insert: (data) => new Promise(resolve => {
      setTimeout(() => resolve({ error: null }), 100);
    }),
    update: (data) => ({
        eq: (col, val) => new Promise(resolve => {
            setTimeout(() => resolve({ error: null }), 100);
        })
    }),
    delete: () => ({
        eq: (col, val) => new Promise(resolve => {
            setTimeout(() => resolve({ error: null }), 100);
        })
    })
  }),
};

// --- INTERFACE DEFINITIONS ---

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

// --- SCHEDULE FORM MODAL COMPONENT ---

interface ScheduleBlockFormProps {
    block: ScheduleBlock | null;
    onClose: () => void;
    onSave: (block: ScheduleBlock) => void;
}

const ScheduleBlockForm: React.FC<ScheduleBlockFormProps> = ({ block, onClose, onSave }) => {
    const isEditing = !!block;
    const initialBlock: ScheduleBlock = block || {
        id: Date.now().toString(),
        day_of_week: new Date().getDay(),
        start_time: '09:00',
        end_time: '17:00',
        is_active: true,
        is_recurring: true,
        created_at: new Date().toISOString(),
    };

    const [formData, setFormData] = useState(initialBlock);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCheckboxChange = (checked: boolean) => {
        setFormData(prev => ({ ...prev, is_recurring: checked }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Simple validation check: end time must be after start time (in the same day)
        if (formData.start_time >= formData.end_time) {
            alert("End time must be after start time."); // Note: Real-world app would use a custom modal/toast
            return;
        }
        onSave(formData);
        onClose();
    };

    const dayOptions = DAYS_OF_WEEK.map((day, index) => ({ value: index.toString(), label: day }));

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <Card className="w-full max-w-sm rounded-2xl animate-in fade-in-0 zoom-in-95 duration-300">
                <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100">
                    {/* CHANGED: Blue -> Orange */}
                    <CardTitle className="text-xl font-extrabold text-orange-700">{isEditing ? 'Edit Shift' : 'Add New Shift'}</CardTitle>
                    <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-500 hover:bg-gray-100">
                        <X className="h-5 w-5" />
                    </Button>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4 pt-6">
                        <div className="space-y-2">
                            <Label>Day of the Week</Label>
                            <Select 
                                name="day_of_week"
                                value={formData.day_of_week.toString()}
                                onChange={handleChange}
                                options={dayOptions}
                            />
                        </div>
                        <div className="flex gap-4">
                            <div className="space-y-2 w-1/2">
                                <Label>Start Time</Label>
                                <Input 
                                    type="time"
                                    name="start_time"
                                    value={formData.start_time}
                                    onChange={handleChange}
                                    placeholder=""
                                />
                            </div>
                            <div className="space-y-2 w-1/2">
                                <Label>End Time</Label>
                                <Input 
                                    type="time"
                                    name="end_time"
                                    value={formData.end_time}
                                    onChange={handleChange}
                                    placeholder=""
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                            <div>
                                <Label>Recurring Shift</Label>
                                <p className="text-xs text-gray-500">Applies every week</p>
                            </div>
                            <Switch 
                                checked={formData.is_recurring}
                                onCheckedChange={handleCheckboxChange}
                            />
                        </div>
                    </CardContent>
                    <div className="flex justify-end p-6 pt-0 gap-3">
                        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                        {/* CHANGED: Blue -> Orange */}
                        <Button type="submit" variant="default" className="bg-orange-600 hover:bg-orange-700" onClick={() => {}}>{isEditing ? 'Update Shift' : 'Save Shift'}</Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};


// --- MAIN APPLICATION COMPONENT ---

export default function ScheduleSection() {
  const [scheduleBlocks, setScheduleBlocks] = useState<ScheduleBlock[]>([]);
  const [availabilitySettings, setAvailabilitySettings] = useState<AvailabilitySettings>({
    auto_online: true,
    break_reminders: true,
    max_hours_per_day: 12,
    preferred_zones: ['Downtown', 'University District']
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<ScheduleBlock | null>(null);
  const [currentStatus, setCurrentStatus] = useState<'offline' | 'scheduled' | 'online'>('offline');
  const [todayHours, setTodayHours] = useState({ scheduled: 0, worked: 3.5 });
  const [loading, setLoading] = useState(true);

  const { toast, ToastContainer } = useToast();

  const formatTime = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const getCurrentTimeString = () => new Date().toTimeString().slice(0, 5);

  const calculateTotalTime = useCallback((start_time: string, end_time: string) => {
    const [startH, startM] = start_time.split(':').map(Number);
    const [endH, endM] = end_time.split(':').map(Number);
    const startTimeInMinutes = startH * 60 + startM;
    const endTimeInMinutes = endH * 60 + endM;
    let duration = endTimeInMinutes - startTimeInMinutes;
    if (duration < 0) {
      duration += 24 * 60;
    }
    return duration / 60;
  }, []);

  const calculateWeeklyHours = useCallback((blocks: ScheduleBlock[]) => {
    return blocks
      .filter(block => block.is_active)
      .reduce((total, block) => {
        return total + calculateTotalTime(block.start_time, block.end_time);
      }, 0);
  }, [calculateTotalTime]);

  const calculateTodayScheduledHours = useCallback((blocks: ScheduleBlock[]) => {
    const currentDay = new Date().getDay();
    return blocks
      .filter(block => block.day_of_week === currentDay && block.is_active)
      .reduce((total, block) => {
        return total + calculateTotalTime(block.start_time, block.end_time);
      }, 0);
  }, [calculateTotalTime]);

  const checkCurrentScheduleStatus = useCallback((blocks: ScheduleBlock[], manualStatus: 'offline' | 'online' = 'offline') => {
    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = getCurrentTimeString();
    
    const isScheduled = blocks.some(block =>
      block.day_of_week === currentDay &&
      block.is_active &&
      currentTime >= block.start_time &&
      currentTime <= block.end_time
    );

    if (manualStatus === 'online') {
        setCurrentStatus('online');
    } else if (manualStatus === 'offline') {
        setCurrentStatus(isScheduled ? 'scheduled' : 'offline');
    }

    setTodayHours(prev => ({ ...prev, scheduled: calculateTodayScheduledHours(blocks) }));
  }, [calculateTodayScheduledHours]);

  const fetchScheduleData = useCallback(async () => {
    try {
      const { data: { user } } = await mockSupabase.auth.getUser();
      if (!user) return;

      const result = await mockSupabase
        .from('driver_schedules')
        .select('*')
        .eq('driver_id', user.id)
        .order('day_of_week');

      const { data: scheduleData, error } = result as { data: any, error: any };
      if (error) {
        console.error('Error fetching schedule (mocked):', error);
      } else {
        const blocks = scheduleData as ScheduleBlock[];
        setScheduleBlocks(blocks || []);
        checkCurrentScheduleStatus(blocks || []);
      }
    } catch (error) {
      console.error('Error fetching schedule (mocked):', error);
    } finally {
      setLoading(false);
    }
  }, [checkCurrentScheduleStatus]);

  useEffect(() => {
    fetchScheduleData();
    
    let channel: any = null;
    
    // Check current driver status on mount and set up realtime
    const initStatusSync = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        // Check both driver_profiles and driver_sessions for online status
        const [profileResult, sessionResult] = await Promise.all([
          supabase
            .from('driver_profiles')
            .select('status, is_available')
            .eq('user_id', user.id)
            .single(),
          supabase
            .from('driver_sessions')
            .select('is_online')
            .eq('driver_id', user.id)
            .single()
        ]);
        
        const isOnline = 
          (profileResult.data?.status === 'online' && profileResult.data?.is_available) ||
          sessionResult.data?.is_online;
        
        if (isOnline) {
          setCurrentStatus('online');
        } else {
          setCurrentStatus('offline');
        }
        
        // Set up realtime subscription for driver_profiles changes
        channel = supabase
          .channel('driver-status-changes')
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'driver_profiles',
              filter: `user_id=eq.${user.id}`
            },
            (payload) => {
              const newStatus = payload.new as any;
              if (newStatus.status === 'online' && newStatus.is_available) {
                setCurrentStatus('online');
              } else if (newStatus.status === 'offline') {
                setCurrentStatus('offline');
              }
            }
          )
          .subscribe();
      } catch (error) {
        console.error('Error checking driver status:', error);
      }
    };
    
    initStatusSync();
    
    // Listen for driver status changes from main dashboard
    const handleStatusChange = (event: CustomEvent) => {
      const { status } = event.detail;
      setCurrentStatus(status);
    };
    
    window.addEventListener('driverStatusChange', handleStatusChange as EventListener);
    
    return () => {
      window.removeEventListener('driverStatusChange', handleStatusChange as EventListener);
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [fetchScheduleData]);

  // Re-check status every minute
  useEffect(() => {
    const interval = setInterval(() => {
      checkCurrentScheduleStatus(scheduleBlocks, currentStatus === 'online' ? 'online' : 'offline');
    }, 60000);
    return () => clearInterval(interval);
  }, [scheduleBlocks, checkCurrentScheduleStatus, currentStatus]);


  // --- CRUD Handlers ---

  const handleSaveBlock = async (block: ScheduleBlock) => {
    try {
      if (scheduleBlocks.find(b => b.id === block.id)) {
        // Edit existing
        await mockSupabase.from('driver_schedules').update(block).eq('id', block.id);
        setScheduleBlocks(prev => prev.map(b => (b.id === block.id ? block : b)));
        toast({ title: "Shift Updated", description: "Schedule block modified successfully." });
      } else {
        // Add new
        await mockSupabase.from('driver_schedules').insert(block);
        setScheduleBlocks(prev => [...prev, block]);
        toast({ title: "Shift Added", description: "New schedule block saved." });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to save schedule block.", variant: "destructive" });
    }
  };

  const handleDeleteBlock = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this shift?")) return;
    try {
        await mockSupabase.from('driver_schedules').delete().eq('id', id);
        setScheduleBlocks(prev => prev.filter(b => b.id !== id));
        toast({ title: "Shift Deleted", description: "Schedule block removed successfully." });
    } catch (error) {
        toast({ title: "Error", description: "Failed to delete schedule block.", variant: "destructive" });
    }
  };


  const getNextScheduledBlock = useCallback(() => {
    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = getCurrentTimeString();
    
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const checkDay = (currentDay + dayOffset) % 7;
      const dayBlocks = scheduleBlocks
        .filter(block => block.day_of_week === checkDay && block.is_active)
        .sort((a, b) => a.start_time.localeCompare(b.start_time));
      
      for (const block of dayBlocks) {
        if (dayOffset === 0 && block.start_time <= currentTime) continue;
        return { 
          ...block, 
          dayOffset,
          dayName: DAYS_OF_WEEK[block.day_of_week] 
        };
      }
    }
    return null;
  }, [scheduleBlocks]);

  const handleQuickSchedule = (hours: number) => {
    const now = new Date();
    const startTime = getCurrentTimeString();
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
    
    // Use the existing save function and manually set status to 'online'
    handleSaveBlock(newBlock); 
    setCurrentStatus('online');
    toast({
        title: "Go Time!",
        description: `You are now online for the next ${hours} hours.`,
    });
  };

  const handleManualToggle = async () => {
    const newStatus = currentStatus === 'online' ? 'offline' : 'online';
    setCurrentStatus(newStatus);
    
    // Dispatch event to sync with CRAVE NOW button in main dashboard
    window.dispatchEvent(new CustomEvent('driverStatusChange', { 
      detail: { status: newStatus } 
    }));
    
    // Update driver profile status in database
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('driver_profiles').update({
          status: newStatus,
          is_available: newStatus === 'online',
          last_location_update: new Date().toISOString()
        }).eq('user_id', user.id);
        
        // Update driver session
        await supabase.from('driver_sessions').upsert({
          driver_id: user.id,
          is_online: newStatus === 'online',
          last_activity: new Date().toISOString(),
          session_data: newStatus === 'online' ? { online_since: new Date().toISOString() } : {}
        }, { onConflict: 'driver_id' });
      }
    } catch (error) {
      console.error('Error updating driver status:', error);
    }
    
    if (newStatus === 'online') {
        toast({ title: "You Are Online", description: "The platform now sees you as available.", variant: "default" });
    } else {
        toast({ title: "You Are Offline", description: "You are no longer receiving requests.", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <ToastContainer />
        <div className="animate-pulse space-y-5 max-w-md w-full">
          <div className="h-24 bg-gray-200 rounded-2xl"></div>
          <div className="h-48 bg-gray-200 rounded-2xl"></div>
          <div className="h-48 bg-gray-200 rounded-2xl"></div>
          <div className="h-48 bg-gray-200 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  const nextBlock = getNextScheduledBlock();
  const weeklyHours = calculateWeeklyHours(scheduleBlocks);
  const progressPercentage = todayHours.scheduled > 0 ? (todayHours.worked / todayHours.scheduled) * 100 : 0;
  
  // CHANGED: Blue/Indigo (scheduled) -> Orange/Amber (scheduled)
  const statusColor = currentStatus === 'online' ? 'from-green-500 to-teal-500 shadow-green-400/50' : 
                      currentStatus === 'scheduled' ? 'from-orange-600 to-amber-700 shadow-orange-500/50' :
                      'from-gray-700 to-orange-600 shadow-orange-500/50';

  return (
    <div className="min-h-screen bg-gray-100 font-[Inter] pb-16">
      <ToastContainer />
      <div className="max-w-md mx-auto p-4 space-y-5">
        
        {/* Header */}
        <header className="py-2 flex justify-between items-center">
            <h1 className="text-3xl font-extrabold text-gray-900">Availability Hub</h1>
            <Button variant="ghost" size="icon" className="text-gray-600" onClick={() => {}}>
                <Menu className="h-6 w-6" />
            </Button>
        </header>

        {/* Current Status Card */}
        <Card className={`
            bg-gradient-to-br p-6 transition-all duration-300 transform hover:scale-[1.01]
            ${statusColor}
            text-white shadow-2xl
        `}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {currentStatus === 'online' && <Power className="h-6 w-6 text-teal-300" />}
                {/* CHANGED: Blue -> Orange */}
                {currentStatus === 'scheduled' && <CheckCircle className="h-6 w-6 text-orange-300" />}
                {currentStatus === 'offline' && <Clock className="h-6 w-6 opacity-75" />}

                <span className="text-2xl font-bold">
                  {currentStatus === 'online' ? 'ONLINE' : currentStatus === 'scheduled' ? 'SCHEDULED' : 'OFFLINE'}
                </span>
              </div>
              <Badge variant="secondary" className={`text-xs uppercase font-extrabold px-3 py-1 rounded-lg ${currentStatus === 'online' ? 'bg-white/30 text-white' : currentStatus === 'scheduled' ? 'bg-white/30 text-white' : 'bg-white/30 text-white'}`}>
                {currentStatus === 'online' ? 'Accepting Trips' : 'Standby'}
              </Badge>
            </div>
            
            {nextBlock ? (
                <div className="text-white text-sm opacity-90 flex items-center gap-1">
                    <CircleDot className='h-4 w-4' />
                    Next Shift: <span className="font-semibold">{nextBlock.dayName}</span> at {formatTime(nextBlock.start_time)}
                    {nextBlock.dayOffset === 0 && ' (Today)'}
                </div>
            ) : (
                <div className="text-sm text-gray-300">
                    No active recurring schedule.
                </div>
            )}
          </div>
        </Card>

        {/* Quick Schedule Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-lg font-extrabold">
              <div className='flex items-center gap-2'>
                {/* CHANGED: Blue -> Orange */}
                <Play className="h-5 w-5 text-orange-600" />
                Quick Shift
              </div>
              <Button 
                variant={currentStatus === 'online' ? 'destructive' : 'default'}
                size="sm"
                className="shadow-lg h-9"
                onClick={handleManualToggle}
              >
                <Power className="h-4 w-4 mr-1" />
                {currentStatus === 'online' ? 'Go Offline' : 'Go Online'}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-4">
              {[2, 4, 8].map(hours => (
                <Button 
                  key={hours}
                  variant="outline" 
                  // CHANGED: Blue -> Orange (Hover colors)
                  className="h-20 flex flex-col gap-1 border-2 border-dashed border-gray-200 hover:bg-orange-50 hover:border-orange-500 transition-all transform hover:scale-[1.05] active:scale-[0.95]"
                  onClick={() => handleQuickSchedule(hours)}
                >
                  {/* CHANGED: Blue -> Orange */}
                  <span className="font-extrabold text-2xl text-orange-600">{hours}h</span>
                  <span className="text-xs text-gray-500 font-medium">Start Now</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Today's Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-lg font-extrabold">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-green-600" />
                Today's Goal Progress
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-800 rounded-lg">
                {todayHours.worked.toFixed(1)}h / {todayHours.scheduled.toFixed(1)}h
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="bg-green-500 h-2.5 rounded-full transition-all duration-500 shadow-md"
                  style={{ width: `${Math.min(100, progressPercentage)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 font-medium">
                <span>{todayHours.scheduled > 0 ? 'Goal: ' + todayHours.scheduled.toFixed(1) + ' hours' : 'No schedule today'}</span>
                <span>
                  {todayHours.scheduled > todayHours.worked 
                    ? (todayHours.scheduled - todayHours.worked).toFixed(1) + 'h remaining' 
                    : <span className="text-green-600 font-bold">Goal met!</span>}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Schedule & Editing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-lg font-extrabold">
              <div className="flex items-center gap-2">
                {/* CHANGED: Purple -> Red */}
                <Clock className="h-5 w-5 text-red-600" />
                Weekly Schedule
              </div>
              <div className='flex gap-2'>
                <Button 
                    variant="default" 
                    size="sm" 
                    onClick={() => { setEditingBlock(null); setIsModalOpen(true); }} 
                    // CHANGED: Purple -> Red
                    className="bg-red-600 hover:bg-red-700 shadow-md"
                >
                    <Plus className="h-4 w-4 mr-1" /> Add Shift
                </Button>
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setIsEditing(!isEditing)}
                    // CHANGED: Purple -> Red
                    className="text-red-600 border-red-300 hover:bg-red-50"
                >
                    {isEditing ? <X className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 mb-4 border-b pb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Scheduled Hours</span>
                {/* CHANGED: Purple -> Red */}
                <span className="font-extrabold text-red-700">{weeklyHours.toFixed(1)} hours</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Recurring Blocks</span>
                <span className="font-medium text-gray-800">{scheduleBlocks.filter(b => b.is_recurring).length} blocks</span>
              </div>
            </div>

            <div className="space-y-3">
              {DAYS_OF_WEEK.map((day, index) => {
                const dayBlocks = scheduleBlocks.filter(
                  block => block.day_of_week === index
                ).sort((a, b) => a.start_time.localeCompare(b.start_time));
                
                return (
                  <div key={day} className={`flex flex-col p-3 rounded-xl border-l-4 shadow-sm transition-all 
                    ${
                        // CHANGED: Blue -> Orange (Current Day Highlight)
                        new Date().getDay() === index ? 'border-l-orange-500 bg-orange-50' : 'border-l-gray-200 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                        <div className={`font-extrabold text-sm ${new Date().getDay() === index ? 'text-orange-700' : 'text-gray-800'}`}>{day}</div>
                    </div>
                    
                    <div className="mt-2 space-y-1">
                        {dayBlocks.length > 0 ? (
                            dayBlocks.map((block) => (
                                <div key={block.id} className="flex justify-between items-center text-xs">
                                    <div className={`
                                        px-2 py-1 rounded-lg flex gap-2 items-center font-medium
                                        ${
                                            // CHANGED: Blue -> Orange (Recurring) and Purple -> Red (One-Time)
                                            block.is_recurring ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'
                                        }
                                    `}>
                                        <Clock className='h-3 w-3'/>
                                        <span>{formatTime(block.start_time)} - {formatTime(block.end_time)}</span>
                                        {!block.is_recurring && <Badge className="bg-white text-gray-600 font-bold border-gray-300">ONE-TIME</Badge>}
                                    </div>
                                    {isEditing && (
                                        <div className='flex gap-1'>
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                // CHANGED: Purple -> Red
                                                className="h-7 w-7 text-red-500 hover:bg-red-100 rounded-lg"
                                                onClick={() => { setEditingBlock(block); setIsModalOpen(true); }}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="h-7 w-7 text-orange-500 hover:bg-orange-100 rounded-lg"
                                                onClick={() => handleDeleteBlock(block.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <span className="text-xs text-gray-400 font-light">No shifts scheduled</span>
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
            <CardTitle className="flex items-center gap-2 text-lg font-extrabold">
              <Settings className="h-5 w-5 text-yellow-600" />
              Availability Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start justify-between border-b pb-4 border-gray-100">
              <div>
                <p className="font-medium text-base">Auto Go Online</p>
                <p className="text-xs text-gray-500 mt-0.5">Automatically activate during scheduled times</p>
              </div>
              <Switch 
                checked={availabilitySettings.auto_online}
                onCheckedChange={(checked) => 
                  setAvailabilitySettings(prev => ({ ...prev, auto_online: checked }))
                }
              />
            </div>

            <div className="flex items-start justify-between border-b pb-4 border-gray-100">
              <div>
                <p className="font-medium text-base">Break Reminders</p>
                <p className="text-xs text-gray-500 mt-0.5">Get notified to take breaks after long shifts</p>
              </div>
              <Switch 
                checked={availabilitySettings.break_reminders}
                onCheckedChange={(checked) => 
                  setAvailabilitySettings(prev => ({ ...prev, break_reminders: checked }))
                }
              />
            </div>

            <div className="pt-2">
              {/* CHANGED: Blue -> Orange */}
              <p className="font-medium text-base mb-3">Maximum Daily Hours: <span className="font-extrabold text-orange-600">{availabilitySettings.max_hours_per_day}h</span></p>
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  size="sm"
                  // CHANGED: Blue -> Orange
                  className='text-xl border-orange-300 text-orange-600 hover:bg-orange-50'
                  onClick={() => setAvailabilitySettings(prev => ({ 
                    ...prev, 
                    max_hours_per_day: Math.max(4, prev.max_hours_per_day - 1)
                  }))}
                >
                  -
                </Button>
                <div className="w-full h-2 bg-gray-200 rounded-full relative overflow-hidden">
                    <div 
                        // CHANGED: Blue -> Orange
                        className="h-2 bg-orange-500 rounded-full transition-all duration-300" 
                        style={{ width: `${((availabilitySettings.max_hours_per_day - 4) / 10) * 100}%` }}
                    ></div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  // CHANGED: Blue -> Orange
                  className='text-xl border-orange-300 text-orange-600 hover:bg-orange-50'
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
            <CardTitle className="flex items-center gap-2 text-lg font-extrabold">
              {/* CHANGED: Teal -> Orange */}
              <AlertCircle className="h-5 w-5 text-orange-600" />
              Preferred Work Zones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {availabilitySettings.preferred_zones.map((zone, index) => (
                <Badge 
                    key={index} 
                    variant="secondary" 
                    // CHANGED: Teal -> Orange
                    className="text-sm bg-orange-100 text-orange-800 rounded-lg py-1.5 px-3 shadow-sm"
                >
                  {zone}
                </Badge>
              ))}
              <Button 
                variant="outline" 
                size="sm" 
                // CHANGED: Teal -> Orange
                className="h-8 px-3 border-dashed text-gray-500 hover:border-orange-500 hover:text-orange-600 rounded-lg"
                onClick={() => {}}
              >
                <Plus className="h-3 w-3 mr-1" /> Add Zone
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              We prioritize offers in these areas when you are active.
            </p>
          </CardContent>
        </Card>

      </div>

      {isModalOpen && (
          <ScheduleBlockForm 
              block={editingBlock}
              onClose={() => { setIsModalOpen(false); setEditingBlock(null); }}
              onSave={handleSaveBlock}
          />
      )}
    </div>
  );
};
