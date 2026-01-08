export const colors = {
  background: '#0F172A', // Slate 900
  surface: '#1E293B',    // Slate 800 - Slightly Lighter for better card contrast on Android
  surfaceHighlight: '#334155', // Slate 700
  primary: '#5EEAD4',    // Teal 300
  primaryMuted: 'rgba(94, 234, 212, 0.1)',
  accent: '#7C83FD',     // Periwinkle/Purple
  text: {
    primary: '#E5E7EB',   // Gray 200
    secondary: '#9CA3AF', // Gray 400
    tertiary: '#6B7280',  // Gray 500
  },
  status: {
    success: '#5EEAD4',   // Matched to primary for consistency
    error: '#FB7185',     // Rose 400 - softer error
    warning: '#FDBA74',   // Orange 300 - softer warning
  },
  border: '#334155',      // Slate 700
} as const;

export type ColorTheme = typeof colors;
