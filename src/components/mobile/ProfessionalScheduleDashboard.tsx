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
  Brain,
  Activity,
  Thermometer,
  Wind,
  Cloud,
  Sun,
  Moon,
  Sparkles,
  Layers,
  Cpu,
  Database,
  TrendingDown,
  Maximize2,
  Minimize2,
  RotateCcw,
  RefreshCw,
  Eye,
  EyeOff,
  Filter,
  Search,
  Download,
  Upload,
  Share2,
  Bookmark,
  Award,
  Trophy,
  Crown,
  Gem,
  Flame,
  Lightning,
  Waves,
  Atom,
  Orbit,
  Satellite,
  Rocket,
  Zap as ZapIcon,
  Hexagon,
  Triangle,
  Circle,
  Square,
  Pentagon,
  Octagon
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
  shift_type?: string;
}

interface QuickShift {
  id: string;
  name: string;
  duration: number;
  icon: React.ReactNode;
  color: string;
  description: string;
  earnings: number;
}

interface WeeklyStats {
  totalShifts: number;
  totalHours: number;
  estimatedEarnings: number;
  peakHours: string;
}

interface AIRecommendation {
  id: string;
  type: 'optimal_time' | 'weather_alert' | 'demand_surge' | 'earnings_boost';
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  icon: React.ReactNode;
  color: string;
  action?: string;
}

interface MarketData {
  demand: number;
  supply: number;
  surgeMultiplier: number;
  weather: string;
  temperature: number;
  conditions: string;
}

interface HeatMapData {
  hour: number;
  day: number;
  intensity: number;
  earnings: number;
  demand: number;
}

interface AnalyticsData {
  performance: {
    efficiency: number;
    earnings: number;
    rating: number;
    trends: number[];
  };
  predictions: {
    nextWeek: number;
    confidence: number;
    factors: string[];
  };
  insights: {
    bestDay: string;
    bestTime: string;
    improvement: string;
  };
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
    description: '11:00 AM - 2:00 PM',
    earnings: 45
  },
  {
    id: 'dinner',
    name: 'Dinner Rush',
    duration: 4,
    icon: <Target className="h-5 w-5" />,
    color: 'bg-red-500',
    description: '5:00 PM - 9:00 PM',
    earnings: 60
  },
  {
    id: 'morning',
    name: 'Morning Shift',
    duration: 4,
    icon: <Clock className="h-5 w-5" />,
    color: 'bg-blue-500',
    description: '7:00 AM - 11:00 AM',
    earnings: 50
  },
  {
    id: 'late',
    name: 'Late Night',
    duration: 3,
    icon: <Star className="h-5 w-5" />,
    color: 'bg-purple-500',
    description: '9:00 PM - 12:00 AM',
    earnings: 55
  }
];

