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