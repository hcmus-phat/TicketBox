/**
 * Theme Configuration
 * TicketBox Check-in Mobile App
 */

export const COLORS = {
  primary: '#12B981',
  primaryLight: '#7DD3BC',
  primaryDark: '#047857',

  success: '#22C55E',
  successLight: '#86EFAC',
  successDark: '#15803D',

  error: '#F43F5E',
  errorLight: '#FDA4AF',
  errorDark: '#BE123C',

  warning: '#F59E0B',
  warningLight: '#FCD34D',
  warningDark: '#B45309',

  info: '#38BDF8',

  background: '#09110F',
  backgroundSecondary: '#0E1916',
  surface: '#14211E',
  surfaceLight: '#1B2C28',
  surfaceRaised: '#233832',

  text: '#F4FBF8',
  textSecondary: '#B7C9C2',
  textMuted: '#789189',

  border: '#243A35',
  borderLight: '#36544D',

  online: '#22C55E',
  offline: '#F43F5E',
} as const;

export const FONT_SIZES = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 22,
  xxxl: 28,
  title: 34,
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
  massive: 64,
} as const;

export const BORDER_RADIUS = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  round: 9999,
} as const;
