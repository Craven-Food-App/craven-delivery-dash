import { ThemeConfig } from 'antd';

// Crave'n Driver theme - burnt orange branding
export const cravenDriverTheme: ThemeConfig = {
  token: {
    // Crave'n burnt orange as primary color
    colorPrimary: '#ff7a00',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#f5222d',
    colorInfo: '#1890ff',
    
    // Typography
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontSize: 14,
    fontSizeHeading1: 36,
    fontSizeHeading2: 28,
    fontSizeHeading3: 24,
    fontSizeHeading4: 20,
    fontSizeHeading5: 16,
    
    // Layout
    borderRadius: 8,
    
    // Colors for components
    colorLink: '#ff7a00',
    colorLinkHover: '#ff9f40',
    colorLinkActive: '#e66d00',
  },
  components: {
    Card: {
      borderRadiusLG: 16,
      paddingLG: 24,
    },
    Button: {
      borderRadius: 8,
      controlHeight: 40,
      fontWeight: 600,
      primaryColor: '#ffffff',
    },
    Input: {
      borderRadius: 8,
      controlHeight: 40,
    },
    Form: {
      labelFontSize: 14,
      labelColor: '#262626',
    },
    Alert: {
      borderRadiusLG: 8,
    },
  },
};

// Professional executive theme for board portal
export const executiveTheme: ThemeConfig = {
  token: {
    // Corporate colors
    colorPrimary: '#1e3a8a', // Executive Navy
    colorSuccess: '#059669',
    colorWarning: '#f59e0b',
    colorError: '#dc2626',
    colorInfo: '#3b82f6',
    
    // Typography
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontSize: 14,
    fontSizeHeading1: 32,
    fontSizeHeading2: 28,
    fontSizeHeading3: 24,
    fontSizeHeading4: 20,
    fontSizeHeading5: 16,
    
    // Layout
    borderRadius: 8,
    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    boxShadowSecondary: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    
    // Professional spacing
    paddingLG: 24,
    paddingMD: 16,
    paddingSM: 12,
    paddingXS: 8,
    marginLG: 24,
    marginMD: 16,
    marginSM: 12,
    marginXS: 8,
  },
  components: {
    Card: {
      borderRadiusLG: 12,
      paddingLG: 24,
    },
    Button: {
      borderRadius: 8,
      controlHeight: 40,
      fontWeight: 600,
    },
    Table: {
      borderRadius: 8,
      headerBg: '#f8fafc',
      headerColor: '#475569',
      headerSplitColor: 'transparent',
    },
    Statistic: {
      titleFontSize: 14,
      contentFontSize: 28,
    },
  },
};

// Dark mode theme for after-hours use
export const executiveDarkTheme: ThemeConfig = {
  ...executiveTheme,
  token: {
    ...executiveTheme.token,
    colorPrimary: '#3b82f6',
    colorBgContainer: '#1e293b',
    colorBgElevated: '#334155',
    colorText: '#f1f5f9',
    colorTextSecondary: '#cbd5e1',
    colorBorder: '#475569',
  },
};

