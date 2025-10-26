import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  Plus, 
  ChevronRight, 
  MapPin,
  DollarSign,
  Target,
  TrendingUp,
  Edit3,
  Trash2,
  Check,
  X,
  Zap,
  Star,
  AlertCircle,
  Settings,
  MoreHorizontal,
  Play,
  Pause,
  BarChart3,
  Users,
  Timer,
  Bell,
  Filter,
  Search,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ScheduleBlock {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  date: string;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  earnings: number;
  deliveries: number;
  rating: number;
  notes?: string;
}

interface PeakHours {
  day: string;
  hours: string[];
  multiplier: number;
  color: string;
}

const DoorDashStyleScheduleDashboard: React.FC = () => {
  const [scheduleBlocks, setScheduleBlocks] = useState<ScheduleBlock[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showQuickStart, setShowQuickStart] = useState(false);
  const [activeTab, setActiveTab] = useState<'schedule' | 'availability' | 'earnings'>('schedule');
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  
  // Pause feature state
  const [isPaused, setIsPaused] = useState(false);
  const [pauseTimeRemaining, setPauseTimeRemaining] = useState(0);
  const [pauseStartTime, setPauseStartTime] = useState<Date | null>(null);

  // Sample data
  const peakHours: PeakHours[] = [
    { day: 'Monday', hours: ['11:00 AM - 2:00 PM', '5:00 PM - 9:00 PM'], multiplier: 1.5, color: 'bg-orange-500' },
    { day: 'Tuesday', hours: ['11:00 AM - 2:00 PM', '5:00 PM - 9:00 PM'], multiplier: 1.5, color: 'bg-orange-500' },
    { day: 'Wednesday', hours: ['11:00 AM - 2:00 PM', '5:00 PM - 9:00 PM'], multiplier: 1.5, color: 'bg-orange-500' },
    { day: 'Thursday', hours: ['11:00 AM - 2:00 PM', '5:00 PM - 9:00 PM'], multiplier: 1.5, color: 'bg-orange-500' },
    { day: 'Friday', hours: ['11:00 AM - 2:00 PM', '5:00 PM - 10:00 PM'], multiplier: 2.0, color: 'bg-red-500' },
    { day: 'Saturday', hours: ['10:00 AM - 2:00 PM', '5:00 PM - 10:00 PM'], multiplier: 2.0, color: 'bg-red-500' },
    { day: 'Sunday', hours: ['10:00 AM - 2:00 PM', '5:00 PM - 9:00 PM'], multiplier: 1.8, color: 'bg-yellow-500' }
  ];

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayIndex = new Date().getDay();

  useEffect(() => {
    // Simulate loading existing schedule
    setScheduleBlocks([
      {
        id: '1',
        day: 'Friday',
        startTime: '5:00 PM',
        endTime: '9:00 PM',
        date: '2024-01-26',
        status: 'scheduled',
        earnings: 0,
        deliveries: 0,
        rating: 0
      },
      {
        id: '2',
        day: 'Saturday',
        startTime: '10:00 AM',
        endTime: '2:00 PM',
        date: '2024-01-27',
        status: 'scheduled',
        earnings: 0,
        deliveries: 0,
        rating: 0
      }
    ]);
  }, []);

  // Pause timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPaused && pauseStartTime) {
      interval = setInterval(() => {
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - pauseStartTime.getTime()) / 1000);
        setPauseTimeRemaining(Math.max(0, 1800 - elapsed)); // 30 minutes = 1800 seconds
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPaused, pauseStartTime]);

  const handlePause = () => {
    setIsPaused(true);
    setPauseStartTime(new Date());
    setPauseTimeRemaining(1800); // 30 minutes
  };

  const handleResume = () => {
    setIsPaused(false);
    setPauseStartTime(null);
    setPauseTimeRemaining(0);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled': return <Clock className="h-4 w-4" />;
      case 'active': return <Play className="h-4 w-4" />;
      case 'completed': return <Check className="h-4 w-4" />;
      case 'cancelled': return <X className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  // DoorDash Pause Interface - Exact replica of the image
  const PauseInterface = () => (
    <div className="fixed inset-0 bg-white z-50">
      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-2 text-sm">
        <div className="flex items-center space-x-1">
          <span>10:15</span>
          <div className="w-1 h-1 bg-black rounded-full"></div>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-4 h-2 bg-black rounded-sm"></div>
          <span>5G</span>
          <div className="w-6 h-3 border border-black rounded-sm flex items-center justify-end pr-1">
            <div className="w-4 h-2 bg-black rounded-sm"></div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <Settings className="h-6 w-6 text-gray-600" />
        <h1 className="text-xl font-bold text-gray-900">Crave Paused</h1>
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-xs">+</span>
          </div>
          <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-xs">?</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Circular Timer */}
        <div className="relative w-48 h-48 mb-8">
          {/* Progress Ring */}
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="#e5e7eb"
              strokeWidth="8"
              fill="none"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="#ef4444"
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - pauseTimeRemaining / 1800)}`}
              className="transition-all duration-1000"
            />
          </svg>
          
          {/* Time Display */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900">
                {Math.floor(pauseTimeRemaining / 60)}:{(pauseTimeRemaining % 60).toString().padStart(2, '0')}
              </div>
            </div>
          </div>
        </div>

        {/* Information Text */}
        <div className="text-center mb-8 max-w-sm">
          <p className="text-lg font-semibold text-gray-900 mb-2">
            You won't get offers while you're paused
          </p>
          <p className="text-sm text-gray-600">
            If you pause for more than 35 minutes, your Crave will end.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="w-full max-w-sm space-y-4">
          <button 
            onClick={handleResume}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-4 px-6 rounded-lg transition-colors"
          >
            Resume Crave
          </button>
          <button 
            onClick={() => setIsPaused(false)}
            className="w-full text-gray-900 font-semibold py-2"
          >
            End Crave
          </button>
        </div>
      </div>

      {/* Home Indicator */}
      <div className="flex justify-center pb-2">
        <div className="w-32 h-1 bg-black rounded-full"></div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Pause Interface - Renders when paused */}
      {isPaused && <PauseInterface />}
      
      <div className="max-w-4xl mx-auto">
        {/* DoorDash-style Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 safe-area-top">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Schedule</h1>
              <p className="text-sm text-gray-600">Manage your delivery shifts</p>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" className="border-gray-300">
                <Filter className="h-4 w-4 mr-1" />
                Filter
              </Button>
              <Button 
                onClick={handlePause}
                size="sm" 
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                <Pause className="h-4 w-4 mr-1" />
                Pause
              </Button>
              <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white">
                <Plus className="h-4 w-4 mr-1" />
                Add Shift
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Stats - DoorDash Style */}
        <div className="p-6">
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card className="bg-white border-gray-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">2</div>
                <div className="text-sm text-gray-600">Scheduled</div>
              </CardContent>
            </Card>
            <Card className="bg-white border-gray-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">$127</div>
                <div className="text-sm text-gray-600">This Week</div>
              </CardContent>
            </Card>
            <Card className="bg-white border-gray-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">4.8</div>
                <div className="text-sm text-gray-600">Rating</div>
              </CardContent>
            </Card>
          </div>

          {/* DoorDash-style Tabs */}
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-white border border-gray-200">
              <TabsTrigger value="schedule" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white">Schedule</TabsTrigger>
              <TabsTrigger value="availability" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white">Availability</TabsTrigger>
              <TabsTrigger value="earnings" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white">Earnings</TabsTrigger>
            </TabsList>

            <TabsContent value="schedule" className="space-y-4 mt-6">
              {/* Upcoming Shifts - DoorDash Style */}
              <Card className="bg-white border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2 text-lg">
                    <Calendar className="h-5 w-5 text-orange-600" />
                    <span>Upcoming Shifts</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {scheduleBlocks.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 mb-4">No shifts scheduled</p>
                      <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                        <Plus className="h-4 w-4 mr-2" />
                        Schedule Your First Shift
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {scheduleBlocks.map((block) => (
                        <div key={block.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-orange-100 rounded-lg">
                              <Calendar className="h-5 w-5 text-orange-600" />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">{block.day}</div>
                              <div className="text-sm text-gray-600">{block.startTime} - {block.endTime}</div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className={getStatusColor(block.status)}>
                              {getStatusIcon(block.status)}
                              <span className="ml-1 capitalize">{block.status}</span>
                            </Badge>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Peak Hours - DoorDash Style */}
              <Card className="bg-white border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2 text-lg">
                    <TrendingUp className="h-5 w-5 text-orange-600" />
                    <span>Peak Hours</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {peakHours.map((day, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${day.color}`}></div>
                          <div>
                            <div className="font-medium text-gray-900">{day.day}</div>
                            <div className="text-sm text-gray-600">{day.hours.join(', ')}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">{day.multiplier}x</div>
                          <div className="text-xs text-gray-500">Multiplier</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="availability" className="space-y-4 mt-6">
              <Card className="bg-white border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg">Set Your Availability</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">Set your weekly availability</p>
                    <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                      <Settings className="h-4 w-4 mr-2" />
                      Manage Availability
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="earnings" className="space-y-4 mt-6">
              <Card className="bg-white border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg">Earnings Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">Track your earnings from scheduled shifts</p>
                    <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      View Detailed Earnings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default DoorDashStyleScheduleDashboard;