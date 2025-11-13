import React, { useState } from 'react';
import { toast } from 'sonner';

type CorporateEarningsDashboardProps = {
  onOpenMenu?: () => void;
  onOpenNotifications?: () => void;
};

const CorporateEarningsDashboard: React.FC<CorporateEarningsDashboardProps> = ({
  onOpenMenu,
  onOpenNotifications
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  
  const earnings = {
    today: 124.40,
    week: 847.20,
    todayDeliveries: 12,
    todayAcceptance: 92,
    todayTips: 40
  };

  return (
    <div className="h-screen w-full bg-gradient-to-b from-red-600 via-orange-600 to-orange-500 overflow-y-auto pb-20 safe-area-top">
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1rem)' }}>
        <button 
          onClick={() => {
            if (onOpenMenu) {
              onOpenMenu();
            } else {
              toast.info('Menu coming soon.');
            }
          }}
          className="text-white text-lg"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 className="text-white text-2xl font-bold">Earnings</h1>
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
          <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/>
          </svg>
        </button>
      </div>

      {/* ON FIRE Section */}
      <div className="px-6 mb-4">
        <div className="relative overflow-hidden">
          {/* Large ON FIRE Text */}
          <div className="relative mb-3">
            <h2 className="text-5xl font-black text-orange-400 leading-none tracking-tighter" style={{
              textShadow: '0 2px 0 rgba(0,0,0,0.1)',
              WebkitTextStroke: '1px rgba(255,255,255,0.1)'
            }}>
              ON FIRE
            </h2>
            <div className="absolute top-2 right-4 w-16 h-20 bg-gradient-to-b from-red-400 to-transparent rounded-full blur-2xl opacity-60"></div>
          </div>
          
          <p className="text-white text-base font-semibold mb-6">Cravings spike in 12m</p>
          
          {/* Craving Circle and Buttons */}
          <div className="flex items-center gap-4 mb-6">
            {/* Circular Progress */}
            <div className="relative w-36 h-36 flex-shrink-0">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="72" cy="72" r="64" fill="none" stroke="rgba(139, 0, 0, 0.3)" strokeWidth="16"/>
                <circle cx="72" cy="72" r="64" fill="none" stroke="url(#gradient)" strokeWidth="16" strokeDasharray="402" strokeDashoffset="120" strokeLinecap="round"/>
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FCD34D" />
                    <stop offset="100%" stopColor="#F59E0B" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white text-sm font-bold">CRAVING</span>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex-1 space-y-2">
              <button className="w-full bg-white rounded-full py-2.5 px-5 font-bold text-red-700 text-sm shadow-lg">
                Go Online
              </button>
              <button className="w-full bg-white rounded-full py-2.5 px-5 font-bold text-red-700 text-sm shadow-lg">
                Payout Req
              </button>
              <button className="w-full bg-red-900 rounded-full py-2.5 px-5 font-bold text-white text-sm shadow-lg">
                Start Shift
              </button>
            </div>
          </div>
        </div>
                </div>

      {/* UP FOR GRABS */}
      <div className="px-6 mb-4">
        <h3 className="text-white text-base font-bold mb-3 tracking-wide">UP FOR GRABS</h3>
        <div className="bg-orange-50 rounded-3xl p-5 relative overflow-hidden shadow-xl">
          {/* Decorative blob */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-red-400 to-orange-400 rounded-bl-full opacity-80"></div>
          
          <div className="relative flex items-center justify-between">
                <div>
              <p className="text-orange-800 text-sm font-semibold mb-1">11:48 ETA</p>
              <h4 className="text-3xl font-black text-gray-900 mb-1">$8.90 Pay</h4>
              <p className="text-orange-800 text-sm font-semibold">3.2mi</p>
                </div>
            <div className="flex flex-col items-end gap-2">
              <div className="bg-red-600 rounded-full px-4 py-1.5 flex items-center gap-1 shadow-lg">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <span className="text-white text-sm font-bold">IVE</span>
                  </div>
              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl px-4 py-2 shadow-lg rotate-3">
                <span className="text-red-800 text-sm font-black italic">ON FIRE</span>
                  </div>
                </div>
                          </div>
                        </div>
                      </div>

      {/* EARNINGS SNAPSHOT */}
      <div className="px-6 mb-4">
        <h3 className="text-white text-base font-bold mb-3 tracking-wide">EARNINGS SNAPSHOT</h3>
        <div className="bg-orange-50 rounded-3xl p-6 shadow-xl">
          <h4 className="text-3xl font-black text-gray-900 mb-1">${earnings.today.toFixed(2)}</h4>
          <p className="text-orange-800 text-sm font-semibold">Today</p>
                    </div>
                  </div>

      {/* TODAY'S FEED FLOW */}
      <div className="px-6 pb-24">
        <h3 className="text-white text-base font-bold mb-3 tracking-wide">Today's FEED FLOW</h3>
        <div className="grid grid-cols-3 gap-0 text-center">
          <div className="border-r border-white/30">
            <p className="text-4xl font-black text-white mb-1">{earnings.todayDeliveries}</p>
            <p className="text-white text-xs font-semibold">Delivered</p>
                </div>
          <div className="border-r border-white/30">
            <p className="text-4xl font-black text-white mb-1">{earnings.todayAcceptance}%</p>
            <p className="text-white text-xs font-semibold">Acceptance</p>
          </div>
          <div>
            <p className="text-4xl font-black text-white mb-1">${earnings.todayTips}</p>
            <p className="text-white text-xs font-semibold">Tips</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CorporateEarningsDashboard;