const ProfessionalScheduleDashboard: React.FC = () => {
  const [scheduleBlocks, setScheduleBlocks] = useState<ScheduleBlock[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showQuickStart, setShowQuickStart] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showHeatMap, setShowHeatMap] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState<AIRecommendation[]>([]);
  const [marketData, setMarketData] = useState<MarketData>({
    demand: 85,
    supply: 60,
    surgeMultiplier: 1.4,
    weather: 'sunny',
    temperature: 72,
    conditions: 'Clear skies, perfect for driving'
  });
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    performance: {
      efficiency: 87,
      earnings: 1250,
      rating: 4.8,
      trends: [1200, 1180, 1250, 1320, 1280, 1350, 1250]
    },
    predictions: {
      nextWeek: 1400,
      confidence: 92,
      factors: ['Weather forecast', 'Historical patterns', 'Market trends']
    },
    insights: {
      bestDay: 'Saturday',
      bestTime: '6:00 PM - 9:00 PM',
      improvement: 'Try scheduling more weekend evening shifts'
    }
  });
  const [newBlock, setNewBlock] = useState({
    start_time: '09:00',
    end_time: '17:00',
    location: '',
    earnings_goal: 0,
    shift_type: 'regular'
  });
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats>({
    totalShifts: 0,
    totalHours: 0,
    estimatedEarnings: 0,
    peakHours: '5:00 PM - 9:00 PM'
  });

  useEffect(() => {
    fetchSchedule();
    generateAIRecommendations();
    simulateMarketData();
  }, []);

  const generateAIRecommendations = () => {
    const recommendations: AIRecommendation[] = [
      {
        id: '1',
        type: 'optimal_time',
        title: 'AI Suggests: Peak Earnings Window',
        description: 'Saturday 6-9 PM shows 40% higher earnings potential',
        confidence: 94,
        impact: 'high',
        icon: <Brain className="h-5 w-5" />,
        color: 'bg-blue-500',
        action: 'Schedule Now'
      },
      {
        id: '2',
        type: 'weather_alert',
        title: 'Weather Optimization',
        description: 'Clear skies expected - perfect for high-demand areas',
        confidence: 88,
        impact: 'medium',
        icon: <Sun className="h-5 w-5" />,
        color: 'bg-yellow-500'
      },
      {
        id: '3',
        type: 'demand_surge',
        title: 'Surge Alert: Downtown',
        description: '2.3x multiplier active in downtown area',
        confidence: 91,
        impact: 'high',
        icon: <TrendingUp className="h-5 w-5" />,
        color: 'bg-red-500',
        action: 'Navigate There'
      },
      {
        id: '4',
        type: 'earnings_boost',
        title: 'Efficiency Tip',
        description: 'Your completion rate is 15% above average',
        confidence: 96,
        impact: 'medium',
        icon: <Trophy className="h-5 w-5" />,
        color: 'bg-green-500'
      }
    ];
    setAiRecommendations(recommendations);
  };

  const simulateMarketData = () => {
    // Simulate real-time market data updates
    const interval = setInterval(() => {
      setMarketData(prev => ({
        ...prev,
        demand: Math.max(20, Math.min(100, prev.demand + (Math.random() - 0.5) * 10)),
        surgeMultiplier: 1 + (Math.random() * 0.8),
        temperature: prev.temperature + (Math.random() - 0.5) * 2
      }));
    }, 5000);

    return () => clearInterval(interval);
  };

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
        calculateWeeklyStats(data);
      }
    } catch (error) {
      console.error('Error fetching schedule:', error);
    }
  };

  const calculateWeeklyStats = (blocks: ScheduleBlock[]) => {
    const totalShifts = blocks.length;
    const totalHours = blocks.reduce((total, block) => {
      const start = new Date(`2000-01-01T${block.start_time}`);
      const end = new Date(`2000-01-01T${block.end_time}`);
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      return total + hours;
    }, 0);
    const estimatedEarnings = totalHours * 18; // $18 per hour average

    setWeeklyStats({
      totalShifts,
      totalHours,
      estimatedEarnings,
      peakHours: '5:00 PM - 9:00 PM'
    });
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
        earnings_goal: shift.earnings,
        shift_type: shift.id
      };

      await handleSaveBlock(block);
      setShowQuickStart(false);
      toast.success(`${shift.name} shift scheduled!`);
    } catch (error) {
      console.error('Error starting quick shift:', error);
      toast.error('Failed to schedule shift');
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
      earnings_goal: newBlock.earnings_goal,
      shift_type: newBlock.shift_type
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
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-4xl mx-auto">
        {/* Ultra High-Tech Header */}
        <div className="bg-gradient-to-br from-orange-900 via-orange-800 to-red-900 text-white px-6 py-6 safe-area-top relative overflow-hidden">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-4 left-4 w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
            <div className="absolute top-8 right-8 w-1 h-1 bg-yellow-400 rounded-full animate-ping"></div>
            <div className="absolute bottom-4 left-8 w-1.5 h-1.5 bg-red-400 rounded-full animate-bounce"></div>
            <div className="absolute bottom-8 right-4 w-2 h-2 bg-orange-300 rounded-full animate-pulse"></div>
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent mb-2">
                  AI Schedule Command
                </h1>
                <p className="text-orange-200 text-sm">Neural network optimized scheduling</p>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAnalytics(!showAnalytics)}
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  <Database className="h-4 w-4 mr-1" />
                  Analytics
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowHeatMap(!showHeatMap)}
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  <Layers className="h-4 w-4 mr-1" />
                  Heat Map
                </Button>
              </div>
            </div>

            {/* Real-Time Market Pulse */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                <div className="flex items-center space-x-2">
                  <Activity className="h-4 w-4 text-orange-400" />
                  <div>
                    <div className="text-xs text-white/70">Demand</div>
                    <div className="text-lg font-bold text-orange-400">{marketData.demand}%</div>
                  </div>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-yellow-400" />
                  <div>
                    <div className="text-xs text-white/70">Surge</div>
                    <div className="text-lg font-bold text-yellow-400">{marketData.surgeMultiplier.toFixed(1)}x</div>
                  </div>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                <div className="flex items-center space-x-2">
                  <Thermometer className="h-4 w-4 text-red-400" />
                  <div>
                    <div className="text-xs text-white/70">Weather</div>
                    <div className="text-lg font-bold text-red-400">{marketData.temperature}°F</div>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Recommendations */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2 mb-2">
                <Brain className="h-5 w-5 text-orange-400" />
                <span className="text-sm font-semibold text-orange-300">AI Recommendations</span>
              </div>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {aiRecommendations.slice(0, 2).map((rec) => (
                  <div
                    key={rec.id}
                    className={`${rec.color} bg-opacity-20 backdrop-blur-sm rounded-lg p-3 border border-white/20`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {rec.icon}
                        <div>
                          <div className="text-sm font-semibold text-white">{rec.title}</div>
                          <div className="text-xs text-white/80">{rec.description}</div>
                        </div>
                      </div>
                      <div className="text-xs text-white/60">{rec.confidence}%</div>
                    </div>
                    {rec.action && (
                      <Button
                        size="sm"
                        className="mt-2 bg-white/20 hover:bg-white/30 text-white text-xs"
                      >
                        {rec.action}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Analytics Dashboard */}
        {showAnalytics && (
          <div className="p-6 space-y-4">
            <Card className="bg-gradient-to-br from-orange-900 to-red-900 text-white border-orange-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Cpu className="h-6 w-6 text-orange-400" />
                    <h2 className="text-lg font-semibold">Neural Analytics</h2>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-white/70">Efficiency</span>
                      <Trophy className="h-4 w-4 text-yellow-400" />
                    </div>
                    <div className="text-2xl font-bold text-white">{analyticsData.performance.efficiency}%</div>
                    <div className="text-xs text-orange-400">+12% this week</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-white/70">Rating</span>
                      <Star className="h-4 w-4 text-yellow-400" />
                    </div>
                    <div className="text-2xl font-bold text-white">{analyticsData.performance.rating}</div>
                    <div className="text-xs text-orange-400">Top 5% driver</div>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-white">Performance Trends</span>
                    <div className="flex space-x-1">
                      {analyticsData.performance.trends.map((value, index) => (
                        <div
                          key={index}
                          className="w-2 bg-gradient-to-t from-orange-400 to-red-400 rounded-sm"
                          style={{ height: `${(value / 1400) * 40}px` }}
                        ></div>
                      ))}
                    </div>
                  </div>
                  <div className="text-xs text-white/70">
                    Best day: {analyticsData.insights.bestDay} • Best time: {analyticsData.insights.bestTime}
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-white">AI Prediction</span>
                    <div className="text-xs text-orange-400">{analyticsData.predictions.confidence}% confidence</div>
                  </div>
                  <div className="text-xl font-bold text-orange-400">
                    ${analyticsData.predictions.nextWeek} next week
                  </div>
                  <div className="text-xs text-white/70 mt-1">
                    Based on: {analyticsData.predictions.factors.join(', ')}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Interactive Heat Map */}
        {showHeatMap && (
          <div className="p-6">
            <Card className="bg-gradient-to-br from-orange-900 to-red-900 text-white border-orange-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Layers className="h-6 w-6 text-orange-400" />
                    <h2 className="text-lg font-semibold">Demand Heat Map</h2>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-7 gap-1 mb-4">
                  {DAYS.map((day, dayIndex) => (
                    <div key={day} className="text-center">
                      <div className="text-xs text-white/70 mb-1">{day}</div>
                      <div className="space-y-1">
                        {Array.from({ length: 6 }, (_, hourIndex) => {
                          const intensity = Math.random() * 100;
                          const colorIntensity = Math.floor((intensity / 100) * 5);
                          return (
                            <div
                              key={hourIndex}
                              className={`w-4 h-4 rounded-sm ${
                                colorIntensity === 0 ? 'bg-gray-800' :
                                colorIntensity === 1 ? 'bg-red-900' :
                                colorIntensity === 2 ? 'bg-red-700' :
                                colorIntensity === 3 ? 'bg-orange-600' :
                                colorIntensity === 4 ? 'bg-yellow-500' :
                                'bg-green-400'
                              }`}
                              title={`${day} ${hourIndex * 4}:00 - ${(hourIndex + 1) * 4}:00`}
                            ></div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex items-center justify-between text-xs text-white/70">
                  <span>Low demand</span>
                  <div className="flex space-x-1">
                    <div className="w-3 h-3 bg-gray-800 rounded-sm"></div>
                    <div className="w-3 h-3 bg-red-900 rounded-sm"></div>
                    <div className="w-3 h-3 bg-red-700 rounded-sm"></div>
                    <div className="w-3 h-3 bg-orange-600 rounded-sm"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-sm"></div>
                    <div className="w-3 h-3 bg-green-400 rounded-sm"></div>
                  </div>
                  <span>High demand</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Weekly Overview Stats */}
        <div className="p-6">
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">This Week's Plan</h2>
                  <p className="text-sm text-gray-600">Your scheduled driving time</p>
                </div>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-700">{weeklyStats.totalShifts}</div>
                  <div className="text-xs text-blue-600">Scheduled Shifts</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-700">{weeklyStats.totalHours.toFixed(1)}h</div>
                  <div className="text-xs text-blue-600">Total Hours</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-700">${weeklyStats.estimatedEarnings.toFixed(0)}</div>
                  <div className="text-xs text-blue-600">Est. Earnings</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ultra High-Tech Quick Start Section */}
        <div className="px-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg">
                <Rocket className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">AI-Powered Quick Start</h2>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowQuickStart(!showQuickStart)}
                className="bg-gradient-to-r from-purple-500 to-blue-500 text-white border-0 hover:from-purple-600 hover:to-blue-600"
              >
                <Sparkles className="h-4 w-4 mr-1" />
                {showQuickStart ? 'Hide' : 'Show'} Templates
              </Button>
            </div>
          </div>
          
          {showQuickStart && (
            <div className="space-y-4">
              {/* AI Recommendation Banner */}
              <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl p-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-600/20 to-red-600/20"></div>
                <div className="relative z-10">
                  <div className="flex items-center space-x-2 mb-2">
                    <Brain className="h-5 w-5 text-yellow-300" />
                    <span className="font-semibold">AI Recommendation</span>
                    <div className="bg-yellow-300 text-orange-900 px-2 py-1 rounded-full text-xs font-bold">
                      94% Match
                    </div>
                  </div>
                  <p className="text-sm text-orange-100">
                    Based on your performance patterns, we recommend the <strong>Dinner Rush</strong> shift for maximum earnings potential.
                  </p>
                </div>
                <div className="absolute top-2 right-2 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <Zap className="h-4 w-4 text-yellow-300" />
                </div>
              </div>

              {/* Enhanced Quick Shift Cards */}
              <div className="grid grid-cols-2 gap-3">
                {QUICK_SHIFTS.map((shift, index) => (
                  <Card
                    key={shift.id}
                    className="cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:scale-105 relative overflow-hidden group"
                    onClick={() => handleQuickStart(shift)}
                  >
                    {/* Animated Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 group-hover:from-orange-50 group-hover:to-red-50 transition-all duration-300"></div>
                    
                    {/* Floating Particles */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="w-1 h-1 bg-orange-400 rounded-full animate-ping"></div>
                    </div>
                    
                    <CardContent className="p-4 relative z-10">
                      <div className="flex items-center space-x-3">
                        <div className={`p-3 rounded-xl ${shift.color} text-white shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110`}>
                          {shift.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">
                            {shift.name}
                          </h3>
                          <p className="text-xs text-gray-600">{shift.description}</p>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center space-x-1">
                              <Timer className="h-3 w-3 text-gray-500" />
                              <span className="text-xs font-medium text-gray-700">{shift.duration}h</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <DollarSign className="h-3 w-3 text-green-500" />
                              <span className="text-xs font-medium text-green-600">${shift.earnings}</span>
                            </div>
                          </div>
                          
                          {/* AI Confidence Indicator */}
                          <div className="mt-2 flex items-center space-x-1">
                            <div className="w-full bg-gray-200 rounded-full h-1">
                              <div 
                                className="bg-gradient-to-r from-orange-400 to-red-500 h-1 rounded-full transition-all duration-1000"
                                style={{ width: `${85 + index * 3}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-500 ml-1">{85 + index * 3}%</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Smart Scheduling Tips */}
              <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Lightning className="h-5 w-5 text-orange-600" />
                  <span className="font-semibold text-orange-800">Smart Tips</span>
                </div>
                <ul className="text-sm text-orange-700 space-y-1">
                  <li>• Schedule 30 minutes before peak hours for maximum efficiency</li>
                  <li>• Weather conditions can increase demand by up to 40%</li>
                  <li>• Weekend evening shifts typically yield 25% higher earnings</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Peak Hours Info */}
        <div className="px-6 mb-6">
          <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Peak Hours</h3>
                  <p className="text-sm text-gray-600">Best earning times: {weeklyStats.peakHours}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Weekly Schedule */}
        <div className="px-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Weekly Schedule</h2>
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

export default ProfessionalScheduleDashboard;
