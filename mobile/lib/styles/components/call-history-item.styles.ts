/**
 * Call History Item Component Style Lookup
 *
 * Individual call history list item for display in calls tab
 * Features: Avatar, agent name, call status, duration, timestamp, status badge
 */

import { ViewStyle, TextStyle, Platform } from 'react-native';
import { tokens } from '../core/tokens';
import { flex } from '../core/mixins';

export const callHistoryItemStyles = {
  // ==================== CONTAINER ====================
  container: {
    ...flex.rowCenter,
    backgroundColor: 'transparent',
    borderRadius: 20,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    // Explicitly remove any shadows
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  } as ViewStyle,

  // ==================== AVATAR ====================
  avatarContainer: {
    marginRight: 12,
  } as ViewStyle,

  // ==================== INFO SECTION ====================
  info: {
    container: {
      flex: 1,
    } as ViewStyle,

    nameRow: {
      ...flex.rowCenter,
      marginBottom: 4,
    } as ViewStyle,

    name: {
      fontSize: 16,
      fontFamily: 'SFProDisplaySemibold',
      color: '#2C2C2C',
      letterSpacing: -0.2,
    } as TextStyle,

    missedBadge: {
      marginLeft: 6,
      backgroundColor: '#FFFFFF',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#FF6B6B',
    } as ViewStyle,

    missedBadgeText: {
      fontSize: 10,
      fontFamily: 'SFProDisplaySemibold',
      color: '#FF6B6B',
    } as TextStyle,

    statusRow: {
      ...flex.rowCenter,
    } as ViewStyle,

    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      marginRight: 6,
    } as ViewStyle,

    statusDotCompleted: {
      backgroundColor: tokens.colors.brand.gentleMint,
    } as ViewStyle,

    statusDotMissed: {
      backgroundColor: tokens.colors.brand.warmCoral,
    } as ViewStyle,

    statusText: {
      fontSize: 13,
      fontFamily: 'SFProDisplayMedium',
      color: '#8E8E93',
    } as TextStyle,

    separator: {
      fontSize: 13,
      color: '#8E8E93',
      marginHorizontal: 6,
    } as TextStyle,

    timestamp: {
      fontSize: 13,
      fontFamily: 'SFProDisplayRegular',
      color: '#8E8E93',
    } as TextStyle,
  },

  // ==================== CALL ICON ====================
  callIcon: {
    container: {
      width: 36,
      height: 36,
      ...flex.center,
    } as ViewStyle,

    containerCompleted: {
    } as ViewStyle,

    containerMissed: {
    } as ViewStyle,
  },
} as const;

export type CallHistoryItemStyles = typeof callHistoryItemStyles;
