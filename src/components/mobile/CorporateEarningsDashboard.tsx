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
    <div className="h-screen w-full bg-gradient-to-b from-red-600 via-orange-600 to-orange-500 overflow-y-auto" style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))' }}>
      {/* Header */}
      <div className="px-5 pb-3 flex items-center justify-between flex-shrink-0 safe-area-top">
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
        <h1 className="text-white text-xl font-bold">Earnings</h1>
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
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/>
          </svg>
        </button>
      </div>

      {/* ON FIRE Section */}
      <div className="px-5 mb-3">
        <div className="relative overflow-hidden">
          {/* Large ON FIRE Text */}
          <div className="relative mb-2">
            <h2 className="text-4xl font-black text-orange-400 leading-none tracking-tighter" style={{
              textShadow: '0 2px 0 rgba(0,0,0,0.1)',
              WebkitTextStroke: '1px rgba(255,255,255,0.1)'
            }}>
              ON FIRE
            </h2>
            <div className="absolute top-1 right-3 w-12 h-16 bg-gradient-to-b from-red-400 to-transparent rounded-full blur-2xl opacity-60"></div>
          </div>
          
          <p className="text-white text-sm font-semibold mb-4">
            {cravingLevel > 70 ? 'Cravings spike active!' : 'Normal activity'}
          </p>
          
          {/* Craving Circle, Graphs, and Buttons */}
          <div className="flex items-start gap-3 mb-4">
            {/* Circular Progress */}
            <div className="relative w-28 h-28 flex-shrink-0">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="56" cy="56" r="50" fill="none" stroke="rgba(139, 0, 0, 0.3)" strokeWidth="12"/>
                <circle 
                  cx="56" 
                  cy="56" 
                  r="50" 
                  fill="none" 
                  stroke="url(#gradient)" 
                  strokeWidth="12" 
                  strokeDasharray="314" 
                  strokeDashoffset={314 - (314 * cravingLevel / 100)} 
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FCD34D" />
                    <stop offset="100%" stopColor="#F59E0B" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white text-xs font-bold">CRAVING</span>
              </div>
            </div>
            
            {/* Earnings Graph - Two bars per day */}
            <div className="flex-1">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2">
                <p className="text-white text-[10px] font-semibold mb-1">Daily Earnings</p>
                <div className="flex items-end gap-0.5 h-16">
                  {weeklyData.length > 0 ? weeklyData.map((day, idx) => {
                    const maxValue = Math.max(50, ...weeklyData.flatMap(d => [d.payments, d.tips])); // Dynamic max
                    const paymentsHeight = maxValue > 0 ? (day.payments / maxValue) * 100 : 0;
                    const tipsHeight = maxValue > 0 ? (day.tips / maxValue) * 100 : 0;
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-0.5">
                        <div className="w-full flex gap-0.5 items-end justify-center">
                          {/* Payment bar */}
                          <div 
                            className="flex-1 bg-gradient-to-t from-orange-500 to-yellow-400 rounded-t min-h-[2px]"
                            style={{ height: `${Math.max(paymentsHeight, 2)}%` }}
                          />
                          {/* Tips bar */}
                          <div 
                            className="flex-1 bg-gradient-to-t from-yellow-400 to-orange-300 rounded-t min-h-[2px]"
                            style={{ height: `${Math.max(tipsHeight, 2)}%` }}
                          />
                        </div>
                        <span className="text-white text-[8px] mt-0.5">{['S', 'M', 'T', 'W', 'T', 'F', 'S'][idx]}</span>
                      </div>
                    );
                  }) : (
                    // Loading or empty state
                    Array.from({ length: 7 }).map((_, idx) => (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-0.5">
                        <div className="w-full flex gap-0.5 items-end justify-center h-full">
                          <div className="flex-1 bg-white/20 rounded-t min-h-[2px]" />
                          <div className="flex-1 bg-white/20 rounded-t min-h-[2px]" />
                        </div>
                        <span className="text-white text-[8px] mt-0.5">{['S', 'M', 'T', 'W', 'T', 'F', 'S'][idx]}</span>
                      </div>
                    ))
                  )}
                </div>
                {/* Legend */}
                <div className="flex items-center justify-center gap-3 mt-1.5">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-gradient-to-t from-orange-500 to-yellow-400 rounded"></div>
                    <span className="text-white text-[8px]">Payments</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-gradient-to-t from-yellow-400 to-orange-300 rounded"></div>
                    <span className="text-white text-[8px]">Tips</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Action Buttons - Side by Side */}
          <div className="flex gap-2 mb-4">
            <button className="flex-1 bg-white rounded-full py-2 px-4 font-bold text-red-700 text-xs shadow-lg">
              Go Online
            </button>
            <button className="flex-1 bg-white rounded-full py-2 px-4 font-bold text-red-700 text-xs shadow-lg">
              Payout Req
            </button>
          </div>
        </div>
      </div>

      {/* UP FOR GRABS */}
      {availableOrder && (
        <div className="px-5 mb-3">
          <h3 className="text-white text-sm font-bold mb-2 tracking-wide">UP FOR GRABS</h3>
          <div className="bg-orange-50 rounded-2xl p-4 relative overflow-hidden shadow-xl">
            {/* Decorative blob */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-red-400 to-orange-400 rounded-bl-full opacity-80"></div>
            
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-orange-800 text-xs font-semibold mb-0.5">{availableOrder.eta} ETA</p>
                <h4 className="text-2xl font-black text-gray-900 mb-0.5">${availableOrder.pay.toFixed(2)} Pay</h4>
                <p className="text-orange-800 text-xs font-semibold">{availableOrder.distance}</p>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <div className="bg-red-600 rounded-full px-3 py-1 flex items-center gap-1 shadow-lg">
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                  <span className="text-white text-xs font-bold">LIVE</span>
                </div>
                {cravingLevel > 70 && (
                  <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl px-3 py-1.5 shadow-lg rotate-3">
                    <span className="text-red-800 text-xs font-black italic">ON FIRE</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EARNINGS SNAPSHOT */}
      <div className="px-5 mb-3">
        <h3 className="text-white text-sm font-bold mb-2 tracking-wide">EARNINGS SNAPSHOT</h3>
        <div className="bg-orange-50 rounded-2xl p-4 shadow-xl">
          <h4 className="text-2xl font-black text-gray-900 mb-0.5">${earnings.today.toFixed(2)}</h4>
          <p className="text-orange-800 text-xs font-semibold">Today</p>
        </div>
      </div>

      {/* TODAY'S FEED FLOW */}
      <div className="px-5" style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))' }}>
        <h3 className="text-white text-sm font-bold mb-2 tracking-wide">Today's FEED FLOW</h3>
        <div className="grid grid-cols-3 gap-0 text-center">
          <div className="border-r border-white/30 py-2">
            <p className="text-3xl font-black text-white mb-0.5">{earnings.todayDeliveries}</p>
            <p className="text-white text-[10px] font-semibold">Delivered</p>
          </div>
          <div className="border-r border-white/30 py-2">
            <p className="text-3xl font-black text-white mb-0.5">{earnings.todayAcceptance}%</p>
            <p className="text-white text-[10px] font-semibold">Acceptance</p>
          </div>
          <div className="py-2">
            <p className="text-3xl font-black text-white mb-0.5">${earnings.todayTips}</p>
            <p className="text-white text-[10px] font-semibold">Tips</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CorporateEarningsDashboard;
