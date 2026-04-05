/**
 * Profile Screen Style Lookup
 * Route: /profile (tab)
 *
 * Full screen profile with user info, stats, billing, and settings
 */

import { ViewStyle, TextStyle } from 'react-native';

export const profileStyles = {
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

  // ==================== SCROLL CONTENT ====================
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 140,
    flexGrow: 1,
  } as ViewStyle,

  // ==================== USER CARD ====================
  userCard: {
    container: {
      backgroundColor: '#FFFFFF',
      borderRadius: 28,
      padding: 24,
      marginBottom: 16,
      alignItems: 'center',
    } as ViewStyle,

    avatarContainer: {
      marginBottom: 16,
    } as ViewStyle,

    name: {
      fontSize: 20,
      fontFamily: 'SFProDisplayBold',
      color: '#2C2C2C',
      marginBottom: 4,
      letterSpacing: -0.3,
    } as TextStyle,

    email: {
      fontSize: 14,
      fontFamily: 'SFProDisplayRegular',
      color: '#8E8E93',
    } as TextStyle,
  },

  // ==================== STATS CARD ====================
  statsCard: {
    container: {
      backgroundColor: '#FFFFFF',
      borderRadius: 28,
      padding: 20,
      marginBottom: 16,
    } as ViewStyle,

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    } as ViewStyle,

    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#5A86FF',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    } as ViewStyle,

    title: {
      fontSize: 17,
      fontFamily: 'SFProDisplaySemibold',
      color: '#2C2C2C',
      letterSpacing: -0.2,
    } as TextStyle,

    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    } as ViewStyle,

    stat: {
      flex: 1,
      alignItems: 'center',
    } as ViewStyle,

    statValue: {
      fontSize: 24,
      fontFamily: 'SFProDisplayBold',
      color: '#2C2C2C',
      marginBottom: 4,
      letterSpacing: -0.4,
    } as TextStyle,

    statLabel: {
      fontSize: 12,
      fontFamily: 'SFProDisplayRegular',
      color: '#8E8E93',
      textAlign: 'center',
    } as TextStyle,

    statUsage: {
      fontSize: 11,
      fontFamily: 'SFProDisplayRegular',
      color: '#C4C4C8',
      textAlign: 'center',
      marginTop: 2,
    } as TextStyle,

    divider: {
      width: 1,
      backgroundColor: '#E5E7EB',
      marginHorizontal: 16,
    } as ViewStyle,

    errorText: {
      fontSize: 14,
      fontFamily: 'SFProDisplayRegular',
      color: '#DC2626',
      textAlign: 'center',
      marginVertical: 12,
    } as TextStyle,

    progressSection: {
      marginTop: 16,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: '#E5E7EB',
    } as ViewStyle,

    progressItem: {
      marginBottom: 12,
    } as ViewStyle,

    progressHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    } as ViewStyle,

    progressLabel: {
      fontSize: 13,
      fontFamily: 'SFProDisplayMedium',
      color: '#2C2C2C',
    } as TextStyle,

    progressPercent: {
      fontSize: 13,
      fontFamily: 'SFProDisplaySemibold',
      color: '#5A86FF',
    } as TextStyle,

    progressBar: {
      height: 8,
      backgroundColor: '#E5E7EB',
      borderRadius: 4,
      overflow: 'hidden',
    } as ViewStyle,

    progressFill: {
      height: '100%',
      borderRadius: 4,
    } as ViewStyle,
  },

  // ==================== SECTION ====================
  section: {
    container: {
      marginBottom: 16,
    } as ViewStyle,

    title: {
      fontSize: 17,
      fontFamily: 'SFProDisplaySemibold',
      color: '#2C2C2C',
      marginBottom: 12,
      letterSpacing: -0.2,
    } as TextStyle,
  },

  // ==================== MENU ITEM ====================
  menuItem: {
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      backgroundColor: '#FFFFFF',
      borderRadius: 28,
      marginBottom: 12,
    } as ViewStyle,

    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    } as ViewStyle,

    content: {
      flex: 1,
    } as ViewStyle,

    title: {
      fontSize: 15,
      fontFamily: 'SFProDisplaySemibold',
      color: '#2C2C2C',
      marginBottom: 2,
      letterSpacing: -0.2,
    } as TextStyle,

    subtitle: {
      fontSize: 13,
      fontFamily: 'SFProDisplayRegular',
      color: '#8E8E93',
    } as TextStyle,
  },

  // ==================== DANGER ZONE ====================
  dangerZone: {
    container: {
      backgroundColor: '#FFF5F5',
      borderRadius: 28,
      padding: 16,
    } as ViewStyle,

    warning: {
      fontSize: 13,
      fontFamily: 'SFProDisplayRegular',
      color: '#8E8E93',
      marginBottom: 12,
      lineHeight: 18,
    } as TextStyle,

    deleteButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      backgroundColor: '#FFFFFF',
      borderRadius: 20,
    } as ViewStyle,

    deleteTitle: {
      fontSize: 15,
      fontFamily: 'SFProDisplaySemibold',
      color: '#DC2626',
      marginBottom: 2,
      letterSpacing: -0.2,
    } as TextStyle,

    deleteSubtitle: {
      fontSize: 13,
      fontFamily: 'SFProDisplayRegular',
      color: '#EF4444',
    } as TextStyle,
  },

  // ==================== SIGN OUT BUTTON ====================
  signOutButton: {
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      paddingHorizontal: 24,
      backgroundColor: '#FFFFFF',
      borderRadius: 28,
    } as ViewStyle,

    text: {
      fontSize: 15,
      fontFamily: 'SFProDisplaySemibold',
      color: '#8E8E93',
      letterSpacing: -0.2,
    } as TextStyle,
  },
} as const;

export type ProfileStyles = typeof profileStyles;
