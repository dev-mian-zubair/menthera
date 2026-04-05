/**
 * Agent Card Component Style Lookup
 *
 * Reusable agent card component with multiple layout variants
 * Variants: default, featured, grid, compact
 */

import { ViewStyle, TextStyle, ImageStyle } from 'react-native';
import { tokens } from '../core/tokens';
import { shadows, flex } from '../core/mixins';

export const agentCardStyles = {
  // ==================== FEATURED VARIANT ====================
  featured: {
    container: {
      borderBottomWidth: 1,
      borderBottomColor: '#F3F4F6',
      paddingVertical: 12,
      ...flex.rowCenter,
    } as ViewStyle,

    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: 12,
    } as ImageStyle,

    content: {
      flex: 1,
    } as ViewStyle,

    nameRow: {
      ...flex.rowCenter,
      marginBottom: 4,
    } as ViewStyle,

    name: {
      fontSize: 16,
      fontWeight: tokens.typography.weights.semibold,
      color: '#111827',
    } as TextStyle,

    verificationBadge: {
      marginLeft: 4,
    },

    specialty: {
      fontSize: 14,
      color: '#6B7280',
    } as TextStyle,

    actions: {
      ...flex.rowCenter,
      gap: 8,
    } as ViewStyle,

    actionButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      ...flex.center,
      backgroundColor: `${tokens.colors.brand.serenityBlue}15`,
    } as ViewStyle,

    favoriteButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      ...flex.center,
      backgroundColor: `${tokens.colors.brand.warmCoral}15`,
    } as ViewStyle,
  },

  // ==================== GRID VARIANT ====================
  grid: {
    container: {
      ...flex.rowCenter,
      padding: 12,
      backgroundColor: tokens.colors.background.card,
      borderRadius: tokens.radius.md,
      borderWidth: 1,
      borderColor: tokens.colors.border.primary,
      marginBottom: 8,
    } as ViewStyle,

    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      marginRight: 12,
    } as ImageStyle,

    content: {
      flex: 1,
    } as ViewStyle,

    nameRow: {
      ...flex.rowCenter,
      marginBottom: 4,
    } as ViewStyle,

    name: {
      fontSize: 15,
      fontWeight: tokens.typography.weights.semibold,
      color: tokens.colors.text.primary,
    } as TextStyle,

    specialty: {
      fontSize: 13,
      color: tokens.colors.text.secondary,
    } as TextStyle,

    actions: {
      ...flex.rowCenter,
      gap: 8,
    } as ViewStyle,
  },

  // ==================== DEFAULT VARIANT ====================
  default: {
    container: {
      backgroundColor: tokens.colors.background.card,
      borderRadius: tokens.radius.lg,
      padding: 12,
      minHeight: 180,
      ...shadows.small,
    } as ViewStyle,

    avatarContainer: {
      width: '100%',
      height: 80,
      borderRadius: tokens.radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    } as ViewStyle,

    avatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
    } as ImageStyle,

    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      flexWrap: 'wrap',
      marginBottom: 6,
    } as ViewStyle,

    name: {
      fontSize: tokens.typography.sizes.base,
      fontWeight: tokens.typography.weights.semibold,
      color: tokens.colors.text.primary,
      marginRight: 6,
    } as TextStyle,

    domainBadge: {
      backgroundColor: '#E0EAFF',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    } as ViewStyle,

    domainText: {
      fontSize: 11,
      fontFamily: 'SFProDisplayMedium',
      color: '#5A86FF',
    } as TextStyle,

    description: {
      fontSize: 11,
      color: tokens.colors.text.secondary,
      textAlign: 'center',
      lineHeight: 15,
    } as TextStyle,

    specialty: {
      fontSize: tokens.typography.sizes.sm,
      color: tokens.colors.text.secondary,
      textAlign: 'center',
    } as TextStyle,
  },

  // ==================== COMPACT VARIANT ====================
  compact: {
    container: {
      width: 100,
      padding: tokens.spacing.sm,
      backgroundColor: tokens.colors.background.card,
      borderRadius: tokens.radius.md,
      ...flex.columnCenter,
      ...shadows.xs,
    } as ViewStyle,

    avatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
      marginBottom: tokens.spacing.xs,
    } as ImageStyle,

    name: {
      fontSize: tokens.typography.sizes.sm,
      fontWeight: tokens.typography.weights.medium,
      color: tokens.colors.text.primary,
      textAlign: 'center',
    } as TextStyle,
  },
} as const;

export type AgentCardStyles = typeof agentCardStyles;
