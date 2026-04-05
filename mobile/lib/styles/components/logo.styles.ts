/**
 * Menthera Logo Component Styles
 *
 * Clean, modern logo design for Menthera AI Companion
 * Combines icon + wordmark in a cohesive lockup
 */

import { ViewStyle, TextStyle } from 'react-native';
import { tokens } from '../core/tokens';

export const logoStyles = {
  // ==================== CONTAINER ====================
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,

  // Size variants
  small: {
    gap: tokens.spacing.xs,
  } as ViewStyle,

  medium: {
    gap: tokens.spacing.sm,
  } as ViewStyle,

  large: {
    gap: tokens.spacing.md,
  } as ViewStyle,

  // ==================== ICON ====================
  // Concept: Abstract "M" shape with AI/mind connection theme
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,

  iconSmall: {
    width: 40,
    height: 40,
  } as ViewStyle,

  iconMedium: {
    width: 60,
    height: 60,
  } as ViewStyle,

  iconLarge: {
    width: 80,
    height: 80,
  } as ViewStyle,

  // Main circle (outer) - Vibrant gradient-like effect
  outerCircle: {
    position: 'absolute',
    borderRadius: 9999,
    borderWidth: 3,
    borderColor: tokens.colors.brand.serenityBlue,
    backgroundColor: tokens.colors.brand.softLilac,
  } as ViewStyle,

  outerCircleSmall: {
    width: 40,
    height: 40,
  } as ViewStyle,

  outerCircleMedium: {
    width: 60,
    height: 60,
  } as ViewStyle,

  outerCircleLarge: {
    width: 80,
    height: 80,
  } as ViewStyle,

  // Inner design - "M" shape with dots
  innerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 3,
  } as ViewStyle,

  innerContainerSmall: {
    gap: 2,
  } as ViewStyle,

  innerContainerMedium: {
    gap: 3,
  } as ViewStyle,

  innerContainerLarge: {
    gap: 4,
  } as ViewStyle,

  // "M" peaks - three vertical bars forming M shape (vibrant)
  mPeak: {
    backgroundColor: tokens.colors.brand.serenityBlue,
    borderRadius: 3,
  } as ViewStyle,

  // Left peak (tall)
  leftPeak: {
    width: 4,
    height: 18,
  } as ViewStyle,

  leftPeakSmall: {
    width: 3,
    height: 12,
  } as ViewStyle,

  leftPeakMedium: {
    width: 4,
    height: 18,
  } as ViewStyle,

  leftPeakLarge: {
    width: 5,
    height: 24,
  } as ViewStyle,

  // Middle peak (short)
  middlePeak: {
    width: 4,
    height: 10,
  } as ViewStyle,

  middlePeakSmall: {
    width: 3,
    height: 7,
  } as ViewStyle,

  middlePeakMedium: {
    width: 4,
    height: 10,
  } as ViewStyle,

  middlePeakLarge: {
    width: 5,
    height: 13,
  } as ViewStyle,

  // Right peak (tall)
  rightPeak: {
    width: 4,
    height: 18,
  } as ViewStyle,

  rightPeakSmall: {
    width: 3,
    height: 12,
  } as ViewStyle,

  rightPeakMedium: {
    width: 4,
    height: 18,
  } as ViewStyle,

  rightPeakLarge: {
    width: 5,
    height: 24,
  } as ViewStyle,

  // Accent dot (top right - representing AI spark) - vibrant glow effect
  accentDot: {
    position: 'absolute',
    borderRadius: 9999,
    backgroundColor: tokens.colors.brand.goldenGlow,
    shadowColor: tokens.colors.brand.goldenGlow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 4,
  } as ViewStyle,

  accentDotSmall: {
    width: 6,
    height: 6,
    top: 4,
    right: 4,
  } as ViewStyle,

  accentDotMedium: {
    width: 8,
    height: 8,
    top: 6,
    right: 6,
  } as ViewStyle,

  accentDotLarge: {
    width: 10,
    height: 10,
    top: 8,
    right: 8,
  } as ViewStyle,

  // ==================== WORDMARK ====================
  wordmark: {
    fontWeight: tokens.typography.weights.bold,
    color: tokens.colors.brand.charcoal,
    letterSpacing: 0.5,
  } as TextStyle,

  wordmarkSmall: {
    fontSize: 16,
  } as TextStyle,

  wordmarkMedium: {
    fontSize: 24,
  } as TextStyle,

  wordmarkLarge: {
    fontSize: 32,
  } as TextStyle,

  // Light variant (for dark backgrounds)
  wordmarkLight: {
    color: tokens.colors.text.inverse,
  } as TextStyle,
} as const;

export type LogoStyles = typeof logoStyles;
