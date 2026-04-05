/**
 * Header Component Style Lookup
 *
 * App header with logo/title and user avatar
 * Used across multiple screens for consistency
 */

import { ViewStyle, TextStyle, Platform } from 'react-native';
import { tokens } from '../core/tokens';
import { flex } from '../core/mixins';

export const headerStyles = {
  // ==================== CONTAINER ====================
  container: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  } as ViewStyle,

  // ==================== CONTENT ====================
  content: {
    ...flex.rowBetween,
  } as ViewStyle,

  // ==================== LOGO/TITLE ====================
  title: {
    fontSize: tokens.typography.sizes['2xl'],
    fontWeight: tokens.typography.weights.bold,
    color: tokens.colors.text.primary,
  } as TextStyle,

  // ==================== AVATAR BUTTON ====================
  avatarButton: {
    borderRadius: tokens.radius.full,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  } as ViewStyle,
} as const;

export type HeaderStyles = typeof headerStyles;
