/**
 * Brand colors shared with the web app (src/index.css @theme).
 * Use NativeWind classes for styling; use these constants only where a raw
 * color value is required (navigation tint, status bar, gradients, icons).
 */
export const colors = {
  primary: {
    50: '#edf4fc',
    100: '#d2e3f8',
    200: '#a6c7f0',
    300: '#6fa3e4',
    400: '#3a7ed4',
    500: '#155fbf',
    600: '#0b4f9e',
    700: '#0a4485',
    800: '#0c386b',
    900: '#0d2f57',
    950: '#081d38',
  },
  secondary: {
    500: '#ef7c2c',
    600: '#db6418',
    700: '#b64d14',
  },
  success: { 500: '#10b981', 600: '#059669' },
  warning: { 500: '#d4ae12' },
  danger: { 500: '#e63339', 600: '#e11f28' },
  neutral: {
    50: '#f7f7f8',
    100: '#eeeeef',
    200: '#d9dadc',
    300: '#b8babd',
    400: '#909295',
    500: '#6c6e72',
    600: '#54565a',
    700: '#444649',
    800: '#303234',
    900: '#2b2d2f',
    950: '#1a1b1c',
  },
  accent: '#db6418',
  fg: {
    DEFAULT: '#303234',
    heading: '#0d2f57',
    muted: '#54565a',
    subtle: '#6c6e72',
    inverse: '#ffffff',
  },
  white: '#ffffff',
} as const;
