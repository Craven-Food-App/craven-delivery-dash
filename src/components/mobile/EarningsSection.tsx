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


// --- Mock UI Components (Shadcn/ui equivalents using Tailwind) ---

const Card = ({ className = '', children, ...props }) => (
  <div className={`rounded-lg border border-slate-200 bg-white shadow ${className}`} {...props}>
    {children}
  </div>
);

const CardHeader = ({ className = '', children }) => (
  <div className={`flex flex-col space-y-1 px-6 py-4 border-b border-slate-100 ${className}`}>
    {children}
  </div>
);

const CardTitle = ({ className = '', children }) => (
  <h3 className={`text-base font-semibold leading-none tracking-tight text-slate-900 ${className}`}>
    {children}
  </h3>
);

const CardContent = ({ className = '', children }) => (
  <div className={`px-6 py-5 ${className}`}>
    {children}
  </div>
);

const Button = ({ className = '', variant = 'default', children, disabled = false, ...props }) => {
  const baseStyle = 'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const getVariantStyle = (v) => {
    switch (v) {
      case 'outline':
        return 'border border-slate-300 bg-white hover:bg-slate-50 text-slate-700';
      case 'secondary':
        return 'bg-slate-100 text-slate-900 hover:bg-slate-200';
      default:
        return 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm';
    }
  };

  const variantStyle = getVariantStyle(variant);

  return (
    <button
      className={`${baseStyle} ${variantStyle} ${className}`}
      disabled={disabled}
      style={{ padding: '0.625rem 1rem' }}
      {...props}
    >
      {children}
    </button>
  );
};

