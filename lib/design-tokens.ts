// Paseo de Caballo Design System Tokens

export const colors = {
  // Primary Brand Colors
  primary: {
    main: '#2D5016', // Sage Green - primary brand color
    light: '#3D6B1F',
    lighter: '#4D7F2B',
    dark: '#1F3810',
    darker: '#142605',
  },

  // Secondary Colors
  secondary: {
    main: '#C9A876', // Warm Tan
    light: '#D9B896',
    lighter: '#E9C8B6',
    dark: '#A88860',
    darker: '#8B6F47', // Earth Brown - accent
  },

  // Neutral Colors
  neutral: {
    cream: '#F5F3F0', // Off-white/Cream
    light: '#FAFAF8',
    lighter: '#FEFDFB',
    gray: '#8A8A8A',
    darkGray: '#5A5A5A',
    charcoal: '#1F1F1F',
    black: '#0A0A0A',
  },

  // Semantic Colors
  success: '#2D7D3B', // Sustainable green
  warning: '#C97D2D', // Earthy orange
  error: '#8B3A3A', // Deep red
  info: '#2D5B7D', // Soft blue

  // Interactive
  link: '#2D5016', // Primary green
  linkHover: '#1F3810', // Darker green
  linkVisited: '#3D6B1F', // Light primary

  // Backgrounds
  bg: {
    primary: '#FAFAF8', // Light cream
    secondary: '#F5F3F0', // Off-white
    tertiary: '#FFFFFF', // Pure white
    dark: '#2D2D2D', // For dark mode
  },
};

export const typography = {
  fontFamily: {
    // Serif fonts for elegant headings
    serif: '"Georgia", "Garamond", "Times New Roman", serif',
    // Clean, refined sans-serif for body and UI
    sans: '"Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif',
    mono: '"Courier New", monospace',
  },

  fontSize: {
    xs: '0.75rem', // 12px
    sm: '0.875rem', // 14px
    base: '1rem', // 16px
    lg: '1.125rem', // 18px
    xl: '1.25rem', // 20px
    '2xl': '1.5rem', // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem', // 48px
  },

  fontWeight: {
    light: 300,
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },

  lineHeight: {
    tight: 1.25,
    normal: 1.6,
    relaxed: 1.75,
    loose: 2,
  },

  letterSpacing: {
    tight: '-0.02em',
    normal: '0em',
    wide: '0.04em',
    wider: '0.08em',
  },

  // Preset text styles with serif for headings
  heading: {
    h1: {
      fontFamily: '"Georgia", "Garamond", serif',
      fontSize: '2.75rem',
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: '-0.01em',
    },
    h2: {
      fontFamily: '"Georgia", "Garamond", serif',
      fontSize: '2.25rem',
      fontWeight: 700,
      lineHeight: 1.3,
      letterSpacing: '0em',
    },
    h3: {
      fontFamily: '"Georgia", "Garamond", serif',
      fontSize: '1.75rem',
      fontWeight: 700,
      lineHeight: 1.35,
      letterSpacing: '0.01em',
    },
    h4: {
      fontFamily: '"Georgia", "Garamond", serif',
      fontSize: '1.375rem',
      fontWeight: 700,
      lineHeight: 1.4,
      letterSpacing: '0.01em',
    },
    h5: {
      fontFamily: '"Georgia", "Garamond", serif',
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.5,
      letterSpacing: '0.02em',
    },
    h6: {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.5,
      letterSpacing: '0.02em',
    },
  },

  body: {
    base: {
      fontSize: '1rem',
      fontWeight: 400,
      lineHeight: 1.6,
      letterSpacing: '0.02em',
    },
    small: {
      fontSize: '0.875rem',
      fontWeight: 400,
      lineHeight: 1.6,
      letterSpacing: '0.01em',
    },
  },
};

export const spacing = {
  0: '0',
  1: '0.25rem', // 4px
  2: '0.5rem', // 8px
  3: '0.75rem', // 12px
  4: '1rem', // 16px
  5: '1.25rem', // 20px
  6: '1.5rem', // 24px
  8: '2rem', // 32px
  10: '2.5rem', // 40px
  12: '3rem', // 48px
  16: '4rem', // 64px
  20: '5rem', // 80px
  24: '6rem', // 96px
};

