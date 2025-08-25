import React from 'react';
import { Home, Calendar, User, Star, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

type TabType = 'main' | 'schedule' | 'account' | 'ratings' | 'earnings';

interface BottomNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const tabs = [
  { id: 'main' as const, label: 'Main', icon: Home },
  { id: 'schedule' as const, label: 'Schedule', icon: Calendar },
  { id: 'account' as const, label: 'Account', icon: User },
  { id: 'ratings' as const, label: 'Ratings', icon: Star },
  { id: 'earnings' as const, label: 'Earnings', icon: DollarSign },
];

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onTabChange
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 h-16">
      <div className="flex h-full">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex-1 flex flex-col items-center justify-center py-1 px-1 h-full transition-smooth",
                isActive 
                  ? "text-primary bg-primary/5" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 mb-1" />
              <span className="text-[10px] font-medium leading-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};