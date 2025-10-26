import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  Plus, 
  ChevronRight, 
  Power, 
  Zap, 
  Trash2,
  Edit3,
  Check,
  X,
  Play,
  Pause,
  MapPin,
  TrendingUp,
  DollarSign,
  Target,
  AlertCircle,
  Settings,
  MoreHorizontal
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ScheduleBlock {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
  is_recurring: boolean;
  created_at: string;
  location?: string;
  earnings_goal?: number;
}

interface QuickShift {
  id: string;
  name: string;
  duration: number;
  icon: React.ReactNode;
  color: string;
  description: string;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAYS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const QUICK_SHIFTS: QuickShift[] = [
  {
    id: 'lunch',
    name: 'Lunch Rush',
    duration: 3,
    icon: <Zap className="h-5 w-5" />,
    color: 'bg-orange-500',
    description: 'Peak lunch hours'
  },
  {
    id: 'dinner',
    name: 'Dinner Rush',
    duration: 4,
    icon: <Target className="h-5 w-5" />,
    color: 'bg-red-500',
    description: 'Peak dinner hours'
  },
  {
    id: 'full',
    name: 'Full Day',
    duration: 8,
    icon: <Calendar className="h-5 w-5" />,
    color: 'bg-blue-500',
    description: 'Complete workday'
  },
  {
    id: 'flex',
    name: 'Flexible',
    duration: 2,
    icon: <Clock className="h-5 w-5" />,
    color: 'bg-green-500',
    description: 'Short flexible shift'
  }
];

const ModernScheduleDashboard: React.FC = () => {
  const [scheduleBlocks, setScheduleBlocks] = useState<ScheduleBlock[]>([]);
  const [currentStatus, setCurrentStatus] = useState<'offline' | 'online'>('offline');
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showQuickStart, setShowQuickStart] = useState(false);
  const [newBlock, setNewBlock] = useState({
    start_time: '09:00',
    end_time: '17:00',
    location: '',
    earnings_goal: 0
  });
  const [selectedQuickShift, setSelectedQuickShift] = useState<string | null>(null);

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('driver_schedules')
        .select('*')
        .eq('driver_id', user.id)
        .order('day_of_week')
        .order('start_time');

