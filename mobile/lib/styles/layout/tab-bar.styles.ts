/**
 * Tab Bar Style Lookup
 *
 * Bottom tab navigation styling
 * Features: Tab icons with active states, labels, rounded active background
 */

import { Platform, TextStyle, ViewStyle } from 'react-native';
import { flex } from '../core/mixins';
import { tokens } from '../core/tokens';

export const tabBarStyles = {
  // ==================== TAB BAR CONTAINER ====================
  container: {
    backgroundColor: tokens.colors.brand.creamBeige,
    borderTopColor: tokens.colors.brand.softGray,
    height: 60,
    paddingTop: tokens.spacing.xs,
    paddingHorizontal: tokens.spacing.md,
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  } as ViewStyle,

  // ==================== TAB COLORS ====================
  colors: {
    activeTint: tokens.colors.brand.serenityBlue,
    inactiveTint: tokens.colors.brand.mutedGray,
  },

  // ==================== TAB LABEL ====================
  label: {
    fontSize: 11,
    fontWeight: tokens.typography.weights.semibold,
    marginTop: 4,
    marginBottom: 0,
  } as TextStyle,

  // ==================== TAB ICON CONTAINER ====================
  iconContainer: {
    width: 52,
    height: 32,
    borderRadius: 16,
    ...flex.center,
  } as ViewStyle,

  iconContainerActive: {
    backgroundColor: `${tokens.colors.brand.serenityBlue}20`,
  } as ViewStyle,

  iconContainerInactive: {
    backgroundColor: 'transparent',
  } as ViewStyle,

  // ==================== ICON SIZES ====================
  iconSize: 24,

  // ==================== SCENE STYLE ====================
  sceneStyle: {
    backgroundColor: 'transparent',
  } as ViewStyle,
} as const;

export type TabBarStyles = typeof tabBarStyles;
