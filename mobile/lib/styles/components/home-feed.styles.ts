/**
 * Home Feed Component Style Lookup
 *
 * Premium glassmorphic design with vertical agent cards,
 * floating decorations, and gentle animations.
 */

import { ViewStyle, TextStyle, ImageStyle, Platform } from 'react-native';
import { tokens } from '../core/tokens';

export const homeFeedStyles = {
  // ==================== CONTAINER ====================
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  } as ViewStyle,

  // ==================== SCROLL VIEW ====================
  scrollView: {
    flex: 1,
    backgroundColor: 'transparent',
  } as ViewStyle,

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 100,
    flexGrow: 1,
  } as ViewStyle,

  // ==================== HEADER ====================
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: 'transparent',
    zIndex: 10,
  } as ViewStyle,

  headerTitle: {
    fontSize: 22,
    fontFamily: 'SFProDisplayBold',
    color: '#000000',
    letterSpacing: -0.3,
  } as TextStyle,

  headerIcon: {
    padding: 8,
    marginRight: -8,
  } as ViewStyle,

  headerIconColor: tokens.colors.brand.mutedGray,

  // ==================== USAGE CARD ====================
  usageCard: {
    marginBottom: 8,
  } as ViewStyle,

  // ==================== AGENTS LIST ====================
  agentsList: {
    gap: 16,
  } as ViewStyle,

  // ==================== AGENT CARD - HORIZONTAL COMPACT DESIGN ====================
  agentCard: {
    // Main card container with left accent stripe
    container: {
      backgroundColor: '#FFFFFF',
      borderRadius: 20,
      marginBottom: 8,
      overflow: 'hidden',
      flexDirection: 'row',
    } as ViewStyle,

    // Left accent stripe (4px, agent color)
    accentStripe: {
      width: 4,
      backgroundColor: '#5A86FF',
    } as ViewStyle,

    // Main card content (everything except accent stripe)
    cardContent: {
      flex: 1,
      flexDirection: 'row',
      padding: 12,
    } as ViewStyle,

    // Avatar section (left side - vertical stack: avatar, name, specialty)
    avatarSection: {
      marginRight: 12,
      alignItems: 'center',
      width: 80,
    } as ViewStyle,

    avatarContainer: {
      width: 60,
      height: 60,
      borderRadius: 16,
      overflow: 'hidden',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      borderWidth: 2,
      borderColor: 'rgba(255, 255, 255, 0.9)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 6,
    } as ViewStyle,

    avatarWrapper: {
      width: '100%',
      height: '100%',
    } as ViewStyle,

    // Online indicator (green dot)
    onlineIndicator: {
      position: 'absolute',
      top: 48,
      right: 8,
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: '#22C55E',
      borderWidth: 2,
      borderColor: '#FFFFFF',
    } as ViewStyle,

    // Info section (right side - description + buttons)
    infoSection: {
      flex: 1,
      justifyContent: 'center',
    } as ViewStyle,

    // Name row (legacy - keeping for compatibility)
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 2,
    } as ViewStyle,

    name: {
      fontSize: 13,
      fontFamily: 'SFProDisplayBold',
      color: '#1F2937',
      letterSpacing: -0.2,
      textAlign: 'center',
      marginBottom: 4,
    } as TextStyle,

    // Specialty badge (pill)
    specialtyBadge: {
      backgroundColor: '#E0EAFF',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
      alignSelf: 'center',
    } as ViewStyle,

    domainBadge: {
      backgroundColor: '#E0EAFF',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
      alignSelf: 'center',
    } as ViewStyle,

    domainText: {
      fontSize: 9,
      fontFamily: 'SFProDisplayMedium',
      color: '#5A86FF',
    } as TextStyle,

    // Description (3 lines max)
    description: {
      fontSize: 13,
      fontFamily: 'SFProDisplayRegular',
      color: '#6B7280',
      lineHeight: 17,
      marginBottom: 10,
    } as TextStyle,

    // Action buttons row
    actions: {
      flexDirection: 'row',
      gap: 10,
    } as ViewStyle,

    // Primary button (Chat) - filled with agent color
    primaryButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#5A86FF',
      borderRadius: 20,
      height: 38,
      gap: 5,
    } as ViewStyle,

    primaryButtonText: {
      fontSize: 13,
      fontFamily: 'SFProDisplaySemibold',
      color: '#FFFFFF',
    } as TextStyle,

    // Secondary button (Call) - light bg with agent color text
    secondaryButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#E0EAFF',
      borderRadius: 20,
      height: 38,
      gap: 5,
    } as ViewStyle,

    secondaryButtonText: {
      fontSize: 13,
      fontFamily: 'SFProDisplaySemibold',
      color: '#5A86FF',
    } as TextStyle,

    // Legacy button styles (keeping for compatibility)
    chatButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#5A86FF',
      borderRadius: 20,
      height: 38,
      gap: 5,
    } as ViewStyle,

    callButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#E0EAFF',
      borderRadius: 20,
      height: 38,
      gap: 5,
    } as ViewStyle,

    buttonText: {
      fontSize: 13,
      fontFamily: 'SFProDisplaySemibold',
      color: '#FFFFFF',
    } as TextStyle,

    // Quest/Personalization CTA at bottom
    questCta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 8,
    } as ViewStyle,

    questCtaText: {
      fontSize: 13,
      fontFamily: 'SFProDisplayMedium',
      color: '#5A86FF',
    } as TextStyle,

    // Personalized badge
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(110, 215, 196, 0.15)',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
      gap: 4,
      marginTop: 8,
      alignSelf: 'flex-start',
    } as ViewStyle,

    badgeText: {
      fontSize: 11,
      fontFamily: 'SFProDisplaySemibold',
      color: '#059669',
    } as TextStyle,

    // Quest link for non-completed (legacy - keeping for compatibility)
    questLink: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 8,
    } as ViewStyle,

    questLinkText: {
      fontSize: 12,
      fontFamily: 'SFProDisplaySemibold',
      color: '#5A86FF',
    } as TextStyle,

    // Quest progress indicator
    questProgress: {
      height: 4,
      backgroundColor: 'rgba(0, 0, 0, 0.05)',
      borderRadius: 2,
      marginTop: 8,
      marginBottom: 4,
      overflow: 'hidden',
    } as ViewStyle,

    questProgressFill: {
      height: '100%',
      borderRadius: 2,
    } as ViewStyle,

    // Lock badge (top-right)
    lockBadge: {
      position: 'absolute',
      top: 12,
      right: 12,
      zIndex: 10,
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderRadius: 12,
      padding: 6,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    } as ViewStyle,

    // Locked overlay (frosted effect)
    lockedOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 5,
      ...Platform.select({
        ios: {
          backgroundColor: 'rgba(255, 255, 255, 0.6)',
        },
        android: {
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
        },
      }),
    } as ViewStyle,

    // Legacy styles (keeping for backwards compatibility)
    gradientHeader: {
      display: 'none',
    } as ViewStyle,

    content: {
      flex: 1,
    } as ViewStyle,

    mainContent: {
      flexDirection: 'row',
      gap: 12,
      height: 135,
      padding: 12,
    } as ViewStyle,

    imageContainer: {
      width: 90,
      height: 100,
      borderRadius: 16,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
    } as ViewStyle,

    image: {
      width: '100%',
      height: '100%',
    } as ImageStyle,

    personalizedBadge: {
      position: 'absolute',
      top: 8,
      right: 8,
      zIndex: 10,
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      padding: 2,
    } as ViewStyle,

    questButton: {
      width: 40,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#FFFFFF',
      borderWidth: 1.5,
      borderColor: '#E5E7EB',
      borderRadius: 20,
    } as ViewStyle,
  },

  // ==================== QUICK ACTIONS - GLASS STYLE ====================
  quickActions: {
    container: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 20,
      marginBottom: 8,
    } as ViewStyle,

    button: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 20,
      paddingVertical: 16,
      gap: 8,
      // Glass effect
      borderWidth: 1,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 2,
    } as ViewStyle,

    buttonText: {
      fontSize: 15,
      fontFamily: 'SFProDisplaySemibold',
    } as TextStyle,
  },

  // ==================== HERO SECTION ====================
  hero: {
    container: {
      paddingHorizontal: 4,
      paddingTop: 8,
      paddingBottom: 8,
    } as ViewStyle,

    topRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 4,
    } as ViewStyle,

    greetingContainer: {
      flex: 1,
    } as ViewStyle,

    greetingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    } as ViewStyle,

    greetingText: {
      fontSize: 36, // Increased from 28
      fontFamily: 'SFProDisplayBold',
      letterSpacing: -0.5,
    } as TextStyle,

    greetingEmoji: {
      fontSize: 28, // Increased from 24
    } as TextStyle,

    userName: {
      fontSize: 36, // Increased from 28
      fontFamily: 'SFProDisplayBold',
      color: '#5A86FF',
      letterSpacing: -0.5,
    } as TextStyle,

    subtitle: {
      fontSize: 15,
      fontFamily: 'SFProDisplayRegular',
      marginTop: 6,
    } as TextStyle,

    settingsButton: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 22,
      backgroundColor: 'rgba(255, 255, 255, 0.5)',
    } as ViewStyle,
  },

  // ==================== SECTION HEADER ====================
  sectionHeader: {
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 4,
      marginTop: 12,
      marginBottom: 16,
    } as ViewStyle,

    title: {
      fontSize: 20,
      fontFamily: 'SFProDisplaySemibold',
      letterSpacing: -0.3,
    } as TextStyle,

    linkText: {
      fontSize: 14,
      fontFamily: 'SFProDisplayMedium',
    } as TextStyle,
  },

  // ==================== EMPTY STATE ====================
  emptyState: {
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
      paddingHorizontal: 40,
    } as ViewStyle,

    iconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: '#F3F4F6',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
    } as ViewStyle,

    title: {
      fontSize: 20,
      fontFamily: 'SFProDisplayBold',
      color: '#1F2937',
      marginBottom: 8,
      textAlign: 'center',
    } as TextStyle,

    message: {
      fontSize: 15,
      fontFamily: 'SFProDisplayRegular',
      color: '#6B7280',
      textAlign: 'center',
      lineHeight: 22,
    } as TextStyle,
  },
} as const;

export type HomeFeedStyles = typeof homeFeedStyles;
