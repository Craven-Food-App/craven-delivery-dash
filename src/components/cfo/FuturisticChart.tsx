import React from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart,
  Legend,
} from 'recharts';
import { GlassmorphicCard } from './GlassmorphicCard';

interface ChartProps {
  data: any[];
  type?: 'line' | 'area' | 'bar' | 'pie' | 'radar' | 'composed';
  title?: string;
  height?: number;
  colors?: string[];
  dataKeys?: { [key: string]: string };
}

const defaultColors = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
];

export const FuturisticChart: React.FC<ChartProps> = ({
  data,
  type = 'line',
  title,
  height = 300,
  colors = defaultColors,
  dataKeys = {},
}) => {
  const renderChart = () => {
    switch (type) {
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors[0]} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={colors[0]} stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors[1]} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={colors[1]} stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
              <XAxis dataKey="month" stroke="rgba(255, 255, 255, 0.7)" />
              <YAxis stroke="rgba(255, 255, 255, 0.7)" />
              <Tooltip
                contentStyle={{
                  background: 'rgba(0, 0, 0, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
              <Legend />
              <Area type="monotone" dataKey={dataKeys.revenue || 'Revenue'} stroke={colors[0]} fillOpacity={1} fill="url(#colorRevenue)" />
              <Area type="monotone" dataKey={dataKeys.profit || 'Profit'} stroke={colors[1]} fillOpacity={1} fill="url(#colorProfit)" />
            </AreaChart>
          </ResponsiveContainer>
        );
      
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
              <XAxis dataKey="month" stroke="rgba(255, 255, 255, 0.7)" />
              <YAxis stroke="rgba(255, 255, 255, 0.7)" />
              <Tooltip
                contentStyle={{
                  background: 'rgba(0, 0, 0, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
              <Legend />
              <Bar dataKey={dataKeys.revenue || 'Revenue'} fill={colors[0]} radius={[8, 8, 0, 0]} />
              <Bar dataKey={dataKeys.expenses || 'Expenses'} fill={colors[1]} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: 'rgba(0, 0, 0, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        );
      
      case 'radar':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <RadarChart data={data}>
              <PolarGrid stroke="rgba(255, 255, 255, 0.2)" />
              <PolarAngleAxis dataKey="subject" stroke="rgba(255, 255, 255, 0.7)" />
              <PolarRadiusAxis stroke="rgba(255, 255, 255, 0.2)" />
              <Radar name="Value" dataKey="value" stroke={colors[0]} fill={colors[0]} fillOpacity={0.6} />
              <Tooltip
                contentStyle={{
                  background: 'rgba(0, 0, 0, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        );
      
      case 'composed':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
              <XAxis dataKey="month" stroke="rgba(255, 255, 255, 0.7)" />
              <YAxis yAxisId="left" stroke="rgba(255, 255, 255, 0.7)" />
              <YAxis yAxisId="right" orientation="right" stroke="rgba(255, 255, 255, 0.7)" />
              <Tooltip
                contentStyle={{
                  background: 'rgba(0, 0, 0, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
              <Legend />
              <Area yAxisId="left" type="monotone" dataKey={dataKeys.revenue || 'Revenue'} fill={colors[0]} fillOpacity={0.6} stroke={colors[0]} />
              <Bar yAxisId="right" dataKey={dataKeys.expenses || 'Expenses'} fill={colors[1]} radius={[8, 8, 0, 0]} />
              <Line yAxisId="left" type="monotone" dataKey={dataKeys.profit || 'Profit'} stroke={colors[2]} strokeWidth={3} />
            </ComposedChart>
          </ResponsiveContainer>
        );
      
      default: // line
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
              <XAxis dataKey="month" stroke="rgba(255, 255, 255, 0.7)" />
              <YAxis stroke="rgba(255, 255, 255, 0.7)" />
              <Tooltip
                contentStyle={{
                  background: 'rgba(0, 0, 0, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
              <Legend />
              <Line type="monotone" dataKey={dataKeys.revenue || 'Revenue'} stroke={colors[0]} strokeWidth={3} dot={{ fill: colors[0], r: 4 }} />
              <Line type="monotone" dataKey={dataKeys.profit || 'Profit'} stroke={colors[1]} strokeWidth={3} dot={{ fill: colors[1], r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <GlassmorphicCard>
      {title && (
        <h3 style={{ 
          color: 'rgba(255, 255, 255, 0.95)', 
          fontSize: '20px', 
          fontWeight: 700, 
          marginBottom: '20px',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
        }}>
          {title}
        </h3>
      )}
      {renderChart()}
    </GlassmorphicCard>
  );
};

