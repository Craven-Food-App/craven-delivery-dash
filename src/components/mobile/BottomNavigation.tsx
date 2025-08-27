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
    <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border/30 z-50 h-20 safe-bottom">
      <div className="flex h-full px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex-1 flex flex-col items-center justify-center py-2 px-1 h-full transition-all duration-200 rounded-xl mx-1 my-2",
                isActive 
                  ? "text-primary bg-primary/10 scale-105" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Icon className={cn("mb-1 transition-all", isActive ? "h-6 w-6" : "h-5 w-5")} />
              <span className={cn("text-xs font-medium leading-tight", isActive ? "text-primary" : "")}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};