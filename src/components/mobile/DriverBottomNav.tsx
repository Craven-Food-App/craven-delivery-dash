import React from 'react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

type DriverTabType = 'home' | 'schedule' | 'earnings' | 'notifications' | 'account';

interface DriverBottomNavProps {
  activeTab: DriverTabType;
  onTabChange: (tab: DriverTabType) => void;
  notificationCount?: number;
}

const tabs = [
  { id: 'home' as const, label: 'Home', icon: '/app-home.png' },
  { id: 'schedule' as const, label: 'Schedule', icon: '/app-schedule.png' },
  { id: 'earnings' as const, label: 'Earnings', icon: '/app-earnings.png' },
  { id: 'notifications' as const, label: 'Alerts', icon: '/app-alerts.png' },
  { id: 'account' as const, label: 'Account', icon: '/app-account.png' },
];

export const DriverBottomNav: React.FC<DriverBottomNavProps> = ({
  activeTab,
  onTabChange,
  notificationCount = 0
}) => {
  const isMobile = useIsMobile();

  if (!isMobile) return null;

  return (
    <>
      {/* Bottom Navigation - Extends to bottom edge on PWA */}
      <div 
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 shadow-lg"
        style={{ 
          height: 'calc(5rem + env(safe-area-inset-bottom, 0px))',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)'
        }}
      >
        <div className="flex h-20">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const hasNotification = tab.id === 'notifications' && notificationCount > 0;
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center py-2 px-1 h-full transition-all duration-200 relative",
                  isActive 
                    ? "text-orange-600" 
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                <div className="relative">
                  <img 
                    src={tab.icon} 
                    alt={tab.label}
                    className={cn(
                      "h-6 w-6 mb-1.5 transition-all duration-200",
                      isActive ? "opacity-100" : "opacity-60"
                    )}
                  />
                  {hasNotification && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {notificationCount > 9 ? '9+' : notificationCount}
                      </span>
                    </div>
                  )}
                </div>
                <span className={cn(
                  "text-xs font-medium leading-tight",
                  isActive ? "text-orange-600 font-semibold" : "text-slate-500"
                )}>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom padding spacer for content - accounts for extended nav */}
      <div style={{ height: 'calc(5rem + env(safe-area-inset-bottom, 0px))' }} />
    </>
  );
};