      if (data) {
        setScheduleBlocks(data);
      }
    } catch (error) {
      console.error('Error fetching schedule:', error);
    }
  };

  const handleGoOnline = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('driver_profiles').update({
        status: 'online',
        is_available: true,
        last_location_update: new Date().toISOString()
      }).eq('user_id', user.id);

      await supabase.from('driver_sessions').upsert({
        driver_id: user.id,
        is_online: true,
        last_activity: new Date().toISOString(),
        session_data: { online_since: new Date().toISOString() }
      }, { onConflict: 'driver_id' });

      setCurrentStatus('online');
      toast.success('You are now online and ready to drive!');
    } catch (error) {
      console.error('Error going online:', error);
      toast.error('Failed to go online');
    } finally {
      setLoading(false);
    }
  };

  const handleGoOffline = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('driver_profiles').update({
        status: 'offline',
        is_available: false
      }).eq('user_id', user.id);

      await supabase.from('driver_sessions').upsert({
        driver_id: user.id,
        is_online: false,
        last_activity: new Date().toISOString()
      }, { onConflict: 'driver_id' });

      setCurrentStatus('offline');
      toast.success('You are now offline');
    } catch (error) {
      console.error('Error going offline:', error);
      toast.error('Failed to go offline');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickStart = async (shift: QuickShift) => {
    try {
      setLoading(true);
      const now = new Date();
      const endTime = new Date(now.getTime() + shift.duration * 60 * 60 * 1000);
      
      const block: ScheduleBlock = {
        id: Date.now().toString(),
        day_of_week: now.getDay(),
        start_time: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
        end_time: `${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`,
        is_active: true,
        is_recurring: false,
        created_at: new Date().toISOString(),
        location: 'Current Location',
        earnings_goal: shift.duration * 15 // $15 per hour goal
      };

      await handleSaveBlock(block);
      await handleGoOnline();
      setShowQuickStart(false);
      toast.success(`${shift.name} shift started!`);
    } catch (error) {
      console.error('Error starting quick shift:', error);
      toast.error('Failed to start shift');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBlock = async (block: ScheduleBlock) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('driver_schedules')
        .upsert({
          ...block,
          driver_id: user.id
        });

      if (error) throw error;

      await fetchSchedule();
      toast.success('Schedule updated');
      setShowAddModal(false);
    } catch (error) {
      console.error('Error saving schedule:', error);
      toast.error('Failed to save schedule');
    }
  };

  const handleDeleteBlock = async (id: string) => {
    try {
      const { error } = await supabase
        .from('driver_schedules')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchSchedule();
      toast.success('Schedule deleted');
    } catch (error) {
      console.error('Error deleting schedule:', error);
      toast.error('Failed to delete schedule');
    }
  };

  const handleAddSchedule = () => {
    if (selectedDay === null) return;

    const block: ScheduleBlock = {
      id: Date.now().toString(),
      day_of_week: selectedDay,
      start_time: newBlock.start_time,
      end_time: newBlock.end_time,
      is_active: true,
      is_recurring: true,
      created_at: new Date().toISOString(),
      location: newBlock.location,
      earnings_goal: newBlock.earnings_goal
    };

    handleSaveBlock(block);
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const todayIndex = new Date().getDay();
  const totalScheduledHours = scheduleBlocks.reduce((total, block) => {
    const start = new Date(`2000-01-01T${block.start_time}`);
    const end = new Date(`2000-01-01T${block.end_time}`);
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return total + hours;
  }, 0);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 safe-area-top">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Schedule</h1>
            <p className="text-sm text-gray-600">Plan your driving shifts</p>
          </div>
        </div>

        {/* Status Card */}
        <div className="p-6">
          <Card className={`${currentStatus === 'online' ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${currentStatus === 'online' ? 'bg-green-100' : 'bg-gray-100'}`}>
                    {currentStatus === 'online' ? (
                      <Play className="h-6 w-6 text-green-600" />
                    ) : (
                      <Pause className="h-6 w-6 text-gray-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {currentStatus === 'online' ? 'Currently Online' : 'Currently Offline'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {currentStatus === 'online' ? 'Accepting delivery requests' : 'Not accepting requests'}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={currentStatus === 'online'}
                  onCheckedChange={currentStatus === 'online' ? handleGoOffline : handleGoOnline}
                  disabled={loading}
                />
              </div>
              
              {currentStatus === 'online' && (
                <div className="flex items-center space-x-2 text-green-700 bg-green-100 py-2 px-3 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm font-medium">Active and ready for orders</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Start Section */}
        <div className="px-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Quick Start</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowQuickStart(!showQuickStart)}
            >
              {showQuickStart ? 'Hide' : 'Show'} Options
            </Button>
          </div>
          
          {showQuickStart && (
            <div className="grid grid-cols-2 gap-3">
              {QUICK_SHIFTS.map((shift) => (
                <Card
                  key={shift.id}
                  className="cursor-pointer hover:shadow-md transition-all"
                  onClick={() => handleQuickStart(shift)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${shift.color} text-white`}>
                        {shift.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{shift.name}</h3>
                        <p className="text-xs text-gray-600">{shift.description}</p>
                        <p className="text-sm font-medium text-gray-700">{shift.duration}h shift</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Stats Overview */}
        <div className="px-6 mb-6">
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">{scheduleBlocks.length}</div>
                <div className="text-xs text-gray-600">Scheduled Shifts</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">{totalScheduledHours.toFixed(1)}h</div>
                <div className="text-xs text-gray-600">Total Hours</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">${(totalScheduledHours * 15).toFixed(0)}</div>
                <div className="text-xs text-gray-600">Est. Earnings</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Weekly Schedule */}
        <div className="px-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">This Week</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddModal(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Shift
            </Button>
          </div>

          <div className="space-y-3">
            {DAYS_FULL.map((day, index) => {
              const dayBlocks = scheduleBlocks.filter(b => b.day_of_week === index && b.is_active);
              const isToday = index === todayIndex;

              return (
                <Card
                  key={index}
                  className={`cursor-pointer transition-all ${
                    isToday ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedDay(index)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                          isToday 
                            ? 'bg-orange-600 text-white' 
                            : dayBlocks.length > 0
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-600'
                        }`}>
                          {DAYS[index]}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{day}</div>
                          <div className="text-sm text-gray-600">
                            {dayBlocks.length > 0 ? (
                              `${dayBlocks.length} shift${dayBlocks.length > 1 ? 's' : ''}`
                            ) : (
                              'No shifts scheduled'
                            )}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>

                    {dayBlocks.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                        {dayBlocks.map((block) => (
                          <div
                            key={block.id}
                            className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-100"
                          >
                            <div className="flex items-center space-x-3">
                              <Clock className="h-4 w-4 text-gray-500" />
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {formatTime(block.start_time)} - {formatTime(block.end_time)}
                                </div>
                                {block.location && (
                                  <div className="text-xs text-gray-500 flex items-center space-x-1">
                                    <MapPin className="h-3 w-3" />
                                    <span>{block.location}</span>
                                  </div>
                                )}
                                {block.earnings_goal && (
                                  <div className="text-xs text-green-600 flex items-center space-x-1">
                                    <DollarSign className="h-3 w-3" />
                                    <span>Goal: ${block.earnings_goal}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Handle edit
                                }}
                              >
                                <Edit3 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteBlock(block.id);
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* Add Schedule Modal */}
      {showAddModal && selectedDay !== null && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end">
          <div className="w-full bg-white rounded-t-3xl p-6 pb-8 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                Add Shift for {DAYS_FULL[selectedDay]}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedDay(null);
                }}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Start Time</label>
                  <input
                    type="time"
                    value={newBlock.start_time}
                    onChange={(e) => setNewBlock({ ...newBlock, start_time: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">End Time</label>
                  <input
                    type="time"
                    value={newBlock.end_time}
                    onChange={(e) => setNewBlock({ ...newBlock, end_time: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Location (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g., Downtown, Airport"
                  value={newBlock.location}
                  onChange={(e) => setNewBlock({ ...newBlock, location: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Earnings Goal (Optional)</label>
                <input
                  type="number"
                  placeholder="e.g., 150"
                  value={newBlock.earnings_goal}
                  onChange={(e) => setNewBlock({ ...newBlock, earnings_goal: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <Button
              onClick={handleAddSchedule}
              disabled={loading}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-4 rounded-xl transition-all disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Add Shift'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModernScheduleDashboard;
