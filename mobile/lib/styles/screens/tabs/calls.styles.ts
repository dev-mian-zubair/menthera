/**
 * Calls Screen Style Lookup
 * Route: /calls (tab)
 *
 * Call history display with call details and quick actions
 * Features: Header, call history list, empty state
 */

import { ViewStyle, TextStyle, Platform } from 'react-native';
import { tokens } from '../../core/tokens';
import { shadows, flex } from '../../core/mixins';

export const callsStyles = {
  // ==================== SAFE AREA ====================
  safeArea: {
    flex: 1,
    backgroundColor: '#FBF7F4',
  } as ViewStyle,

  // ==================== HEADER ====================
  header: {
    container: {
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 0,
    } as ViewStyle,

    title: {
      fontSize: 28,
      fontFamily: 'SFProDisplayBold',
      color: '#2C2C2C',
      letterSpacing: -0.5,
    } as TextStyle,
  },

  // ==================== CALLS LIST ====================
  list: {
    scrollView: {
      flex: 1,
    } as ViewStyle,

    scrollContent: {
      paddingHorizontal: tokens.spacing.md,
      paddingBottom: 100,
    } as ViewStyle,
  },

  // ==================== EMPTY STATE ====================
  emptyState: {
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 40,
    } as ViewStyle,

    iconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
      borderTopWidth: 1,
      borderLeftWidth: 1,
      borderRightWidth: 2,
      borderBottomWidth: 2,
      borderColor: '#E5E7EB',
    } as ViewStyle,

    title: {
      fontSize: 20,
      fontFamily: 'SFProDisplayBold',
      color: '#2C2C2C',
      marginBottom: 8,
      letterSpacing: -0.3,
    } as TextStyle,

    message: {
      fontSize: 14,
      fontFamily: 'SFProDisplayRegular',
      color: '#8E8E93',
      textAlign: 'center',
      marginBottom: 24,
      lineHeight: 20,
    } as TextStyle,

    ctaButton: {
      backgroundColor: '#5A86FF',
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 28,
      borderTopWidth: 1,
      borderLeftWidth: 1,
      borderRightWidth: 3,
      borderBottomWidth: 3,
      borderColor: '#4A76EF',
    } as ViewStyle,

    ctaButtonText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontFamily: 'SFProDisplaySemibold',
      letterSpacing: -0.2,
    } as TextStyle,
  },
} as const;

export type CallsStyles = typeof callsStyles;
