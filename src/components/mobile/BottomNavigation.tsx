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
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
      <div className="flex">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex-1 flex flex-col items-center justify-center py-2 px-1 min-h-[60px] transition-smooth",
                isActive 
                  ? "text-primary bg-primary/5" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};