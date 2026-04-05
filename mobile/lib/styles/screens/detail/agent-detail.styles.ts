/**
 * Agent Detail Screen Style Lookup
 * Route: /agent/[id]
 *
 * Detailed profile view for a single AI agent
 * Features: Header, profile card, avatar, description, action buttons, specialties
 */

import { ViewStyle, TextStyle, ImageStyle } from 'react-native';
import { tokens } from '../../core/tokens';
import { shadows, flex } from '../../core/mixins';

export const agentDetailStyles = {
  // ==================== MAIN CONTAINER ====================
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background.primary,
  } as ViewStyle,

  safeArea: {
    flex: 1,
  } as ViewStyle,

  // ==================== HEADER ====================
  header: {
    container: {
      backgroundColor: tokens.colors.background.primary,
      paddingHorizontal: tokens.spacing.lg,
      paddingVertical: tokens.spacing.sm,
    } as ViewStyle,

    content: {
      ...flex.rowCenter,
    } as ViewStyle,

    backButton: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 20,
      backgroundColor: tokens.colors.background.secondary,
      marginRight: tokens.spacing.sm,
    } as ViewStyle,

    title: {
      fontSize: tokens.typography.sizes.lg,
      fontWeight: tokens.typography.weights.semibold,
      color: tokens.colors.text.primary,
      flex: 1,
    } as TextStyle,
  },

  // ==================== SCROLL VIEW ====================
  scrollView: {
    flex: 1,
  } as ViewStyle,

  scrollContent: {
    paddingBottom: 120,
  } as ViewStyle,

  // ==================== PROFILE CARD ====================
  profileCard: {
    container: {
      marginHorizontal: tokens.spacing.lg,
      marginTop: tokens.spacing.lg,
    } as ViewStyle,

    card: {
      backgroundColor: tokens.colors.background.secondary,
      borderRadius: tokens.radius.xl,
      overflow: 'hidden',
    } as ViewStyle,

    avatar: {
      width: '100%',
      height: 280,
      resizeMode: 'cover' as const,
    } as ImageStyle,

    infoSection: {
      padding: tokens.spacing.lg,
    } as ViewStyle,

    nameRow: {
      ...flex.rowCenter,
      marginBottom: tokens.spacing.xs,
    } as ViewStyle,

    name: {
      fontSize: tokens.typography.sizes['2xl'],
      fontWeight: tokens.typography.weights.bold,
      color: tokens.colors.text.primary,
    } as TextStyle,

    verificationBadge: {
      marginLeft: tokens.spacing.xs,
    },

    specialty: {
      fontSize: tokens.typography.sizes.sm,
      color: tokens.colors.text.secondary,
      marginBottom: tokens.spacing.md,
    } as TextStyle,

    description: {
      fontSize: tokens.typography.sizes.sm,
      color: tokens.colors.text.primary,
      marginBottom: tokens.spacing.lg,
      lineHeight: tokens.typography.sizes.sm * tokens.typography.lineHeights.normal,
    } as TextStyle,

    actionButtons: {
      flexDirection: 'row',
      width: '100%',
      gap: tokens.spacing.sm,
    } as ViewStyle,
  },

  // ==================== ACTION BUTTONS ====================
  buttons: {
    chatButton: {
      flex: 1,
      borderRadius: tokens.radius.lg,
      paddingVertical: 14,
      alignItems: 'center',
      ...flex.rowCenter,
      justifyContent: 'center',
      backgroundColor: tokens.colors.brand.cloudWhite,
      borderWidth: 1,
      borderColor: tokens.colors.neutral.gray300,
      ...shadows.small,
    } as ViewStyle,

    chatButtonText: {
      fontSize: tokens.typography.sizes.sm,
      fontWeight: tokens.typography.weights.semibold,
      color: tokens.colors.brand.charcoal,
      marginLeft: tokens.spacing.xs,
    } as TextStyle,

    callButton: {
      flex: 1,
      borderRadius: tokens.radius.lg,
      paddingVertical: 14,
      alignItems: 'center',
      ...flex.rowCenter,
      justifyContent: 'center',
      backgroundColor: tokens.colors.brand.serenityBlue,
      ...shadows.small,
    } as ViewStyle,

    callButtonText: {
      fontSize: tokens.typography.sizes.sm,
      fontWeight: tokens.typography.weights.semibold,
      color: tokens.colors.brand.cloudWhite,
      marginLeft: tokens.spacing.xs,
    } as TextStyle,
  },

  // ==================== SPECIALTIES CARD ====================
  specialtiesCard: {
    container: {
      marginHorizontal: tokens.spacing.lg,
      marginTop: tokens.spacing.lg,
    } as ViewStyle,

    card: {
      backgroundColor: tokens.colors.background.secondary,
      borderRadius: tokens.radius.xl,
      padding: tokens.spacing.lg,
    } as ViewStyle,

    title: {
      fontSize: tokens.typography.sizes.base,
      fontWeight: tokens.typography.weights.semibold,
      color: tokens.colors.text.primary,
      marginBottom: tokens.spacing.md,
    } as TextStyle,

    tagContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: tokens.spacing.xs,
    } as ViewStyle,

    tag: {
      backgroundColor: `${tokens.colors.brand.serenityBlue}15`,
      paddingHorizontal: tokens.spacing.sm,
      paddingVertical: tokens.spacing.xs,
      borderRadius: tokens.radius.sm,
    } as ViewStyle,

    tagText: {
      fontSize: tokens.typography.sizes.sm,
      fontWeight: tokens.typography.weights.medium,
      color: tokens.colors.brand.serenityBlue,
    } as TextStyle,
  },

  // ==================== NOT FOUND STATE ====================
  notFound: {
    container: {
      flex: 1,
      backgroundColor: tokens.colors.background.primary,
      alignItems: 'center',
      justifyContent: 'center',
    } as ViewStyle,

    message: {
      fontSize: tokens.typography.sizes.lg,
      color: tokens.colors.text.secondary,
    } as TextStyle,

    backButton: {
      marginTop: tokens.spacing.md,
    } as ViewStyle,

    backButtonText: {
      fontSize: tokens.typography.sizes.sm,
      fontWeight: tokens.typography.weights.medium,
      color: tokens.colors.brand.serenityBlue,
    } as TextStyle,
  },
} as const;

export type AgentDetailStyles = typeof agentDetailStyles;
