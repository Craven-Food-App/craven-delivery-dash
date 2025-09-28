import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PopularTimesChartProps {
  className?: string;
}

export const PopularTimesChart: React.FC<PopularTimesChartProps> = ({ className = '' }) => {
  // Mock data for popular delivery times (0-100 scale)
  const timeData = [
    { time: '6a', value: 25 },
    { time: '9a', value: 45 },
    { time: '12p', value: 85 },
    { time: '3p', value: 60 },
    { time: '6p', value: 95 },
    { time: '9p', value: 75 },
  ];

  const maxValue = Math.max(...timeData.map(d => d.value));

  return (
    <div className={`bg-card rounded-2xl p-6 shadow-sm border border-border/10 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Popular offer times: Today</h3>
          <p className="text-sm text-muted-foreground">Explore additional days to drive this week.</p>
        </div>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Still Searching Section */}
      <div className="flex items-center justify-between mb-4 w-full">
        <span className="text-sm text-foreground font-medium">Still searching...</span>
        <div className="w-4 h-4">
          <svg className="animate-spin w-full h-full" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
            <path className="opacity-75 text-primary" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      </div>
      
      <div className="flex items-end justify-between h-24 gap-2">
        {timeData.map((data, index) => (
          <div key={data.time} className="flex flex-col items-center flex-1">
            <div 
              className={`w-full rounded-t-sm transition-all duration-300 ${
                index === 4 ? 'bg-primary' : 'bg-muted'
              }`}
              style={{ 
                height: `${(data.value / maxValue) * 100}%`,
                minHeight: '8px'
              }}
            />
            <span className="text-xs text-muted-foreground mt-2 font-medium">
              {data.time}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};