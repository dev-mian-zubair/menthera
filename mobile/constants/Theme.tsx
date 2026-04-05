/**
 * Theme composition layer.
 *
 * This file builds a component-facing theme API on top of the raw design
 * tokens defined in `@/lib/styles/core/tokens`. It is not a re-export shim —
 * it composes typography, spacing, radius, shadow, and breakpoint values
 * into the shape that screens and components consume directly, and adds
 * helpers (`buttonStyles`, `inputStyles`, `cardStyles`) plus the
 * `ThemeProvider` / `useTheme` React context.
 *
 * If you are adding a new primitive color or spacing token, edit
 * `@/lib/styles/core/tokens` — this file will pick it up automatically.
 * If you are adding a new component-shaped helper, add it here.
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { Platform } from 'react-native';
import { tokens } from '@/lib/styles/core/tokens';
import ColorPalette from './Colors';

// Re-export from tokens for backward compatibility
export const MentheraTheme = {
  colors: ColorPalette,

  typography: {
    fontFamilyBrand: tokens.typography.fontFamilyBrand,
    fontFamilyUI: tokens.typography.fontFamilyUI,

    sizes: {
      xs: tokens.typography.sizes.xs,
      sm: tokens.typography.sizes.sm,
      base: tokens.typography.sizes.base,
      md: tokens.typography.sizes.md,
      lg: tokens.typography.sizes.lg,
      xl: tokens.typography.sizes.xl,
      '2xl': tokens.typography.sizes['2xl'],
      '3xl': tokens.typography.sizes['3xl'],
    },

    weights: {
      extraLight: 200,
      light: 300,
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },

    lineHeights: {
      tight: tokens.typography.lineHeights.tight,
      normal: tokens.typography.lineHeights.normal,
      relaxed: tokens.typography.lineHeights.relaxed,
    },

    letterSpacing: {
      tighter: tokens.typography.letterSpacing.tighter,
      normal: tokens.typography.letterSpacing.normal,
      wide: tokens.typography.letterSpacing.wide,
    },
  },

  spacing: {
    xs: tokens.spacing.xs,
    sm: tokens.spacing.sm,
    md: tokens.spacing.md,
    lg: tokens.spacing.lg,
    xl: tokens.spacing.xl,
    '2xl': tokens.spacing['2xl'],
    '3xl': tokens.spacing['3xl'],
  },

  radius: {
    none: tokens.radius.none,
    sm: tokens.radius.sm,
    md: tokens.radius.md,
    lg: tokens.radius.full,
    full: tokens.radius.full,
  },

  shadows: {
    none: {
      offset: { width: 0, height: 0 },
      radius: 0,
      opacity: 0,
      elevation: 0,
    },
    subtle: {
      offset: { width: 0, height: 1 },
      radius: 2,
      opacity: 0.05,
      elevation: 1,
    }
  },

  breakpoints: {
    sm: tokens.breakpoints.sm,
    md: tokens.breakpoints.md,
    lg: tokens.breakpoints.lg,
    xl: tokens.breakpoints.xl,
  }
};

// Backward compatibility exports
export const AppTheme = MentheraTheme;
export const SnapTheme = MentheraTheme; // Legacy compatibility

export const Colors = {
  brand: MentheraTheme.colors.brand,
  light: MentheraTheme.colors.light,
  neutral: MentheraTheme.colors.neutral,
  accent: MentheraTheme.colors.accent,
};

export const ComponentTokens = {
  tabBar: {
    height: 60,
    borderWidth: 1,
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
    labelFontSize: 11,
    labelMargin: 4,
  },
  icons: {
    xs: tokens.sizing.icon.xs,
    sm: tokens.sizing.icon.sm,
    md: tokens.sizing.icon.md,
    lg: tokens.sizing.icon.lg,
    xl: tokens.sizing.icon.xl,
    '2xl': tokens.sizing.icon['2xl'],
  },
  spacing: MentheraTheme.spacing,
  shadows: {
    ...MentheraTheme.shadows,
    color: 'rgba(0, 0, 0, 0.08)',
    modal: {
      offset: { width: 0, height: 4 },
      opacity: 0.08,
      radius: 12,
      elevation: 2,
    },
    card: {
      offset: { width: 0, height: 2 },
      opacity: 0.06,
      radius: 8,
      elevation: 1,
    }
  },
  radius: MentheraTheme.radius,
};

// Theme tokens structure - unified token API for components
// This provides a consistent interface for accessing theme values
export function getThemeTokens() {
  const colors = MentheraTheme.colors.light;

  return {
    colors: {
      background: {
        background: colors.primary,
        primary: MentheraTheme.colors.brand.serenityBlue,
        secondary: colors.secondary,
        card: colors.card || colors.primary,
        destructive: MentheraTheme.colors.accent.error,
      },
      text: {
        foreground: colors.text,
        primaryForeground: MentheraTheme.colors.brand.cloudWhite,
        secondaryForeground: colors.textSecondary,
        destructiveForeground: MentheraTheme.colors.brand.cloudWhite,
        mutedForeground: colors.textSecondary,
        error: colors.textDestructive,
        primary: MentheraTheme.colors.brand.serenityBlue,
      },
      border: {
        border: colors.border,
        primary: MentheraTheme.colors.brand.serenityBlue,
        destructive: MentheraTheme.colors.accent.error,
      }
    },
    typography: {
      sizes: {
        sm: tokens.typography.sizes.sm,
        md: tokens.typography.sizes.base,
        lg: tokens.typography.sizes.lg,
        xl: tokens.typography.sizes.xl,
        '2xl': tokens.typography.sizes['2xl'],
      },
      weights: {
        regular: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
      }
    }
  };
}

// Export the tokens as a constant for direct usage
export const ThemeTokens = getThemeTokens();

// Button style helper function
export function buttonStyles(
  variant: 'primary' | 'secondary' | 'destructive' | 'outline' | 'ghost' = 'primary',
  options: {
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
  } = {}
) {
  const { size = 'md', disabled = false } = options;
  const themeTokens = getThemeTokens();

  const containerStyles: any = {
    opacity: disabled ? 0.5 : 1,
  };

  const labelStyles: any = {
    fontSize: themeTokens.typography.sizes[size],
  };

  // Variant-specific styles
  switch (variant) {
    case 'primary':
      containerStyles.backgroundColor = themeTokens.colors.background.primary;
      labelStyles.color = themeTokens.colors.text.primaryForeground;
      labelStyles.fontWeight = themeTokens.typography.weights.semibold;
      break;
    case 'secondary':
      containerStyles.backgroundColor = themeTokens.colors.background.secondary;
      labelStyles.color = themeTokens.colors.text.secondaryForeground;
      labelStyles.fontWeight = themeTokens.typography.weights.medium;
      break;
    case 'outline':
      containerStyles.backgroundColor = 'transparent';
      containerStyles.borderWidth = 1;
      containerStyles.borderColor = themeTokens.colors.border.border;
      labelStyles.color = themeTokens.colors.text.foreground;
      labelStyles.fontWeight = themeTokens.typography.weights.medium;
      break;
    case 'ghost':
      containerStyles.backgroundColor = 'transparent';
      labelStyles.color = themeTokens.colors.text.foreground;
      labelStyles.fontWeight = themeTokens.typography.weights.medium;
      break;
    case 'destructive':
      containerStyles.backgroundColor = themeTokens.colors.background.destructive;
      labelStyles.color = themeTokens.colors.text.destructiveForeground;
      labelStyles.fontWeight = themeTokens.typography.weights.semibold;
      break;
  }

  return {
    container: containerStyles,
    label: labelStyles,
  };
}

// Input style helper function
export function inputStyles(options: {
  focused?: boolean;
  error?: boolean;
} = {}) {
  const { focused = false, error = false } = options;
  const themeTokens = getThemeTokens();

  return {
    container: {
      backgroundColor: themeTokens.colors.background.card,
      borderColor: error
        ? themeTokens.colors.border.destructive
        : focused
        ? themeTokens.colors.border.primary
        : themeTokens.colors.border.border,
      borderWidth: 1,
    },
    input: {
      color: themeTokens.colors.text.foreground,
      fontSize: themeTokens.typography.sizes.md,
    },
    placeholderColor: themeTokens.colors.text.mutedForeground,
  };
}

// Card style helper function
export function cardStyles(variant: 'plain' | 'elevated' = 'plain') {
  const themeTokens = getThemeTokens();

  const base = {
    container: {
      backgroundColor: themeTokens.colors.background.card,
      borderColor: themeTokens.colors.border.border,
      borderWidth: variant === 'plain' ? 1 : 0,
    },
  };

  if (variant === 'elevated') {
    base.container = {
      ...base.container,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        android: {
          elevation: 4,
        },
      }),
    };
  }

  return base;
}

// Theme Context
type ThemeContextType = {
  tokens: ReturnType<typeof getThemeTokens>;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }): React.ReactElement {
  // Force light theme - no dark mode support for now
  const themeTokens = getThemeTokens();

  return (
    <ThemeContext.Provider value={{ tokens: themeTokens }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export default MentheraTheme;
