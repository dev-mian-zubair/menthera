/**
 * Call Info Sheet Component Style Lookup
 *
 * Modal sheet displaying detailed information about a specific call
 * Features: Modal overlay, header, agent info, call details card, summary, action buttons
 */

import { ViewStyle, TextStyle, Platform } from 'react-native';
import { tokens } from '../core/tokens';
import { shadows, flex } from '../core/mixins';

export const callInfoSheetStyles = {
  // ==================== MODAL ====================
  modal: {
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    } as ViewStyle,

    touchableOverlay: {
      flex: 1,
    } as ViewStyle,

    content: {
      backgroundColor: '#FBF7F4',
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingTop: 12,
      height: '90%',
    } as ViewStyle,

    handleBar: {
      width: 40,
      height: 4,
      backgroundColor: '#E0E0E0',
      borderRadius: 2,
      alignSelf: 'center',
      marginBottom: 16,
    } as ViewStyle,
  },

  // ==================== HEADER ====================
  header: {
    container: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      marginBottom: 8,
    } as ViewStyle,

    textGroup: {} as ViewStyle,

    title: {
      fontSize: 22,
      fontFamily: 'SFProDisplayBold',
      color: '#2C2C2C',
      marginBottom: 4,
      letterSpacing: -0.3,
    } as TextStyle,

    subtitle: {
      fontSize: 13,
      fontFamily: 'SFProDisplayRegular',
      color: '#8E8E93',
    } as TextStyle,

    closeButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: '#FFFFFF',
      ...flex.center,
      borderWidth: 1,
      borderColor: '#E5E7EB',
    } as ViewStyle,
  },

  // ==================== SCROLL CONTENT ====================
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    flexGrow: 1,
  } as ViewStyle,

  // ==================== AGENT INFO ====================
  agentInfo: {
    container: {
      alignItems: 'center',
      marginBottom: 24,
    } as ViewStyle,

    avatarContainer: {
      marginBottom: 12,
    } as ViewStyle,

    name: {
      fontSize: 20,
      fontFamily: 'SFProDisplayBold',
      color: '#2C2C2C',
      marginBottom: 4,
      letterSpacing: -0.3,
    } as TextStyle,
  },

  // ==================== CALL INFO CARD ====================
  callInfoCard: {
    container: {
      backgroundColor: '#FFFFFF',
      borderRadius: 28,
      padding: 16,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      marginBottom: 16,
    } as ViewStyle,

    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    } as ViewStyle,

    rowWithMargin: {
      marginBottom: 12,
    } as ViewStyle,

    label: {
      fontSize: 13,
      fontFamily: 'SFProDisplaySemibold',
      color: '#8E8E93',
    } as TextStyle,

    value: {
      fontSize: 15,
      fontFamily: 'SFProDisplayBold',
      color: '#2C2C2C',
      letterSpacing: -0.2,
    } as TextStyle,

    statusRow: {
      ...flex.rowCenter,
    } as ViewStyle,

    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 6,
    } as ViewStyle,

    statusDotCompleted: {
      backgroundColor: tokens.colors.brand.gentleMint,
    } as ViewStyle,

    statusDotMissed: {
      backgroundColor: tokens.colors.brand.warmCoral,
    } as ViewStyle,
  },

  // ==================== SUMMARY CARD ====================
  summaryCard: {
    container: {
      backgroundColor: '#FFFFFF',
      borderRadius: 28,
      padding: 16,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      marginBottom: 24,
    } as ViewStyle,

    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    } as ViewStyle,

    headerLeft: {
      ...flex.rowCenter,
    } as ViewStyle,

    title: {
      fontSize: 15,
      fontFamily: 'SFProDisplayBold',
      color: '#2C2C2C',
      marginLeft: 8,
      letterSpacing: -0.2,
    } as TextStyle,

    text: {
      fontSize: 15,
      fontFamily: 'SFProDisplayRegular',
      color: '#8E8E93',
      lineHeight: 22,
      marginTop: 10,
    } as TextStyle,
  },

  // ==================== ACTIONS ====================
  actions: {
    container: {
      gap: 12,
    } as ViewStyle,

    callAgainButton: {
      backgroundColor: '#5A86FF',
      borderRadius: 28,
      paddingVertical: 14,
      ...flex.rowCenter,
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: '#4A76EF',
    } as ViewStyle,

    callAgainButtonText: {
      fontSize: 15,
      fontFamily: 'SFProDisplaySemibold',
      color: '#FFFFFF',
      marginLeft: 8,
      letterSpacing: -0.2,
    } as TextStyle,

    messageButton: {
      backgroundColor: '#FFFFFF',
      borderRadius: 28,
      paddingVertical: 14,
      ...flex.rowCenter,
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: '#E5E7EB',
    } as ViewStyle,

    messageButtonText: {
      fontSize: 15,
      fontFamily: 'SFProDisplaySemibold',
      color: '#2C2C2C',
      marginLeft: 8,
      letterSpacing: -0.2,
    } as TextStyle,
  },
} as const;

export type CallInfoSheetStyles = typeof callInfoSheetStyles;
