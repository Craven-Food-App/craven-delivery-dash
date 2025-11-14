import React, { useState, useEffect } from "react";
import {
  User,
  Car,
  FileText,
  CreditCard,
  Settings,
  Shield,
  Phone,
  MessageCircle,
  LogOut,
  ChevronRight,
  Star,
  Award,
  Bell,
  Menu,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import ProfileDetailsPage from "./ProfileDetailsPage";
import VehicleDocumentsPage from "./VehicleDocumentsPage";
import AppSettingsPage from "./AppSettingsPage";
import SecuritySafetyPage from "./SecuritySafetyPage";
import { useNavigate } from "react-router-dom";

type FeederAccountPageProps = {
  onOpenMenu?: () => void;
  onOpenNotifications?: () => void;
};

const FeederAccountPage: React.FC<FeederAccountPageProps> = ({ onOpenMenu, onOpenNotifications }) => {
  const [showCardPage, setShowCardPage] = useState(false);
  const [showCardDetails, setShowCardDetails] = useState(false);
  const [isCardLocked, setIsCardLocked] = useState(false);
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [currentPage, setCurrentPage] = useState<'main' | 'profile' | 'vehicle' | 'settings' | 'security'>('main');
  
  // Driver stats - will be fetched from database
  const [driverPoints, setDriverPoints] = useState(0);
  const [driverName, setDriverName] = useState('');
  const [driverRating, setDriverRating] = useState(0);
  const [totalDeliveries, setTotalDeliveries] = useState(0);
  const [memberSince, setMemberSince] = useState('');
  // Feeder Card placeholder data
  const [cardBalance] = useState(3573.21);
  const [cardNumber] = useState('5399 2833 0939 0129');
  const [expiryDate] = useState('12/28');
  const [cvv] = useState('847');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    fetchDriverData();
  }, []);

  const fetchDriverData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch driver profile
      const { data: driverProfile } = await supabase
        .from('driver_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // TODO: Driver table structure needs update - using placeholder data
      const driverData: any = null;

      // Get user metadata
      const fullName = user.user_metadata?.full_name || 
                      driverData?.full_name ||
                      user.email?.split('@')[0] || 'Driver';
      setDriverName(fullName);

      // Set driver stats
      if (driverProfile) {
        setDriverRating(Number(driverProfile.rating) || 0);
        setTotalDeliveries(driverProfile.total_deliveries || 0);
        
        // Calculate points based on rating and deliveries
        const points = Math.round((Number(driverProfile.rating) || 0) * 17 + (driverProfile.total_deliveries || 0) * 0.1);
        setDriverPoints(points);
      }

      // Set member since date
      if (driverProfile?.created_at) {
        const date = new Date(driverProfile.created_at);
        setMemberSince(date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
      } else if (user.created_at) {
        const date = new Date(user.created_at);
        setMemberSince(date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
      }

      // Fetch earnings for transaction history only (card balance is placeholder)
      const { data: earnings } = await supabase
        .from('driver_earnings')
        .select('*')
        .eq('driver_id', user.id)
        .order('earned_at', { ascending: false });

      if (earnings) {
        // Format transactions
        const formattedTransactions = earnings.slice(0, 10).map((earning: any) => ({
          date: new Date(earning.earned_at || earning.paid_out_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          description: 'Daily Earnings Deposit',
          amount: ((earning.base_pay_cents || 0) + (earning.tip_cents || 0)) / 100,
          type: 'credit' as const,
        }));
        setTransactions(formattedTransactions);
      }
    } catch (error) {
      console.error('Error fetching driver data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Determine status based on points
  const getStatus = (points: number) => {
    if (points >= 85)
      return { name: "Diamond Feeder", color: "diamond", gradient: "from-cyan-200 via-blue-300 to-purple-300" };
    if (points >= 76)
      return { name: "Platinum Feeder", color: "platinum", gradient: "from-gray-300 via-gray-100 to-gray-300" };
    if (points >= 65)
      return { name: "Gold Feeder", color: "gold", gradient: "from-yellow-300 via-yellow-200 to-yellow-400" };
    return { name: "Silver Feeder", color: "silver", gradient: "from-gray-400 via-gray-300 to-gray-500" };
  };

  const status = getStatus(driverPoints);

  const getMenuItemColors = (color: string) => {
    const colors: Record<string, { bg: string; icon: string }> = {
      blue: { bg: "bg-blue-100", icon: "text-blue-600" },
      green: { bg: "bg-green-100", icon: "text-green-600" },
      purple: { bg: "bg-purple-100", icon: "text-purple-600" },
      gray: { bg: "bg-gray-100", icon: "text-gray-600" },
      red: { bg: "bg-red-100", icon: "text-red-600" },
      orange: { bg: "bg-orange-100", icon: "text-orange-600" },
    };
    return colors[color] || colors.gray;
  };

  const menuItems = [
    { 
      icon: User, 
      label: "Profile Information", 
      desc: "Personal details & preferences", 
      color: "blue",
      action: () => setCurrentPage('profile')
    },
    { 
      icon: Car, 
      label: "Vehicle & Documents", 
      desc: "Registration, insurance, inspection", 
      color: "green",
      action: () => setCurrentPage('vehicle')
    },
    {
      icon: CreditCard,
      label: "Feeder Card",
      desc: "Digital debit card & transactions",
      color: "purple",
      badge: `$${cardBalance.toFixed(2)}`,
      action: () => setShowCardPage(true),
    },
    { 
      icon: Settings, 
      label: "App Settings", 
      desc: "Notifications, language, preferences", 
      color: "gray",
      action: () => setCurrentPage('settings')
    },
    { 
      icon: Shield, 
      label: "Security & Safety", 
      desc: "Password, 2FA, emergency contacts", 
      color: "red",
      action: () => setCurrentPage('security')
    },
    { 
      icon: Phone, 
      label: "Call Support", 
      desc: "24/7 driver assistance hotline", 
      color: "orange",
      action: () => window.location.href = 'tel:+18005551234'
    },
    { 
      icon: MessageCircle, 
      label: "Message Support", 
      desc: "Live chat with support team", 
      color: "blue",
      action: () => {
        navigate('/mobile?tab=help');
        if (onOpenNotifications) onOpenNotifications();
      }
    },
  ];

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Signed out successfully");
      navigate('/mobile');
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Failed to sign out");
      // Still redirect even on error
      navigate('/mobile');
    }
  };

  // Show sub-pages
  if (currentPage === 'profile') {
    return <ProfileDetailsPage onBack={() => setCurrentPage('main')} />;
  }

  if (currentPage === 'vehicle') {
    return <VehicleDocumentsPage onBack={() => setCurrentPage('main')} />;
  }

  if (currentPage === 'settings') {
    return <AppSettingsPage onBack={() => setCurrentPage('main')} />;
  }

  if (currentPage === 'security') {
    return <SecuritySafetyPage onBack={() => setCurrentPage('main')} />;
  }

  // If card page is open, show that instead
  if (showCardPage) {
    return (
      <div className="h-screen w-full bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 overflow-y-auto" style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))' }}>
        {/* Header */}
        <div className="px-6 pb-4 flex items-center justify-between flex-shrink-0 safe-area-top">
          <button onClick={() => setShowCardPage(false)} className="text-gray-900">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-gray-900 text-2xl font-bold">Feeder Card</h1>
          <div className="w-6"></div>
        </div>

        {/* Card Display */}
        <div className="px-6 mb-6 flex justify-center">
          <div
            className="bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 rounded-3xl p-6 shadow-2xl relative overflow-hidden"
            style={{ 
              aspectRatio: "1.586 / 1",
              width: "100%",
              maxWidth: "340px"
            }}
          >
            {/* Card shine effect */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>

            <div className="relative h-full flex flex-col justify-between py-1.5">
              {/* Top Section - Balance */}
              <div className="flex-shrink-0">
                <p className="text-orange-100 text-[10px] mb-0.5 leading-tight">Available Balance</p>
                <h2 className="text-white text-xl font-black leading-tight">${cardBalance.toFixed(2)}</h2>
              </div>

              {/* Middle Section - Card Number (centered) */}
              <div className="flex items-center justify-center flex-shrink-0" style={{ marginTop: '-10px' }}>
                <p className="text-white text-lg font-mono tracking-widest break-all text-center leading-tight">
                  {showCardDetails ? cardNumber : "**** **** **** " + cardNumber.replace(/\s/g, "").slice(-4)}
                </p>
              </div>

              {/* Bottom Section - Expiry, CVV, Name, Brand */}
              <div className="flex items-end justify-between flex-shrink-0" style={{ marginTop: '-30px' }}>
                <div className="flex-1 min-w-0">
                  {/* Expiry and CVV */}
                  <div className="flex gap-2 mb-0.5">
                    <div>
                      <p className="text-orange-100 text-[8px] mb-0.5 leading-tight">EXP</p>
                      <p className="text-white text-[10px] font-mono leading-tight">{showCardDetails ? expiryDate : "**/**"}</p>
                    </div>
                    <div>
                      <p className="text-orange-100 text-[8px] mb-0.5 leading-tight">CVV</p>
                      <p className="text-white text-[10px] font-mono leading-tight">{showCardDetails ? cvv : "***"}</p>
                    </div>
                  </div>
                  {/* Cardholder Name */}
                  <div className="truncate">
                    <p className="text-white text-[9px] font-bold tracking-wide leading-tight">{driverName.toUpperCase()}</p>
                  </div>
                </div>
                {/* Brand Logo */}
                <div className="text-white text-sm font-black ml-2 flex-shrink-0">FEEDER</div>
              </div>
            </div>
          </div>
        </div>

        {/* Card Controls */}
        <div className="px-6 mb-6">
          <div className="bg-white rounded-2xl p-4 shadow-lg space-y-3">
            {/* Toggle Card Details */}
            <button
              onClick={() => setShowCardDetails(!showCardDetails)}
              className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="font-bold text-gray-900">Show Card Details</p>
                  <p className="text-xs text-gray-500">View number, expiry, CVV</p>
                </div>
              </div>
              <div
                className={`w-12 h-6 rounded-full transition-colors ${showCardDetails ? "bg-blue-600" : "bg-gray-300"}`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform m-0.5 ${showCardDetails ? "translate-x-6" : ""}`}
                ></div>
              </div>
            </button>

            {/* Lock Card */}
            <button
              onClick={() => setIsCardLocked(!isCardLocked)}
              className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`${isCardLocked ? "bg-red-100" : "bg-green-100"} p-2 rounded-lg`}>
                  <svg
                    className={`w-5 h-5 ${isCardLocked ? "text-red-600" : "text-green-600"}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {isCardLocked ? (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    ) : (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
                      />
                    )}
                  </svg>
                </div>
                <div className="text-left">
                  <p className="font-bold text-gray-900">{isCardLocked ? "Card Locked" : "Lock Card"}</p>
                  <p className="text-xs text-gray-500">
                    {isCardLocked ? "Transactions blocked" : "Block all transactions"}
                  </p>
                </div>
              </div>
              <div className={`w-12 h-6 rounded-full transition-colors ${isCardLocked ? "bg-red-600" : "bg-gray-300"}`}>
                <div
                  className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform m-0.5 ${isCardLocked ? "translate-x-6" : ""}`}
                ></div>
              </div>
            </button>

            {/* Change PIN */}
            <button
              onClick={() => setShowPinDialog(true)}
              className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="font-bold text-gray-900">Change Card PIN</p>
                  <p className="text-xs text-gray-500">Set or update your PIN</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* PIN Dialog */}
        {showPinDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-6">
            <div className="bg-white rounded-3xl p-6 w-full max-w-sm">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Change Card PIN</h3>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-sm text-gray-600 font-semibold mb-2 block">Current PIN</label>
                  <input
                    type="password"
                    maxLength={4}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-center text-2xl font-mono tracking-widest"
                    placeholder="****"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 font-semibold mb-2 block">New PIN</label>
                  <input
                    type="password"
                    maxLength={4}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-center text-2xl font-mono tracking-widest"
                    placeholder="****"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 font-semibold mb-2 block">Confirm New PIN</label>
                  <input
                    type="password"
                    maxLength={4}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-center text-2xl font-mono tracking-widest"
                    placeholder="****"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPinDialog(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-full font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowPinDialog(false);
                    toast.success("PIN updated successfully");
                  }}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-red-600 text-white py-3 rounded-full font-bold"
                >
                  Update PIN
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Transactions List */}
        <div className="px-6 pb-24">
          <h3 className="text-gray-900 text-xl font-bold mb-4">Transaction History</h3>
          {transactions.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center">
              <p className="text-gray-500">No transactions yet</p>
              <p className="text-sm text-gray-400 mt-2">Your earnings will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((txn, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-4 shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`${txn.type === "credit" ? "bg-green-100" : "bg-red-100"} p-3 rounded-xl`}>
                      <svg
                        className={`w-5 h-5 ${txn.type === "credit" ? "text-green-600" : "text-red-600"}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        {txn.type === "credit" ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        )}
                      </svg>
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{txn.description}</p>
                      <p className="text-sm text-gray-500">{txn.date}</p>
                    </div>
                  </div>
                  <p className={`text-xl font-black ${txn.type === "credit" ? "text-green-600" : "text-red-600"}`}>
                    {txn.type === "credit" ? "+" : "-"}${Math.abs(txn.amount).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-screen w-full bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 overflow-y-auto" style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))' }}>
      {/* Diamond Header */}
      <div className={`relative px-6 pb-8 bg-gradient-to-br ${status.gradient} overflow-hidden flex-shrink-0 safe-area-top`}>
        {/* Diamond sparkle effect */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-4 left-8 w-3 h-3 bg-white rounded-full animate-pulse"></div>
          <div
            className="absolute top-12 right-12 w-2 h-2 bg-white rounded-full animate-pulse"
            style={{ animationDelay: "0.3s" }}
          ></div>
          <div
            className="absolute bottom-8 left-16 w-2 h-2 bg-white rounded-full animate-pulse"
            style={{ animationDelay: "0.6s" }}
          ></div>
          <div
            className="absolute top-1/2 right-8 w-4 h-4 bg-white rounded-full animate-pulse"
            style={{ animationDelay: "0.9s" }}
          ></div>
        </div>

        {/* Geometric diamond pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <polygon points="50,10 90,50 50,90 10,50" fill="white" opacity="0.3" />
            <polygon points="50,20 80,50 50,80 20,50" fill="white" opacity="0.2" />
          </svg>
        </div>

        <div className="relative flex items-center justify-between mb-4">
          <button
            onClick={() => {
              if (onOpenMenu) {
                onOpenMenu();
              } else {
                toast.info("Menu coming soon.");
              }
            }}
            className="text-gray-700"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-gray-900 text-2xl font-bold">Account</h1>
          <button
            onClick={() => {
              if (onOpenNotifications) {
                onOpenNotifications();
              } else {
                toast.info("Notifications coming soon.");
              }
            }}
            className="text-gray-700"
          >
            <Bell className="w-7 h-7" />
          </button>
        </div>

        {/* Profile Section */}
        <div className="relative mb-4">
          <div className="text-center">
            <h2 className="text-3xl font-black text-gray-900 mb-3">{driverName}</h2>

            {/* Status Badge */}
            <div className="relative inline-block">
              <div className="bg-white/50 backdrop-blur-sm px-6 py-3 rounded-2xl border-2 border-white shadow-lg">
                <span className="text-gray-900 text-xl font-black">{status.name}</span>
              </div>

              {/* Badge Icon - Bottom Right Corner */}
              <div className="absolute -bottom-2 -right-2 z-10">
                {/* Diamond Icon */}
                {status.color === "diamond" && (
                  <div className="relative w-10 h-10">
                    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl">
                      <defs>
                        <linearGradient id="diamondGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" style={{ stopColor: "#a5f3fc", stopOpacity: 1 }} />
                          <stop offset="50%" style={{ stopColor: "#67e8f9", stopOpacity: 1 }} />
                          <stop offset="100%" style={{ stopColor: "#22d3ee", stopOpacity: 1 }} />
                        </linearGradient>
                        <radialGradient id="diamondShine">
                          <stop offset="0%" style={{ stopColor: "#ffffff", stopOpacity: 0.8 }} />
                          <stop offset="100%" style={{ stopColor: "#ffffff", stopOpacity: 0 }} />
                        </radialGradient>
                      </defs>
                      <polygon
                        points="50,10 90,40 70,90 30,90 10,40"
                        fill="url(#diamondGrad)"
                        stroke="#0891b2"
                        strokeWidth="2"
                      />
                      <polygon points="50,10 70,40 50,50 30,40" fill="url(#diamondShine)" opacity="0.6" />
                      <line x1="50" y1="10" x2="50" y2="50" stroke="#ffffff" strokeWidth="1" opacity="0.4" />
                      <line x1="10" y1="40" x2="50" y2="50" stroke="#0e7490" strokeWidth="1" opacity="0.3" />
                      <line x1="90" y1="40" x2="50" y2="50" stroke="#0e7490" strokeWidth="1" opacity="0.3" />
                    </svg>
                  </div>
                )}

                {/* Platinum Bar */}
                {status.color === "platinum" && (
                  <div className="relative w-10 h-10 flex items-center justify-center">
                    <svg viewBox="0 0 60 40" className="w-full drop-shadow-2xl">
                      <defs>
                        <linearGradient id="platinumGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" style={{ stopColor: "#f3f4f6", stopOpacity: 1 }} />
                          <stop offset="50%" style={{ stopColor: "#d1d5db", stopOpacity: 1 }} />
                          <stop offset="100%" style={{ stopColor: "#9ca3af", stopOpacity: 1 }} />
                        </linearGradient>
                        <linearGradient id="platinumShine" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" style={{ stopColor: "#ffffff", stopOpacity: 0 }} />
                          <stop offset="50%" style={{ stopColor: "#ffffff", stopOpacity: 0.8 }} />
                          <stop offset="100%" style={{ stopColor: "#ffffff", stopOpacity: 0 }} />
                        </linearGradient>
                      </defs>
                      <rect
                        x="5"
                        y="8"
                        width="50"
                        height="24"
                        rx="2"
                        fill="url(#platinumGrad)"
                        stroke="#6b7280"
                        strokeWidth="1"
                      />
                      <rect x="5" y="8" width="50" height="8" rx="2" fill="url(#platinumShine)" opacity="0.5" />
                    </svg>
                  </div>
                )}

                {/* Gold Bar */}
                {status.color === "gold" && (
                  <div className="relative w-10 h-10 flex items-center justify-center">
                    <svg viewBox="0 0 60 40" className="w-full drop-shadow-2xl">
                      <defs>
                        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" style={{ stopColor: "#fde047", stopOpacity: 1 }} />
                          <stop offset="50%" style={{ stopColor: "#facc15", stopOpacity: 1 }} />
                          <stop offset="100%" style={{ stopColor: "#eab308", stopOpacity: 1 }} />
                        </linearGradient>
                        <linearGradient id="goldShine" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" style={{ stopColor: "#ffffff", stopOpacity: 0 }} />
                          <stop offset="50%" style={{ stopColor: "#ffffff", stopOpacity: 0.9 }} />
                          <stop offset="100%" style={{ stopColor: "#ffffff", stopOpacity: 0 }} />
                        </linearGradient>
                      </defs>
                      <rect
                        x="5"
                        y="8"
                        width="50"
                        height="24"
                        rx="2"
                        fill="url(#goldGrad)"
                        stroke="#ca8a04"
                        strokeWidth="1"
                      />
                      <rect x="5" y="8" width="50" height="8" rx="2" fill="url(#goldShine)" opacity="0.6" />
                      <rect x="10" y="14" width="40" height="2" fill="#ffffff" opacity="0.3" />
                    </svg>
                  </div>
                )}

                {/* Silver Nugget */}
                {status.color === "silver" && (
                  <div className="relative w-10 h-10 flex items-center justify-center">
                    <svg viewBox="0 0 50 50" className="w-full drop-shadow-2xl">
                      <defs>
                        <radialGradient id="silverGrad">
                          <stop offset="0%" style={{ stopColor: "#f9fafb", stopOpacity: 1 }} />
                          <stop offset="50%" style={{ stopColor: "#d1d5db", stopOpacity: 1 }} />
                          <stop offset="100%" style={{ stopColor: "#9ca3af", stopOpacity: 1 }} />
                        </radialGradient>
                        <radialGradient id="silverShine">
                          <stop offset="0%" style={{ stopColor: "#ffffff", stopOpacity: 1 }} />
                          <stop offset="100%" style={{ stopColor: "#ffffff", stopOpacity: 0 }} />
                        </radialGradient>
                      </defs>
                      <ellipse
                        cx="25"
                        cy="28"
                        rx="18"
                        ry="16"
                        fill="url(#silverGrad)"
                        stroke="#6b7280"
                        strokeWidth="1"
                      />
                      <ellipse cx="20" cy="22" rx="8" ry="7" fill="url(#silverShine)" opacity="0.5" />
                      <path d="M 15 28 Q 25 20, 35 28" fill="none" stroke="#ffffff" strokeWidth="1" opacity="0.3" />
                    </svg>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 text-sm mt-4">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-600" fill="currentColor" />
                <span className="font-bold text-gray-900">{driverRating}</span>
              </div>
              <span className="text-gray-700 font-semibold">{totalDeliveries} feeds</span>
              <span className="text-gray-700">Since {memberSince}</span>
            </div>
          </div>
        </div>

        {/* Points Progress */}
        <div className="relative bg-white/30 backdrop-blur-md rounded-2xl p-4 border border-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-900 font-bold text-sm">Status Points</span>
            <span className="text-gray-900 font-black text-lg">{driverPoints} pts</span>
          </div>
          <div className="relative h-3 bg-white/40 rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full"
              style={{ width: "100%" }}
            >
              <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
            </div>
          </div>
          <p className="text-gray-800 text-xs mt-2 font-semibold">
            🎉 You've reached Diamond status! Keep being amazing!
          </p>
        </div>
      </div>

      {/* Menu Items */}
      <div className="px-6 py-6 space-y-3">
        {menuItems.map((item, idx) => {
          const colors = getMenuItemColors(item.color);
          const Icon = item.icon;
          return (
            <button
              key={idx}
              onClick={item.action || (() => {})}
              className="w-full bg-white rounded-2xl p-4 shadow-md hover:shadow-lg transition-all active:scale-98 flex items-center gap-4"
            >
              <div className={`${colors.bg} p-3 rounded-xl`}>
                <Icon className={`w-6 h-6 ${colors.icon}`} />
              </div>
              <div className="flex-1 text-left">
                <p className="font-bold text-gray-900 text-lg">{item.label}</p>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
              {item.badge && (
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold">
                  {item.badge}
                </span>
              )}
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          );
        })}

        {/* Sign Out Button */}
        <button
          onClick={handleSignOut}
          className="w-full bg-red-50 rounded-2xl p-4 shadow-md hover:shadow-lg transition-all active:scale-98 flex items-center gap-4 border-2 border-red-200"
        >
          <div className="bg-red-100 p-3 rounded-xl">
            <LogOut className="w-6 h-6 text-red-600" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-bold text-red-600 text-lg">Sign Out</p>
            <p className="text-sm text-red-500">Log out of your account</p>
          </div>
          <ChevronRight className="w-5 h-5 text-red-400" />
        </button>
      </div>

      <div className="h-24"></div>
    </div>
  );
};

export default FeederAccountPage;
