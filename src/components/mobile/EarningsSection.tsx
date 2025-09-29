import React, { useState, useEffect, useCallback } from 'react';
import { 
  DollarSign, 
  Clock, 
  Calendar,
  CreditCard,
  Zap,
  ChevronRight,
  HelpCircle,
  Info,
  X,
  Check
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setLogLevel } from 'firebase/firestore';

// --- Global Context Variables (Mandatory for Canvas Environment) ---
// These are assumed to be defined by the environment
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : undefined;

// --- Mock UI Components (Shadcn/ui equivalents using Tailwind) ---

const Card = ({ className = '', children }) => (
  <div className={`rounded-xl border bg-card text-card-foreground shadow-lg ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ className = '', children }) => (
  <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>
    {children}
  </div>
);

const CardTitle = ({ className = '', children }) => (
  <h3 className={`text-xl font-semibold leading-none tracking-tight ${className}`}>
    {children}
  </h3>
);

const CardContent = ({ className = '', children }) => (
  <div className={`p-6 pt-0 ${className}`}>
    {children}
  </div>
);

const Button = ({ className = '', variant = 'default', children, onClick, disabled = false }) => {
  const baseStyle = 'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background';
  let variantStyle = '';

  switch (variant) {
    case 'outline':
      variantStyle = 'border border-input bg-background hover:bg-accent hover:text-accent-foreground';
      break;
    case 'secondary':
      variantStyle = 'bg-secondary text-secondary-foreground hover:bg-secondary/80';
      break;
    default:
      // Note: Default primary style is handled by className for the orange theme
      variantStyle = 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md';
      break;
  }

  return (
    <button
      className={`${baseStyle} ${variantStyle} ${className}`}
      onClick={onClick}
      disabled={disabled}
      style={{ padding: '0.5rem 1rem' }}
    >
      {children}
    </button>
  );
};

const Badge = ({ className = '', variant = 'default', children }) => {
  const baseStyle = 'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2';
  let variantStyle = '';

  switch (variant) {
    case 'secondary':
      variantStyle = 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80';
      break;
    case 'success':
      variantStyle = 'border-transparent bg-green-500 text-white hover:bg-green-600';
      break;
    default:
      variantStyle = 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80';
      break;
  }

  return <span className={`${baseStyle} ${variantStyle} ${className}`}>{children}</span>;
};

const Separator = ({ className = '' }) => (
  <div className={`shrink-0 bg-gray-200 h-[1px] w-full ${className}`} />
);

const Progress = ({ value, className = '' }) => (
  <div className={`relative h-2 w-full overflow-hidden rounded-full bg-secondary ${className}`}>
    <div
      className="h-full bg-yellow-400 transition-all duration-500 ease-out"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </div>
);

// --- Instant Cashout Modal Component ---

const InstantCashoutModal = ({ isOpen, onClose, availableAmount, onSuccess }) => {
  const [cashoutAmount, setCashoutAmount] = useState('');
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCashoutAmount(availableAmount.toFixed(2));
      setMessage('');
      setSuccess(false);
    }
  }, [isOpen, availableAmount]);

  const handleCashout = () => {
    const amount = parseFloat(cashoutAmount);
    if (isNaN(amount) || amount <= 0) {
      setMessage('Please enter a valid amount.');
      return;
    }
    if (amount > availableAmount) {
      setMessage(`Amount exceeds available balance ($${availableAmount.toFixed(2)}).`);
      return;
    }

    // Simulate instant cashout
    setMessage(`Successfully cashed out $${amount.toFixed(2)}! Check your bank in minutes.`);
    setSuccess(true);
    setTimeout(() => {
      onSuccess();
      onClose();
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <Card className="w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Instant Cashout</CardTitle>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <X className="h-5 w-5" />
          </button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Available to Cash Out</p>
            <p className="text-3xl font-bold text-green-600">${availableAmount.toFixed(2)}</p>
          </div>
          <div className="space-y-2">
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Cashout Amount</label>
            <input
              id="amount"
              type="number"
              value={cashoutAmount}
              onChange={(e) => setCashoutAmount(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-2 text-lg focus:ring-orange-500 focus:border-orange-500"
              min="0.01"
              max={availableAmount.toFixed(2)}
              step="0.01"
              disabled={success}
            />
          </div>
          {message && (
            <p className={`text-sm font-medium ${success ? 'text-green-600' : 'text-red-600'}`}>
              {message}
            </p>
          )}
          <Button
            className="w-full h-10 bg-green-600 hover:bg-green-700"
            onClick={handleCashout}
            disabled={success || availableAmount < 0.50}
          >
            {success ? <Check className="h-5 w-5 mr-2" /> : <Zap className="h-5 w-5 mr-2" />}
            {success ? 'Cashed Out!' : 'Cash Out Now'}
          </Button>
          <p className="text-xs text-center text-gray-500">
            $0.50 fee applies per Instant Cashout.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

// --- Data Interfaces (Unchanged) ---

interface DailyEarnings {
  day: string;
  date: number;
  amount: number;
}

interface WeeklyEarnings {
  weekStart: string;
  weekEnd: string;
  total: number;
  isCurrentWeek: boolean;
}

interface EarningsData {
  today: {
    total: number;
    deliveries: number;
    activeTime: string;
    basePay: number;
    tips: number;
    bonuses: number;
  };
  currentWeek: {
    total: number;
    deliveries: number;
    activeTime: string;
    goal: number;
    daysWorked: number;
    dailyEarnings: DailyEarnings[];
    weekRange: string;
  };
  weeklyHistory: WeeklyEarnings[];
  lifetime: {
    total: number;
    deliveries: number;
    totalTime: string;
    avgPerDelivery: number;
  };
  instantPay: {
    available: number;
    dailyLimit: number;
    used: number;
  };
}

interface DeliveryHistory {
  id: string;
  date: string;
  restaurant: string;
  earnings: number;
  basePay: number;
  tip: number;
  bonus: number;
  distance: number;
  time: string;
}

// --- Mock Data Generator (Unchanged) ---

const generateMockEarnings = (userId: string): EarningsData => {
  const currentTotal = 325.50 + (userId.length % 10);
  const todayTotal = 55.75 + (userId.length % 5);
  const goal = 500;

  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  
  const estimateBreakdown = (total: number) => ({
    basePay: total * 0.60,
    tips: total * 0.30,
    bonuses: total * 0.10
  });

  const todayBreakdown = estimateBreakdown(todayTotal);

  return {
    today: {
      total: todayTotal,
      deliveries: 4,
      activeTime: '2h 15m',
      ...todayBreakdown
    },
    currentWeek: {
      total: currentTotal,
      deliveries: 28,
      activeTime: '14h 45m',
      goal: goal,
      daysWorked: 5,
      dailyEarnings: [
        { day: 'Sun', date: weekStart.getDate(), amount: 45.20 },
        { day: 'Mon', date: weekStart.getDate() + 1, amount: 67.50 },
        { day: 'Tue', date: weekStart.getDate() + 2, amount: 88.00 },
        { day: 'Wed', date: weekStart.getDate() + 3, amount: 75.00 },
        { day: 'Thu', date: today.getDate(), amount: todayTotal },
        { day: 'Fri', date: weekStart.getDate() + 5, amount: 0 },
        { day: 'Sat', date: weekStart.getDate() + 6, amount: 0 },
      ],
      weekRange: `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
    },
    weeklyHistory: [
      { weekStart: 'Sep 1', weekEnd: 'Sep 7', total: 410.50, isCurrentWeek: false },
      { weekStart: 'Aug 25', weekEnd: 'Aug 31', total: 520.15, isCurrentWeek: false },
      { weekStart: 'Aug 18', weekEnd: 'Aug 24', total: 390.00, isCurrentWeek: false },
    ],
    lifetime: {
      total: 12450.75,
      deliveries: 1050,
      totalTime: '525h 0m',
      avgPerDelivery: 11.86
    },
    instantPay: {
      available: Math.max(0, todayTotal - 1.50), // Fee buffer
      dailyLimit: 500,
      used: 0
    }
  };
};

