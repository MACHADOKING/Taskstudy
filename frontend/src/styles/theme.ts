const lightColors = {
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  primaryLight: '#3B82F6',
  secondary: '#10B981',
  danger: '#DC2626',
  warning: '#F59E0B',
  info: '#0EA5E9',
  
  text: '#111827',
  textLight: '#4B5563',
  textMuted: '#9CA3AF',
  
  background: '#FFFFFF',
  white: '#FFFFFF',
  border: '#D1D5DB',
  
  success: '#059669',
  successDark: '#047857',
  error: '#DC2626',
  errorDark: '#B91C1C',
  lightGray: '#F9FAFB',
  infoDark: '#0284C7',
  
  // Priority colors
  priorityLow: '#6B7280',
  priorityMedium: '#F59E0B',
  priorityHigh: '#DC2626',
  
  // Status colors
  statusPending: '#F59E0B',
  statusCompleted: '#059669',
  
  // Accessibility colors
  accent: '#F97316',
  backgroundLight: '#F8FAFC',
  
  // Additional colors for better contrast
  textSecondary: '#6B7280',
  backgroundSecondary: '#F3F4F6',
  borderLight: '#E5E7EB',
  hover: '#F9FAFB',
};

const darkColors = {
  primary: '#3B82F6',
  primaryDark: '#2563EB',
  primaryLight: '#60A5FA',
  secondary: '#60D888',
  danger: '#F75C4C',
  warning: '#FFB332',
  info: '#4AA8E8',
  
  text: '#E4E6EA',
  textLight: '#B0B3B8',
  textMuted: '#8A8D92',
  
  background: '#18191A',
  white: '#242526',
  border: '#3A3B3C',
  
  success: '#42B883',
  successDark: '#369870',
  error: '#F75C4C',
  errorDark: '#E74C3C',
  lightGray: '#3A3B3C',
  infoDark: '#4AA8E8',
  
  // Priority colors
  priorityLow: '#B8C2CC',
  priorityMedium: '#FFB332',
  priorityHigh: '#F75C4C',
  
  // Status colors
  statusPending: '#FFB332',
  statusCompleted: '#42B883',
  
  // Accessibility colors
  accent: '#FF8C65',
  backgroundLight: '#2C2D2E',
  
  // Additional colors for better contrast
  textSecondary: '#B0B3B8',
  backgroundSecondary: '#2C2D2E',
  borderLight: '#3A3B3C',
  hover: '#3A3B3C',
};

export const getTheme = (mode: 'light' | 'dark') => ({
  colors: mode === 'light' ? lightColors : darkColors,
  mode,
  
  shadows: {
    small: mode === 'light' 
      ? '0 2px 4px rgba(0, 0, 0, 0.1)' 
      : '0 2px 4px rgba(0, 0, 0, 0.3)',
    medium: mode === 'light' 
      ? '0 4px 8px rgba(0, 0, 0, 0.1)' 
      : '0 4px 8px rgba(0, 0, 0, 0.3)',
    large: mode === 'light' 
      ? '0 8px 16px rgba(0, 0, 0, 0.1)' 
      : '0 8px 16px rgba(0, 0, 0, 0.3)',
  },
  
  borderRadius: {
    small: '4px',
    medium: '8px',
    large: '12px',
    round: '50%',
  },
  
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
  },
  
  breakpoints: {
    mobile: '480px',
    tablet: '768px',
    desktop: '1024px',
    wide: '1280px',
  },
});

// Default light theme for backward compatibility
export const theme = getTheme('light');

export type Theme = ReturnType<typeof getTheme>;