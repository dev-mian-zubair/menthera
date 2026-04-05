/**
 * Design Tokens - Single Source of Truth
 *
 * All design decisions centralized here.
 * Import these tokens in all screen-specific style files.
 *
 * Based on Menthera AI Companion brand palette.
 */

/**
 * Color Palette - Menthera AI Companion
 *
 * Primary: Serenity Blue (#5A86FF) - Calm, trustworthy
 * Secondary: Soft Lilac (#B39DDB) - Gentle, supportive
 * Success: Gentle Mint (#6ED7C4) - Positive, confirming
 * Warning/Error: Warm Coral (#FF7F7F) - Soft alerts
 * Accent: Golden Glow (#FFD166) - Highlights
 */
export const tokens = {
  // ==================== COLORS ====================
  colors: {
    // Brand colors - Menthera palette
    brand: {
      serenityBlue: '#5A86FF',    // Primary brand color
      softLilac: '#B39DDB',       // Secondary brand color (purple illustration)
      gentleMint: '#6ED7C4',      // Success/positive states
      warmCoral: '#FF7F7F',       // Warnings/alerts
      goldenGlow: '#FFD166',      // Highlights/badges
      cloudWhite: '#F9F9FB',      // Main backgrounds
      softGray: '#E0E0E0',        // Cards/dividers
      charcoal: '#2C2C2C',        // Primary text
      mutedGray: '#6B6B6B',       // Secondary text

      // Welcome screen specific
      creamBeige: '#FBF7F4',      // Welcome screen background
      peachCoral: '#F4C19E',      // Primary button, illustration accent
    },

    // Semantic background colors
    background: {
      primary: '#F9F9FB',         // Cloud White - Main background
      secondary: '#E0E0E0',       // Soft Gray - Card background
      tertiary: '#B39DDB',        // Soft Lilac - Accent background
      card: '#F9F9FB',            // Card default background
      overlay: 'rgba(0, 0, 0, 0.5)', // Modal overlay
      overlayLight: 'rgba(0, 0, 0, 0.3)', // Light overlay
    },

    // Text colors
    text: {
      primary: '#2C2C2C',         // Charcoal - Primary text
      secondary: '#6B6B6B',       // Muted Gray - Secondary text
      tertiary: '#A0A0A0',        // Light gray - Tertiary text
      inverse: '#FFFFFF',         // White - For dark backgrounds
      link: '#5A86FF',            // Serenity Blue - Links
      error: '#FF7F7F',           // Warm Coral - Error text
      success: '#6ED7C4',         // Gentle Mint - Success text
      warning: '#FFD166',         // Golden Glow - Warning text
      disabled: '#C0C0C0',        // Disabled state
      placeholder: '#A0A0A0',     // Input placeholders
    },

    // Border colors
    border: {
      primary: '#E0E0E0',         // Soft Gray - Default borders
      secondary: '#C0C0C0',       // Light gray - Secondary borders
      focus: '#5A86FF',           // Serenity Blue - Focused state
      error: '#FF7F7F',           // Warm Coral - Error state
      success: '#6ED7C4',         // Gentle Mint - Success state
      disabled: '#E0E0E0',        // Disabled state
    },

    // Button colors
    button: {
      primary: '#5A86FF',         // Serenity Blue
      primaryHover: '#4A76EF',    // Darker blue on press
      primaryText: '#FFFFFF',     // White text

      secondary: '#B39DDB',       // Soft Lilac
      secondaryHover: '#A38DCB',  // Darker lilac on press
      secondaryText: '#FFFFFF',   // White text

      destructive: '#FF7F7F',     // Warm Coral
      destructiveHover: '#EF6F6F', // Darker coral on press
      destructiveText: '#FFFFFF', // White text

      outline: 'transparent',     // Transparent background
      outlineBorder: '#E0E0E0',   // Soft Gray border
      outlineText: '#2C2C2C',     // Charcoal text

      ghost: 'transparent',       // Transparent
      ghostText: '#2C2C2C',       // Charcoal text
      ghostHover: '#F9F9FB',      // Cloud White on press

      disabled: '#E0E0E0',        // Soft Gray
      disabledText: '#A0A0A0',    // Light gray text
    },

    // Status colors
    status: {
      online: '#6ED7C4',          // Gentle Mint - Online status
      offline: '#6B6B6B',         // Muted Gray - Offline
      away: '#FFD166',            // Golden Glow - Away
      busy: '#FF7F7F',            // Warm Coral - Busy/DND
    },

    // Badge colors
    badge: {
      success: '#6ED7C4',         // Gentle Mint
      successText: '#FFFFFF',
      warning: '#FFD166',         // Golden Glow
      warningText: '#2C2C2C',
      error: '#FF7F7F',           // Warm Coral
      errorText: '#FFFFFF',
      info: '#5A86FF',            // Serenity Blue
      infoText: '#FFFFFF',
      neutral: '#E0E0E0',         // Soft Gray
      neutralText: '#2C2C2C',
      purple: '#B39DDB',          // Soft Lilac
      purpleText: '#FFFFFF',
    },

    // Input colors
    input: {
      background: '#F9F9FB',      // Cloud White
      backgroundDisabled: '#E0E0E0', // Soft Gray
      border: '#E0E0E0',          // Soft Gray
      borderFocus: '#5A86FF',     // Serenity Blue
      borderError: '#FF7F7F',     // Warm Coral
      text: '#2C2C2C',            // Charcoal
      placeholder: '#A0A0A0',     // Light gray
    },

    // Neutral grayscale
    neutral: {
      gray100: '#F9F9FB',         // Cloud White
      gray200: '#E0E0E0',         // Soft Gray
      gray300: '#C0C0C0',
      gray400: '#A0A0A0',
      gray500: '#6B6B6B',         // Muted Gray
      gray600: '#606060',
      gray700: '#404040',
      gray800: '#2C2C2C',         // Charcoal
      gray900: '#1C1C1C',
    },
  },

  // ==================== TYPOGRAPHY ====================
  typography: {
    // Font families
    fontFamilyBrand: 'Graphik',
    fontFamilyUI: 'SFProDisplay',

    // Font sizes (in pixels)
    sizes: {
      '2xs': 11,
      xs: 12,
      sm: 14,
      base: 16,
      md: 18,
      lg: 20,
      xl: 24,
      '2xl': 32,
      '3xl': 40,
      '4xl': 48,
      '5xl': 56,
      '6xl': 64,
    },

    // Font weights
    weights: {
      extraLight: '200' as const,
      light: '300' as const,
      regular: '400' as const,
      medium: '500' as const,
      semibold: '600' as const,
      bold: '700' as const,
      extrabold: '800' as const,
      black: '900' as const,
    },

    // Line heights (multipliers)
    lineHeights: {
      tight: 1.2,
      snug: 1.375,
      normal: 1.5,
      relaxed: 1.75,
      loose: 2,
    },

    // Letter spacing
    letterSpacing: {
      tighter: -0.5,
      tight: -0.25,
      normal: 0,
      wide: 0.25,
      wider: 0.5,
      widest: 1,
    },
  },

  // ==================== SPACING ====================
  // Base: 4px scale
  spacing: {
    '0': 0,
    '2xs': 2,
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
    '3xl': 64,
    '4xl': 96,
    '5xl': 128,
    '6xl': 160,
  },

  // ==================== BORDER RADIUS ====================
  radius: {
    none: 0,
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
    full: 9999,
  },

  // ==================== ELEVATION/SHADOWS ====================
  // Shadow intensity levels
  elevation: {
    none: 0,
    xs: 1,
    sm: 2,
    md: 4,
    lg: 8,
    xl: 12,
    '2xl': 16,
    '3xl': 24,
  },

  // ==================== SIZING ====================
  // Common component sizes
  sizing: {
    // Button heights
    button: {
      sm: 36,
      md: 44,
      lg: 52,
      xl: 60,
    },

    // Input heights
    input: {
      sm: 36,
      md: 44,
      lg: 52,
    },

    // Avatar sizes
    avatar: {
      xs: 24,
      sm: 32,
      md: 40,
      lg: 60,
      xl: 80,
      '2xl': 120,
      '3xl': 160,
    },

    // Icon sizes
    icon: {
      xs: 12,
      sm: 16,
      md: 20,
      lg: 24,
      xl: 32,
      '2xl': 40,
    },
  },

  // ==================== OPACITY ====================
  opacity: {
    disabled: 0.4,
    hover: 0.8,
    pressed: 0.6,
    overlay: 0.5,
    overlayLight: 0.3,
    overlayDark: 0.7,
  },

  // ==================== Z-INDEX ====================
  zIndex: {
    base: 0,
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
  },

  // ==================== TIMING (ANIMATIONS) ====================
  timing: {
    instant: 0,
    fast: 150,
    normal: 300,
    slow: 500,
    slower: 700,
  },

  // ==================== BREAKPOINTS ====================
  // Screen size breakpoints (for responsive design)
  breakpoints: {
    xs: 375,     // Small phones
    sm: 640,     // Phones
    md: 768,     // Tablets
    lg: 1024,    // Small laptops
    xl: 1280,    // Desktops
    '2xl': 1536, // Large desktops
  },
} as const;

// ==================== TYPE EXPORTS ====================
export type DesignTokens = typeof tokens;
export type ColorTokens = typeof tokens.colors;
export type TypographyTokens = typeof tokens.typography;
export type SpacingTokens = typeof tokens.spacing;
export type RadiusTokens = typeof tokens.radius;