const Badge = ({ className = '', variant = 'default', children }) => {
  const baseStyle = 'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium';
  let variantStyle = '';

  switch (variant) {
    case 'secondary':
      variantStyle = 'bg-slate-100 text-slate-700 border-slate-200';
      break;
    case 'success':
      variantStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      break;
    default:
      variantStyle = 'bg-blue-50 text-blue-700 border-blue-200';
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
  date: string; // ISO string or formatted string
  restaurant: string;
  earnings: number;
  distance: number;
  time: string; // duration
}

// --- Initial Data Generator ---

const getInitialEarningsData = (userId: string): EarningsData => {
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  
  return {
    today: { total: 45.75, deliveries: 3, activeTime: '2h 15m', basePay: 28.50, tips: 12.25, bonuses: 5.00 },
    currentWeek: {
      total: 127.45, deliveries: 8, activeTime: '6h 30m', goal: 500, daysWorked: 3,
      dailyEarnings: [
        { day: 'Sun', date: weekStart.getDate(), amount: 0 },
        { day: 'Mon', date: weekStart.getDate() + 1, amount: 35.20 },
        { day: 'Tue', date: weekStart.getDate() + 2, amount: 46.50 },
        { day: 'Wed', date: weekStart.getDate() + 3, amount: 0 },
        { day: 'Thu', date: new Date().getDate(), amount: 45.75 },
        { day: 'Fri', date: weekStart.getDate() + 5, amount: 0 },
        { day: 'Sat', date: weekStart.getDate() + 6, amount: 0 },
      ],
      weekRange: `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
    },
    weeklyHistory: [],
    lifetime: { total: 1247.80, deliveries: 89, totalTime: '52h 15m', avgPerDelivery: 14.02 },
    instantPay: { available: 127.45, dailyLimit: 500, used: 0 }
  };
};

const INITIAL_DELIVERY_HISTORY: DeliveryHistory[] = [
  {
    id: "delivery-004", 
    date: new Date().toISOString(), 
    restaurant: "Chipotle Mexican Grill", 
    earnings: 16.50,
    distance: 2.3, 
    time: '18 min'
  },
  {
    id: "delivery-003", 
    date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), 
    restaurant: "Panda Express", 
    earnings: 14.75,
    distance: 1.8, 
    time: '12 min'
  },
  {
    id: "delivery-002", 
    date: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), 
    restaurant: "McDonald's", 
    earnings: 14.50,
    distance: 1.2, 
    time: '15 min'
  },
  {
    id: "delivery-001", 
    date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), 
    restaurant: "Five Guys", 
    earnings: 18.25,
    distance: 3.1, 
    time: '22 min'
  }
];

const INSTANT_CASHOUT_FEE = 0.50; // $0.50 fee for instant cashout

// --- Instant Cashout Modal Component ---

const InstantCashoutModal = ({ isOpen, onClose, availableAmount, onCashoutSuccess }) => {
  const [cashoutAmount, setCashoutAmount] = useState('');
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCashoutAmount(Math.max(0, availableAmount).toFixed(2));
      setMessage('');
      setSuccess(false);
    }
  }, [isOpen, availableAmount]);

  const handleCashout = async () => {
    const amount = parseFloat(cashoutAmount);
    const netAmount = amount - INSTANT_CASHOUT_FEE;

    if (isNaN(amount) || amount <= 0) {
      setMessage('Please enter a valid amount greater than $0.00.');
      return;
    }
    if (amount > availableAmount) {
      setMessage(`Amount ($${amount.toFixed(2)}) exceeds available balance ($${availableAmount.toFixed(2)}).`);
      return;
    }
    if (netAmount < 0.01) {
      setMessage(`Minimum net cashout must be over $0.00. (Requires entry > $${INSTANT_CASHOUT_FEE.toFixed(2)})`);
      return;
    }
    
    setLoading(true);
    setMessage('Processing instant cashout...');

    try {
      setMessage(`Successfully cashed out $${amount.toFixed(2)} (Net: $${netAmount.toFixed(2)})! Check your bank in minutes.`);
      setSuccess(true);
      
      setTimeout(() => {
        onCashoutSuccess?.(amount);
        onClose();
      }, 800);

    } catch (error) {
      console.error("Cashout UI error:", error);
      setMessage("Cashout failed. Please try again.");
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <Card className="w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-green-600" />
            CashApp Instant Cashout
          </CardTitle>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <X className="h-5 w-5" />
          </button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Available to Cash Out</p>
            <p className="text-3xl font-bold text-green-600">${Math.max(0, availableAmount).toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-1">Instant transfer to your CashApp</p>
          </div>
          <div className="space-y-2">
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
              Cashout Amount (CashApp Fee: ${INSTANT_CASHOUT_FEE.toFixed(2)})
            </label>
            <input
              id="amount"
              type="number"
              value={cashoutAmount}
              onChange={(e) => setCashoutAmount(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-2 text-lg focus:ring-green-500 focus:border-green-500"
              min="0.01"
              max={availableAmount.toFixed(2)}
              step="0.01"
              disabled={success || loading}
            />
          </div>
          {message && (
            <p className={`text-sm font-medium ${success ? 'text-green-600' : 'text-red-600'}`}>
              {message}
            </p>
          )}
          <Button
            className="w-full h-10 bg-green-600 hover:bg-green-700 disabled:bg-gray-400"
            onClick={handleCashout}
            disabled={success || loading || availableAmount < INSTANT_CASHOUT_FEE}
          >
            {loading ? 'Processing...' : (success ? <><Check className="h-5 w-5 mr-2" /> Sent to CashApp!</> : <><Zap className="h-5 w-5 mr-2" /> Cash Out to CashApp</>)}
          </Button>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-xs text-green-700 font-medium mb-1">💡 Same-Day CashApp Transfer</p>
            <p className="text-xs text-green-600">
              • Funds arrive in your CashApp within minutes<br/>
              • Available 24/7 including weekends<br/>
              • Secure & encrypted transfer
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};


// --- Main Application Component ---

export const EarningsSection = () => {
  const [earningsData, setEarningsData] = useState<EarningsData | null>(null);
  const [deliveryHistory, setDeliveryHistory] = useState<DeliveryHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCashoutModal, setShowCashoutModal] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [db, setDb] = useState<any>(null);
  const [auth, setAuth] = useState<any>(null);

  // Initialize local demo data (no Firebase)
  useEffect(() => {
    const uid = 'local-user';
    setUserId(uid);
    setEarningsData(getInitialEarningsData(uid));
    setDeliveryHistory(INITIAL_DELIVERY_HISTORY);
    setLoading(false);
  }, []);


  // Handler to refresh/force update (though onSnapshot makes this mostly redundant)
  const handleCashoutSuccess = (amount: number) => {
    setEarningsData((prev) => {
      if (!prev) return prev;
      const updatedAvailable = Math.max(0, prev.instantPay.available - amount);
      const updatedUsed = (prev.instantPay.used || 0) + amount;
      return {
        ...prev,
        instantPay: { ...prev.instantPay, available: updatedAvailable, used: updatedUsed }
      };
    });
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center pb-16 font-sans">
        <div className="text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-20 w-64 bg-slate-200 rounded-lg mx-auto"></div>
            <div className="h-4 w-32 bg-gray-200 rounded mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">Connecting to real-time earnings data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!earningsData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center pb-16 font-sans">
        <div className="text-center p-6">
          <DollarSign className="h-12 w-12 mx-auto text-slate-400 mb-4" />
          <h2 className="text-xl font-semibold mb-2 text-slate-900">No Earnings Data Available</h2>
          <p className="text-gray-500">Could not load earnings. This is likely a new account initialization or a connection error.</p>
          <Button className="mt-4" onClick={() => setLoading(true)}>Try Reconnect</Button>
          </div>
      </div>
    );
  }
  
  const currentWeek = earningsData.currentWeek;
  const today = earningsData.today;
  const lifetime = earningsData.lifetime;
  const instantPay = earningsData.instantPay;

  // Calculate Max Weekly Earning for chart scaling
  const maxWeeklyEarning = Math.max(
    ...currentWeek.dailyEarnings.map(d => d.amount),
    100 // Ensure a minimum bar height for visibility if all are zero
  );

  const todayAvgPerDelivery = today.deliveries > 0 ? today.total / today.deliveries : 0;
  const weekGoalProgress = (currentWeek.total / currentWeek.goal) * 100;
  
  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans">
      <div className="max-w-4xl mx-auto">
        {/* User ID Display - MANDATORY FOR MULTI-USER APPS */}
        <div className="p-2 text-center bg-slate-100 text-xs text-slate-600 border-b border-slate-200">
            Your Driver ID: <span className="font-mono font-bold text-orange-600 break-all">{userId || 'N/A'}</span>
        </div>

        {/* Earnings Header with Professional Gradient Background */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-md p-5 sm:p-6">
          <div className="flex items-center justify-between pt-4 pb-2">
            <h1 className="text-2xl sm:text-3xl font-bold">Your Earnings</h1>
            <HelpCircle className="h-6 w-6 text-orange-200 hover:text-white transition-colors cursor-pointer" />
          </div>
        
          {/* Daily Earnings Bar Chart - Fluid Layout */}
          <div className="px-0 pb-6">
            <p className="text-orange-200 text-center mb-6 text-sm">Confirmed Earnings for Current Week</p>
            <div className="flex items-end justify-between gap-1 sm:gap-2 mb-6 h-36">
              {currentWeek.dailyEarnings.map((day, index) => {
                const height = maxWeeklyEarning > 0 ? (day.amount / maxWeeklyEarning) * 100 : 0;
                const isToday = day.date === new Date().getDate();
                
                return (
                  <div key={index} className="flex flex-col items-center flex-1">
                    {/* Amount Label */}
                    <div className="h-6 flex items-end justify-center">
                      {day.amount > 0 && (
                        <span className={`text-white text-[10px] sm:text-xs font-medium whitespace-nowrap ${isToday ? 'font-bold' : ''}`}>
                          ${day.amount.toFixed(0)}
                        </span>
                      )}
                    </div>
                    
                    {/* Bar */}
                    <div className="h-20 w-full flex items-end justify-center">
                      <div 
                        className={`w-full max-w-[2.5rem] ${isToday ? 'bg-yellow-400 shadow-md' : 'bg-green-400'} rounded-t transition-all duration-500`}
                        style={{ height: day.amount > 0 ? `${Math.max(5, height)}%` : '4px' }}
                      />
                    </div>
                    
                    {/* Day/Date Labels */}
                    <div className="h-8 flex items-center justify-center w-full">
                      <div className={`text-[10px] sm:text-xs font-medium ${isToday ? 'text-white font-bold' : 'text-orange-200'}`}>
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
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="text-orange-200 text-xs sm:text-sm">Week Total ({currentWeek.weekRange})</p>
                  <p className="text-3xl sm:text-4xl font-extrabold text-white">${currentWeek.total.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-orange-200 text-xs sm:text-sm">Goal: ${currentWeek.goal}</p>
                  <Badge variant="success" className="bg-yellow-400 text-gray-900 font-bold">
                    {Math.min(100, weekGoalProgress).toFixed(0)}%
                  </Badge>
                </div>
              </div>
              <Progress 
                value={weekGoalProgress}
                className="bg-orange-400 h-1.5"
              />
            </CardContent>
          </Card>

          {/* Quick Actions - Responsive Grid */}
          <div className="p-4 pt-0 space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <Button 
                className="h-16 sm:h-20 flex flex-col items-center justify-center gap-1 bg-green-500 hover:bg-green-600 text-white border-0 shadow-xl transition-transform transform hover:scale-[1.02] active:scale-95"
                onClick={() => setShowCashoutModal(true)}
                disabled={instantPay.available < INSTANT_CASHOUT_FEE}
              >
                <Zap className="h-5 w-5 sm:h-6 sm:w-6" />
                <span className="text-xs sm:text-sm font-semibold">CashApp Pay</span>
                <span className="text-xs sm:text-sm font-bold">${Math.max(0, instantPay.available).toFixed(2)}</span>
              </Button>
              <Button 
                className="h-16 sm:h-20 flex flex-col items-center justify-center gap-1 bg-white/20 border-white/50 text-white hover:bg-white/30"
                variant="outline"
                onClick={() => console.log("Navigating to Payment Settings")}
              >
                <CreditCard className="h-5 w-5 sm:h-6 sm:w-6" />
                <span className="text-xs sm:text-sm">Manage</span>
                <span className="text-xs sm:text-sm font-semibold">Payments</span>
              </Button>
            </div>
          </div>
        </div>

        {/* White Background Content */}
        <div className="bg-white p-4 sm:p-6">

          {/* Today's Stats - Responsive Grid */}
          <div className="mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Today's Performance</h2>
            <Card>
              <CardContent className="p-4 sm:p-6 space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="space-y-2">
                    <Clock className="h-6 w-6 text-orange-500 mx-auto" />
                    <p className="text-xs sm:text-sm text-gray-500">Active Time</p>
                    <p className="font-semibold text-sm sm:text-base">{today.activeTime}</p>
                  </div>
                  <div className="space-y-2">
                    <Calendar className="h-6 w-6 text-orange-500 mx-auto" />
                    <p className="text-xs sm:text-sm text-gray-500">Deliveries</p>
                    <p className="font-semibold text-sm sm:text-base">{today.deliveries}</p>
                  </div>
                  <div className="space-y-2">
                    <DollarSign className="h-6 w-6 text-orange-500 mx-auto" />
                    <p className="text-xs sm:text-sm text-gray-500">Avg / Del</p>
                    <p className="font-semibold text-sm sm:text-base">${todayAvgPerDelivery.toFixed(2)}</p>
                  </div>
                </div>
                <Separator />
                <div className="text-sm text-gray-600 space-y-2">
                  <div className="flex justify-between"><span>Base Pay</span> <span className="font-medium">${today.basePay.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>Customer Tips</span> <span className="font-medium">${today.tips.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>Bonuses</span> <span className="font-medium">${today.bonuses.toFixed(2)}</span></div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Deliveries */}
          <div className="mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">Recent Deliveries</h2>
            <Card>
              {deliveryHistory.slice(0, 5).map((delivery, index) => (
                <div key={delivery.id}>
                  <div className="flex items-center justify-between p-4 sm:p-5 hover:bg-gray-50 transition-colors cursor-pointer gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm sm:text-base font-semibold text-gray-800 truncate">{delivery.restaurant}</p>
                      <p className="text-xs sm:text-sm text-gray-500">
                        {new Date(delivery.date).toLocaleDateString()} - {delivery.time}
                      </p>
                    </div>
                    <div className="text-right flex flex-col items-end shrink-0">
                      <p className="text-lg sm:text-xl font-bold text-green-600">${delivery.earnings.toFixed(2)}</p>
                      <p className="text-xs sm:text-sm text-gray-500">{delivery.distance.toFixed(1)} mi</p>
                    </div>
                  </div>
                  {index < deliveryHistory.length - 1 && index < 4 && <Separator className="mx-4" />}
                </div>
              ))}
            </Card>
            <Button variant="secondary" className="w-full mt-4 h-10 sm:h-12 bg-orange-500 text-white hover:bg-orange-600 text-sm sm:text-base">
              View All History <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Instant Cashout Modal */}
      <InstantCashoutModal
        isOpen={showCashoutModal}
        onClose={() => setShowCashoutModal(false)}
        availableAmount={instantPay.available}
        onCashoutSuccess={handleCashoutSuccess}
      />
    </div>
  );
};
// Default export for the single-file React component
export default EarningsSection;
