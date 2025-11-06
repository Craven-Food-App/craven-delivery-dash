import React from 'react';

interface GlassmorphicCardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  hover?: boolean;
}

export const GlassmorphicCard: React.FC<GlassmorphicCardProps> = ({ 
  children, 
  className = '', 
  style = {},
  hover = true 
}) => {
  return (
    <div
      className={`glassmorphic-card ${className}`}
      style={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.1)',
        padding: '24px',
        transition: hover ? 'all 0.3s ease' : 'none',
        ...style,
      }}
      onMouseEnter={(e) => {
        if (hover) {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 12px 40px 0 rgba(0, 0, 0, 0.15)';
        }
      }}
      onMouseLeave={(e) => {
        if (hover) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 8px 32px 0 rgba(0, 0, 0, 0.1)';
        }
      }}
    >
      {children}
    </div>
  );
};