export const borderRadius = {
  none: '0',
  sm: '0.375rem', // 6px
  base: '0.75rem', // 12px
  md: '1rem', // 16px
  lg: '1.25rem', // 20px
  xl: '1.75rem', // 28px
  '2xl': '2rem', // 32px
  full: '9999px',
};

export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(45, 80, 22, 0.04)',
  base: '0 2px 4px 0 rgba(45, 80, 22, 0.06), 0 1px 2px 0 rgba(45, 80, 22, 0.03)',
  md: '0 4px 8px -2px rgba(45, 80, 22, 0.08), 0 2px 4px -1px rgba(45, 80, 22, 0.04)',
  lg: '0 8px 16px -3px rgba(45, 80, 22, 0.1), 0 4px 6px -2px rgba(45, 80, 22, 0.05)',
  xl: '0 12px 24px -4px rgba(45, 80, 22, 0.12), 0 8px 12px -4px rgba(45, 80, 22, 0.06)',
  '2xl': '0 16px 32px -8px rgba(45, 80, 22, 0.15)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.03)',
};

export const transitions = {
  fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
  base: '250ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow: '350ms cubic-bezier(0.4, 0, 0.2, 1)',
};

// Brand-specific utility classes and presets
export const brandUtilities = {
  // Typography utilities
  serifHeading: 'font-["Georgia","Garamond","Times New Roman",serif]',
  sansBody: 'font-["Segoe UI",system-ui,-apple-system,BlinkMacSystemFont,"Helvetica Neue",Arial,sans-serif]',

  // Text color utilities
  textPrimary: 'text-[#2D5016]',
  textSecondary: 'text-[#C9A876]',
  textAccent: 'text-[#8B6F47]',
  textNeutral: 'text-[#3A3A3A]',
  textMuted: 'text-[#5A5A5A]',

  // Background utilities
  bgPrimary: 'bg-[#FAFAF8]',
  bgSecondary: 'bg-[#F5F3F0]',
  bgBrand: 'bg-[#2D5016]',
  bgCream: 'bg-[#F5F3F0]',

  // Border utilities - refined, elegant
  borderPrimary: 'border-[#2D5016]/20',
  borderSecondary: 'border-[#C9A876]/20',
  borderLight: 'border-[#D4D9CE]',
  borderNeutral: 'border-[#F5F3F0]',

  // Hover states - subtle transitions
  hoverPrimary: 'hover:bg-[#1F3810] hover:shadow-md',
  hoverSecondary: 'hover:bg-[#A88860] hover:shadow-md',
  hoverLight: 'hover:bg-[#F5F3F0]',
  hoverBorder: 'hover:border-[#2D5016]',

  // Focus states - refined
  focusPrimary: 'focus:outline-none focus:ring-2 focus:ring-[#2D5016] focus:ring-offset-2',
  focusSecondary: 'focus:outline-none focus:ring-2 focus:ring-[#C9A876] focus:ring-offset-2',

  // Button styles - elegant, minimal
  btnPrimary: 'bg-[#2D5016] text-white hover:bg-[#1F3810] transition-all duration-200 rounded-lg font-medium px-6 py-3 shadow-sm hover:shadow-md',
  btnSecondary: 'bg-[#C9A876] text-[#1F1F1F] hover:bg-[#A88860] transition-all duration-200 rounded-lg font-medium px-6 py-3 shadow-sm hover:shadow-md',
  btnOutline: 'border-2 border-[#2D5016] text-[#2D5016] hover:bg-[#F5F3F0] hover:border-[#1F3810] transition-all duration-200 rounded-lg font-medium px-6 py-3',
  btnGhost: 'text-[#2D5016] hover:bg-[#F5F3F0] transition-all duration-200 rounded-lg font-medium px-6 py-3',

  // Card styles - refined with subtle borders
  cardBase: 'rounded-xl border border-[#D4D9CE] bg-white shadow-sm hover:shadow-md transition-all duration-200',
  cardBg: 'bg-white dark:bg-[#1F1F1F]',

  // Divider - elegant, subtle
  divider: 'border-t border-[#D4D9CE] dark:border-[#2D2D2D]',
};
