/**
 * DEPRECATED: This file now re-exports from the centralized design tokens.
 *
 * Please import from '@/lib/styles/core/tokens' instead:
 * import { tokens } from '@/lib/styles/core/tokens';
 *
 * This file exists for backward compatibility only.
 */

import { tokens } from '@/lib/styles/core/tokens';

// Re-export brand colors from tokens for backward compatibility
const brandColors = {
  // Primary brand colors
  serenityBlue: tokens.colors.brand.serenityBlue,
  softLilac: tokens.colors.brand.softLilac,
  gentleMint: tokens.colors.brand.gentleMint,

  // Accent colors
  warmCoral: tokens.colors.brand.warmCoral,
  goldenGlow: tokens.colors.brand.goldenGlow,

  // Neutral colors
  cloudWhite: tokens.colors.brand.cloudWhite,
  softGray: tokens.colors.brand.softGray,
  charcoal: tokens.colors.brand.charcoal,
  mutedGray: tokens.colors.brand.mutedGray,

  // Legacy compatibility
  purple: tokens.colors.brand.serenityBlue,
  black: tokens.colors.brand.charcoal,
  white: tokens.colors.brand.cloudWhite,

  // Additional semantic colors
  green: tokens.colors.brand.gentleMint,
  red: tokens.colors.brand.warmCoral,
  blue: tokens.colors.brand.serenityBlue,
  warning: tokens.colors.brand.goldenGlow,
};

// Light theme colors from tokens
const lightTheme = {
  primary: tokens.colors.background.primary,
  secondary: tokens.colors.background.secondary,
  tertiary: tokens.colors.background.tertiary,
  card: tokens.colors.background.card,
  background: tokens.colors.background.primary,

  text: tokens.colors.text.primary,
  textSecondary: tokens.colors.text.secondary,
  textMuted: tokens.colors.text.secondary,
  textDestructive: tokens.colors.text.error,

  border: tokens.colors.border.primary,
  borderPrimary: tokens.colors.border.focus,
};

// Neutral grayscale from tokens
const neutral = {
  gray100: tokens.colors.neutral.gray100,
  gray200: tokens.colors.neutral.gray200,
  gray300: tokens.colors.neutral.gray300,
  gray400: tokens.colors.neutral.gray400,
  gray500: tokens.colors.neutral.gray500,
  gray600: tokens.colors.neutral.gray600,
  gray700: tokens.colors.neutral.gray700,
  gray800: tokens.colors.neutral.gray800,
};

// Accent/semantic colors from tokens
const accent = {
  primary: tokens.colors.brand.serenityBlue,
  secondary: tokens.colors.brand.softLilac,
  success: tokens.colors.brand.gentleMint,
  error: tokens.colors.brand.warmCoral,
  info: tokens.colors.brand.serenityBlue,
  warning: tokens.colors.brand.goldenGlow,
};

// Legacy tint colors
const tintColorLight = brandColors.serenityBlue;

export default {
  // Brand colors
  brand: brandColors,

  // Neutral colors
  neutral,

  // Accent colors
  accent,

  // Theme colors (light only)
  light: {
    ...lightTheme,
    tint: tintColorLight,
    tabIconDefault: '#CCCCCC',
    tabIconSelected: tintColorLight,
  },
};

// Export individual color objects for easier imports
export { brandColors, lightTheme, neutral, accent };
