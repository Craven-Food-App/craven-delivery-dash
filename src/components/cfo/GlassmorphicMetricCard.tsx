import React from 'react';
import { GlassmorphicCard } from './GlassmorphicCard';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface GlassmorphicMetricCardProps {
  title: string;
  value: string;
  change: number;
  changeUnit: string;
  icon: React.ElementType;
  iconColor: string;
  gradient?: string;
}

export const GlassmorphicMetricCard: React.FC<GlassmorphicMetricCardProps> = ({
  title,
  value,
  change,
  changeUnit,
  icon: Icon,
  iconColor,
  gradient,
}) => {
  const isPositive = change >= 0;
  const ChangeIcon = isPositive ? TrendingUp : TrendingDown;
  const changeColor = isPositive ? '#10b981' : '#ef4444';

  return (
    <GlassmorphicCard
      style={{
        background: gradient || 'rgba(255, 255, 255, 0.1)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Animated background gradient */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '100px',
          height: '100px',
          background: `radial-gradient(circle, ${iconColor}20 0%, transparent 70%)`,
          borderRadius: '50%',
          transform: 'translate(30%, -30%)',
        }}
      />
      
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <p style={{ 
              color: 'rgba(255, 255, 255, 0.7)', 
              fontSize: '12px', 
              fontWeight: 600, 
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '8px',
            }}>
              {title}
            </p>
            <h2 style={{ 
              color: 'rgba(255, 255, 255, 0.95)', 
              fontSize: '32px', 
              fontWeight: 800, 
              margin: 0,
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
            }}>
              {value}
            </h2>
          </div>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: `rgba(255, 255, 255, 0.1)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `1px solid ${iconColor}40`,
            }}
          >
            <Icon style={{ color: iconColor, fontSize: '24px' }} />
          </div>
        </div>
        
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          paddingTop: '12px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        }}>
          <ChangeIcon style={{ color: changeColor, width: '16px', height: '16px' }} />
          <span style={{ 
            color: changeColor, 
            fontSize: '14px', 
            fontWeight: 600,
          }}>
            {Math.abs(change).toFixed(1)}%
          </span>
          <span style={{ 
            color: 'rgba(255, 255, 255, 0.6)', 
            fontSize: '12px',
          }}>
            {changeUnit}
          </span>
        </div>
      </div>
    </GlassmorphicCard>
  );
};

