// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Calendar,
  Clock,
  Plus,
  ChevronRight,
  Power,
  Zap,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';

interface ScheduleBlock {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
  is_recurring: boolean;
  created_at: string;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAYS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function ScheduleSection() {
  const [scheduleBlocks, setScheduleBlocks] = useState<ScheduleBlock[]>([]);
  const [currentStatus, setCurrentStatus] = useState<'offline' | 'online'>('offline');
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBlock, setNewBlock] = useState({
    start_time: '09:00',
    end_time: '17:00'
  });

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
      toast.success('You are now online');
    } catch (error) {
      console.error('Error going online:', error);
      toast.error('Failed to go online');
    }
  };

  const handleGoOffline = async () => {
    try {
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
    }
  };

  const handleQuickStart = async (hours: number) => {
    const now = new Date();
    const endTime = new Date(now.getTime() + hours * 60 * 60 * 1000);
    
    const block: ScheduleBlock = {
      id: Date.now().toString(),
      day_of_week: now.getDay(),
      start_time: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
      end_time: `${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`,
      is_active: true,
      is_recurring: false,
      created_at: new Date().toISOString()
    };

    await handleSaveBlock(block);
    await handleGoOnline();
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
      created_at: new Date().toISOString()
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

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="max-w-2xl mx-auto">
        
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b shadow-sm safe-area-top">
          <div className="p-4">
            <h1 className="text-3xl font-bold text-slate-900 text-right">Schedule</h1>
            <p className="text-sm text-slate-600 text-right">Manage when you're available</p>
          </div>
        </div>

        {/* Online Status Toggle */}
        <div className="px-4 py-6 bg-white border-b border-slate-100">
          <button
            onClick={currentStatus === 'online' ? handleGoOffline : handleGoOnline}
            className={`w-full py-4 rounded-xl font-semibold text-lg transition-all shadow-lg ${
              currentStatus === 'online'
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white'
            }`}
          >
            {currentStatus === 'online' ? (
              <div className="flex items-center justify-center gap-2">
                <Power className="h-5 w-5" />
                Stop Driving
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <Zap className="h-5 w-5" />
                Start Driving Now
              </div>
            )}
          </button>

          {currentStatus === 'online' && (
            <div className="mt-3 flex items-center justify-center gap-2 text-green-700 bg-green-50 py-2 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium">You're online and accepting orders</span>
            </div>
          )}
        </div>

        {/* Quick Start Options */}
        <div className="px-4 py-6 bg-white">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Start</h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { hours: 2, label: '2 Hours' },
              { hours: 4, label: '4 Hours' },
              { hours: 8, label: '8 Hours' }
            ].map(({ hours, label }) => (
              <button
                key={hours}
                onClick={() => handleQuickStart(hours)}
                className="bg-white border-2 border-slate-200 hover:border-orange-500 hover:bg-orange-50 rounded-xl p-4 transition-all group"
              >
                <div className="text-3xl font-bold text-slate-900 mb-1">{hours}</div>
                <div className="text-xs text-slate-600 font-medium">hours</div>
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-3 text-center">
            Start driving immediately for the selected duration
          </p>
        </div>

        {/* Weekly Calendar View */}
        <div className="px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">This Week</h2>
            <button
              onClick={() => setShowAddModal(true)}
              className="text-orange-600 hover:text-orange-700 font-medium text-sm flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              Add Shift
            </button>
          </div>

          <div className="space-y-2">
            {DAYS_FULL.map((day, index) => {
              const dayBlocks = scheduleBlocks.filter(b => b.day_of_week === index && b.is_active);
              const isToday = index === todayIndex;

              return (
                <button
                  key={index}
                  onClick={() => setSelectedDay(index)}
                  className={`w-full bg-white border rounded-xl p-4 transition-all ${
                    isToday 
                      ? 'border-orange-500 bg-orange-50/50' 
                      : 'border-slate-200 hover:border-orange-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${
                        isToday 
                          ? 'bg-orange-600 text-white' 
                          : dayBlocks.length > 0
                            ? 'bg-green-100 text-green-700'
                            : 'bg-slate-100 text-slate-600'
                      }`}>
                        {DAYS[index]}
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-slate-900">{day}</div>
                        <div className="text-sm text-slate-600">
                          {dayBlocks.length > 0 ? (
                            `${dayBlocks.length} shift${dayBlocks.length > 1 ? 's' : ''}`
                          ) : (
                            'Not scheduled'
                          )}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-400" />
                  </div>

                  {dayBlocks.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                      {dayBlocks.map((block) => (
                        <div
                          key={block.id}
                          className="flex items-center justify-between bg-slate-50 rounded-lg p-2"
                        >
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-slate-500" />
                            <span className="text-sm font-medium text-slate-700">
                              {formatTime(block.start_time)} - {formatTime(block.end_time)}
                            </span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteBlock(block.id);
                            }}
                            className="text-red-600 hover:text-red-700 p-1"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </button>
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
              <h2 className="text-xl font-bold text-slate-900">
                Add Shift for {DAYS_FULL[selectedDay]}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedDay(null);
                }}
                className="text-slate-500 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Start Time</label>
                <input
                  type="time"
                  value={newBlock.start_time}
                  onChange={(e) => setNewBlock({ ...newBlock, start_time: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">End Time</label>
                <input
                  type="time"
                  value={newBlock.end_time}
                  onChange={(e) => setNewBlock({ ...newBlock, end_time: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <button
              onClick={handleAddSchedule}
              disabled={loading}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-4 rounded-xl transition-all disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Add Shift'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