const generateMockDeliveryHistory = (userId: string): DeliveryHistory[] => {
  const now = new Date();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const formatTime = (date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return [
    {
      id: "ord-1005", date: `Today ${formatTime(now)}`, restaurant: "The Burger Spot", earnings: 14.25,
      basePay: 8.55, tip: 4.28, bonus: 1.42, distance: 3.2, time: '18 min'
    },
    {
      id: "ord-1004", date: `Today ${formatTime(new Date(now.getTime() - 90 * 60000))}`, restaurant: "Pho Saigon", earnings: 11.50,
      basePay: 6.90, tip: 3.45, bonus: 1.15, distance: 2.1, time: '15 min'
    },
    {
      id: "ord-1003", date: `Yesterday ${formatTime(new Date(now.getTime() - 10 * 3600000))}`, restaurant: "Sushi Roll Up", earnings: 18.90,
      basePay: 11.34, tip: 5.67, bonus: 1.89, distance: 4.5, time: '25 min'
    },
    {
      id: "ord-1002", date: "Sep 27, 2025", restaurant: "Pizza Palace", earnings: 16.00,
      basePay: 9.60, tip: 4.80, bonus: 1.60, distance: 3.8, time: '20 min'
    },
    {
      id: "ord-1001", date: "Sep 27, 2025", restaurant: "Vegan Deli", earnings: 12.00,
      basePay: 7.20, tip: 3.60, bonus: 1.20, distance: 2.5, time: '16 min'
    },
  ];
};


// --- Main Application Component ---

export const EarningsSection = () => {
  const [earningsData, setEarningsData] = useState<EarningsData | null>(null);
  const [deliveryHistory, setDeliveryHistory] = useState<DeliveryHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCashoutModal, setShowCashoutModal] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Initialize Firebase and Authenticate
  useEffect(() => {
    // setLogLevel('debug');
    try {
      if (!firebaseConfig.apiKey) {
        console.error("Firebase config is missing API key. Cannot initialize.");
        setLoading(false);
        return;
      }
      
      const app = initializeApp(firebaseConfig, 'earnings-dashboard-app');
      const auth = getAuth(app);
      
      const authenticate = async () => {
        try {
          if (initialAuthToken) {
            await signInWithCustomToken(auth, initialAuthToken);
          } else {
            await signInAnonymously(auth);
          }
        } catch (error) {
          console.error("Firebase auth failed:", error);
          // Fallback to anonymous sign-in if custom token fails
          await signInAnonymously(auth);
        }
      };

      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          setUserId(user.uid);
        } else {
          // This should not happen after the initial sign-in, but handle it
          setUserId(null);
          setLoading(false);
        }
      });
      
      authenticate();
      return () => unsubscribe(); // Cleanup auth listener
    } catch(e) {
      console.error("Error during Firebase initialization:", e);
      setLoading(false);
    }
  }, []);

  // Fetch or Mock Data once Auth is ready
  const fetchEarningsData = useCallback(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    // In a real app, you would fetch Firestore data here using the userId.
    // We are mocking the data fetching for this single-file environment.
    const mockData = generateMockEarnings(userId);
    const mockHistory = generateMockDeliveryHistory(userId);

    setEarningsData(mockData);
    setDeliveryHistory(mockHistory);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchEarningsData();
    }
  }, [userId, fetchEarningsData]);


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pb-16 font-sans">
        <div className="text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-20 w-64 bg-gray-200 rounded-xl mx-auto"></div>
            <div className="h-4 w-32 bg-gray-200 rounded mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">Authenticating and loading earnings...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!earningsData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pb-16 font-sans">
        <div className="text-center p-6">
          <DollarSign className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Earnings Data Available</h2>
          <p className="text-gray-500">Could not load earnings. Please check your connection or contact support.</p>
        </div>
      </div>
    );
  }

  const maxWeeklyEarning = Math.max(
    ...earningsData.currentWeek.dailyEarnings.map(d => d.amount),
    100 // Ensure a minimum bar height for visibility if all are zero
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-16 font-sans">
      
      {/* User ID Display - MANDATORY FOR MULTI-USER APPS */}
      <div className="p-2 text-center bg-gray-100 text-xs text-gray-600 border-b">
          Your Driver ID: <span className="font-mono font-bold text-orange-600">{userId || 'N/A'}</span>
      </div>

      {/* Earnings Header with Gradient Background (ORANGE) */}
      <div className="bg-gradient-to-b from-orange-600 to-orange-700 text-white shadow-lg">
        <div className="flex items-center justify-between p-4 pt-8">
          <h1 className="text-2xl font-bold">Your Earnings</h1>
          <HelpCircle className="h-6 w-6 text-orange-200 hover:text-white transition-colors cursor-pointer" />
        </div>
        
        <div className="px-4 pb-6">
          <p className="text-orange-200 text-center mb-6 text-sm">Confirmed Earnings for Current Week</p>
          
          {/* Daily Earnings Bar Chart */}
          <div className="flex items-end justify-between gap-1 mb-6 h-36">
            {earningsData.currentWeek.dailyEarnings.map((day, index) => {
              const height = maxWeeklyEarning > 0 ? (day.amount / maxWeeklyEarning) * 100 : 0;
              const isToday = day.date === new Date().getDate();
              
              return (
                <div key={index} className="flex flex-col items-center w-1/7 min-w-10">
                  {/* Amount Label */}
                  <div className="h-6 flex items-end justify-center mb-1">
                    {day.amount > 0 && (
                      <span className={`text-white text-xs font-medium whitespace-nowrap ${isToday ? 'font-bold' : ''}`}>
                        ${day.amount.toFixed(0)}
                      </span>
                    )}
                  </div>
                  
                  {/* Bar */}
                  <div className="h-20 w-full flex items-end justify-center px-1 mb-2">
                    <div 
                      className={`w-full max-w-[2.5rem] ${isToday ? 'bg-yellow-400 shadow-md' : 'bg-green-400'} rounded-t transition-all duration-500`}
                      style={{ height: `${Math.max(height * 0.8, day.amount > 0 ? 8 : 4)}px` }}
                    />
                  </div>
                  
                  {/* Day/Date Labels */}
                  <div className="h-8 flex flex-col items-center justify-start w-full">
                    <div className={`text-xs leading-tight ${isToday ? 'text-white font-bold' : 'text-orange-200'}`}>
                      {day.day}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Current Week Summary & Goal */}
        <Card className="mx-4 mb-4 bg-orange-700/30 border-0 shadow-lg">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-200 text-xs">Week Total ({earningsData.currentWeek.weekRange})</p>
                <p className="text-4xl font-extrabold text-white">${earningsData.currentWeek.total.toFixed(2)}</p>
              </div>
              <div className="text-right">
                <p className="text-orange-200 text-xs">Goal: ${earningsData.currentWeek.goal}</p>
                <Badge variant="success" className="bg-yellow-400 text-gray-900 font-bold">
                  {((earningsData.currentWeek.total / earningsData.currentWeek.goal) * 100).toFixed(0)}%
                </Badge>
              </div>
            </div>
            <Progress 
              value={(earningsData.currentWeek.total / earningsData.currentWeek.goal) * 100}
              className="bg-orange-400 h-1.5"
            />
          </CardContent>
        </Card>

        {/* Quick Actions (Inside Gradient for Emphasis) */}
        <div className="p-4 pt-0 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Button 
              className="h-16 flex flex-col items-center justify-center gap-1 bg-yellow-400 hover:bg-yellow-500 text-gray-900 border-0 shadow-xl transition-transform transform hover:scale-[1.02]"
              onClick={() => setShowCashoutModal(true)}
              disabled={earningsData.instantPay.available < 0.50}
            >
              <Zap className="h-5 w-5" />
              <span className="text-xs font-semibold">Instant Pay</span>
              <span className="text-xs font-bold">${earningsData.instantPay.available.toFixed(2)}</span>
            </Button>
            <Button 
              className="h-16 flex flex-col items-center justify-center gap-1 bg-white/20 border-white/50 text-white hover:bg-white/30"
              variant="outline"
            >
              <CreditCard className="h-5 w-5" />
              <span className="text-xs">Manage</span>
              <span className="text-xs font-semibold">Payments</span>
            </Button>
          </div>
        </div>
      </div>

      {/* White Background Content */}
      <div className="bg-white p-4">

        {/* Today's Stats */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Today's Performance</h2>
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-around text-center">
                <div className="space-y-1">
                  <Clock className="h-5 w-5 text-orange-500 mx-auto" />
                  <p className="text-xs text-gray-500">Active Time</p>
                  <p className="font-semibold text-sm">{earningsData.today.activeTime}</p>
                </div>
                <div className="space-y-1">
                  <Calendar className="h-5 w-5 text-orange-500 mx-auto" />
                  <p className="text-xs text-gray-500">Deliveries</p>
                  <p className="font-semibold text-sm">{earningsData.today.deliveries}</p>
                </div>
                <div className="space-y-1">
                  <DollarSign className="h-5 w-5 text-orange-500 mx-auto" />
                  <p className="text-xs text-gray-500">Avg / Del</p>
                  <p className="font-semibold text-sm">${(earningsData.today.deliveries > 0 ? earningsData.today.total / earningsData.today.deliveries : 0).toFixed(2)}</p>
                </div>
              </div>
              <Separator />
              <div className="text-xs text-gray-600 space-y-1">
                <div className="flex justify-between"><span>Base Pay</span> <span className="font-medium">${earningsData.today.basePay.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Customer Tips</span> <span className="font-medium">${earningsData.today.tips.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Bonuses</span> <span className="font-medium">${earningsData.today.bonuses.toFixed(2)}</span></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Deliveries */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Recent Deliveries</h2>
          <Card>
            {deliveryHistory.map((delivery, index) => (
              <React.Fragment key={delivery.id}>
                <div className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{delivery.restaurant}</p>
                    <p className="text-xs text-gray-500">{delivery.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">${delivery.earnings.toFixed(2)}</p>
                    <p className="text-xs text-gray-500">{delivery.distance.toFixed(1)} mi</p>
                  </div>
                </div>
                {index < deliveryHistory.length - 1 && <Separator className="mx-4" />}
              </React.Fragment>
            ))}
          </Card>
          <Button variant="secondary" className="w-full mt-4 h-10 bg-orange-500 text-white hover:bg-orange-600">
            View All History <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
      
      {/* Instant Cashout Modal */}
      <InstantCashoutModal
        isOpen={showCashoutModal}
        onClose={() => setShowCashoutModal(false)}
        availableAmount={earningsData.instantPay.available}
        onSuccess={() => {
          // Re-fetch data to reflect the cashout
          fetchEarningsData();
        }}
      />
    </div>
  );
};
// Default export for the single-file React component
export default EarningsSection;
