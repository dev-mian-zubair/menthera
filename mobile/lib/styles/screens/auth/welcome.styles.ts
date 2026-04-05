/**
 * Welcome Screen Style Lookup
 * Route: /auth/welcome
 *
 * Onboarding welcome screen with Menthera branding
 * Design: Cream background, centered layout, decorative illustration
 */

import { ViewStyle, TextStyle } from 'react-native';
import { tokens } from '../../core/tokens';

export const welcomeStyles = {
  // ==================== CONTAINERS ====================
  container: {
    flex: 1,
    backgroundColor: tokens.colors.brand.creamBeige,
  } as ViewStyle,

  safeArea: {
    flex: 1,
  } as ViewStyle,

  content: {
    flex: 1,
    paddingHorizontal: tokens.spacing.lg,
    justifyContent: 'space-between',
    paddingTop: tokens.spacing.lg,
    paddingBottom: tokens.spacing.lg,
  } as ViewStyle,

  // ==================== MAIN CONTENT ====================
  mainContent: {
    flex: 1,
    justifyContent: 'center',
  } as ViewStyle,

  // ==================== APP NAME ====================
  appNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: tokens.spacing.md,
    gap: tokens.spacing.sm,
  } as ViewStyle,

  appName: {
    fontSize: 52,
    fontFamily: 'SFProDisplayBold',
    color: tokens.colors.brand.charcoal,
    textAlign: 'left',
    letterSpacing: -1.5,
  } as TextStyle,

  // Beautiful AI Pill Badge - Transparent with black border
  aiPill: {
    backgroundColor: 'transparent',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: tokens.colors.brand.charcoal,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,

  aiPillText: {
    fontSize: 14,
    fontWeight: tokens.typography.weights.medium,
    color: tokens.colors.brand.charcoal,
    letterSpacing: 0.5,
    textTransform: 'lowercase',
  } as TextStyle,

  // ==================== TAGLINE ====================
  // Attention-grabbing tagline - bold and impactful
  tagline: {
    fontSize: 18,
    fontFamily: 'SFProDisplayMedium',
    color: tokens.colors.brand.charcoal,
    textAlign: 'left',
    lineHeight: 28,
    letterSpacing: -0.3,
    opacity: 0.85,
  } as TextStyle,

  // ==================== BUTTONS ====================
  buttons: {
    container: {
      gap: tokens.spacing.md,
    } as ViewStyle,

    primary: {
      backgroundColor: tokens.colors.brand.peachCoral,
      height: 56,
      borderRadius: 28,
      borderTopWidth: 1,
      borderLeftWidth: 1,
      borderRightWidth: 3,
      borderBottomWidth: 3,
      borderColor: tokens.colors.brand.charcoal,
      alignItems: 'center',
      justifyContent: 'center',
    } as ViewStyle,

    primaryText: {
      fontSize: tokens.typography.sizes.base,
      fontWeight: tokens.typography.weights.semibold,
      color: tokens.colors.brand.charcoal,
    } as TextStyle,

    secondary: {
      height: 56,
      borderRadius: 28,
      borderTopWidth: 1.5,
      borderLeftWidth: 1.5,
      borderRightWidth: 3,
      borderBottomWidth: 3,
      borderColor: tokens.colors.brand.charcoal,
      backgroundColor: 'transparent',
      alignItems: 'center',
      justifyContent: 'center',
    } as ViewStyle,

    secondaryText: {
      fontSize: tokens.typography.sizes.base,
      fontWeight: tokens.typography.weights.medium,
      color: tokens.colors.brand.charcoal,
    } as TextStyle,
  },
} as const;

export type WelcomeStyles = typeof welcomeStyles;
