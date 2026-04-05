/**
 * Chat Screen Style Lookup
 * Route: /chat (tab)
 *
 * Chat interface for messaging with selected AI agent
 * Features: Header, messages, input, agent switching modal
 */

import { ViewStyle, TextStyle, ImageStyle } from 'react-native';

export const chatStyles = {
  // ==================== MAIN CONTAINER ====================
  container: {
    flex: 1,
    backgroundColor: '#FBF7F4',
  } as ViewStyle,

  safeArea: {
    flex: 1,
    backgroundColor: '#FBF7F4',
  } as ViewStyle,

  keyboardAvoid: {
    flex: 1,
  } as ViewStyle,

  // ==================== HEADER ====================
  header: {
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: '#FBF7F4',
      borderBottomWidth: 0,
    } as ViewStyle,

    backButton: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    } as ViewStyle,

    centerGroup: {
      flex: 1,
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    } as ViewStyle,

    avatarContainer: {
      position: 'relative',
      marginBottom: 4,
    } as ViewStyle,

    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#F0F0F0',
    } as ImageStyle,

    onlineIndicator: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: '#4CD964',
      borderWidth: 2,
      borderColor: '#FFFFFF',
    } as ViewStyle,

    onboardingBadge: {
      position: 'absolute',
      top: -4,
      right: -4,
      width: 20,
      height: 20,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: '#FFFFFF',
    } as ViewStyle,

    badgeText: {
      fontSize: 10,
      fontFamily: 'SFProDisplayBold',
      color: '#FFFFFF',
    } as TextStyle,

    agentName: {
      fontSize: 16,
      fontFamily: 'SFProDisplaySemibold',
      color: '#2C2C2C',
      letterSpacing: -0.2,
      textAlign: 'center',
    } as TextStyle,

    agentSpecialty: {
      fontSize: 12,
      fontFamily: 'SFProDisplayRegular',
      color: '#8E8E93',
      marginTop: 2,
      textAlign: 'center',
    } as TextStyle,

    rightActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    } as ViewStyle,

    iconButton: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
    } as ViewStyle,
  },

  // ==================== MESSAGES AREA ====================
  messages: {
    scrollView: {
      flex: 1,
      backgroundColor: '#FBF7F4',
    } as ViewStyle,

    scrollContent: {
      paddingHorizontal: 16,
      paddingVertical: 20,
      paddingBottom: 20,
      flexGrow: 1,
    } as ViewStyle,

    messageContainer: {
      flexDirection: 'row',
      marginBottom: 8,
    } as ViewStyle,

    messageContainerUser: {
      justifyContent: 'flex-end',
    } as ViewStyle,

    messageContainerAgent: {
      justifyContent: 'flex-start',
    } as ViewStyle,

    bubbleWrapper: {
      position: 'relative',
      maxWidth: '75%',
    } as ViewStyle,

    bubble: {
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: 8,
    } as ViewStyle,

    bubbleUser: {
      backgroundColor: '#007AFF',
      borderBottomLeftRadius: 16,
    } as ViewStyle,

    bubbleAgent: {
      backgroundColor: '#FFFFFF',
      borderBottomRightRadius: 16,
    } as ViewStyle,

    bubbleWithoutTail: {
      // For messages that are not the last in a group
    } as ViewStyle,

    bubbleUserWithoutTail: {
      borderBottomRightRadius: 8,
    } as ViewStyle,

    bubbleAgentWithoutTail: {
      borderBottomLeftRadius: 12,
    } as ViewStyle,

    messageText: {
      fontSize: 18,
      fontFamily: 'SFProDisplayRegular',
      lineHeight: 24,
    } as TextStyle,

    messageTextUser: {
      color: '#FFFFFF',
    } as TextStyle,

    messageTextAgent: {
      color: '#000000',
    } as TextStyle,

    timestamp: {
      fontSize: 11,
      fontFamily: 'SFProDisplayRegular',
      marginTop: 2,
    } as TextStyle,

    timestampUser: {
      color: 'rgba(255, 255, 255, 0.7)',
      textAlign: 'right',
    } as TextStyle,

    timestampAgent: {
      color: '#8E8E93',
      textAlign: 'left',
    } as TextStyle,

    // Skeleton loader
    skeletonContainer: {
      marginBottom: 16,
      gap: 12,
    } as ViewStyle,

    skeletonBubbleUser: {
      width: '60%',
      height: 48,
      backgroundColor: '#E0E0E0',
      borderRadius: 18,
      opacity: 0.3,
      alignSelf: 'flex-end',
    } as ViewStyle,

    skeletonBubbleAgent: {
      width: '70%',
      height: 48,
      backgroundColor: '#E0E0E0',
      borderRadius: 18,
      opacity: 0.4,
      alignSelf: 'flex-start',
    } as ViewStyle,
  },

  // ==================== INPUT AREA ====================
  input: {
    container: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 12,
      backgroundColor: '#FBF7F4',
      borderTopWidth: 0,
    } as ViewStyle,

    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      backgroundColor: '#FFFFFF',
      borderRadius: 24,
      paddingLeft: 16,
      paddingRight: 4,
      paddingVertical: 4,
      minHeight: 44,
      borderWidth: 1,
      borderColor: '#3C3939',
    } as ViewStyle,

    textInput: {
      flex: 1,
      fontSize: 15,
      fontFamily: 'SFProDisplayRegular',
      color: '#2C2C2C',
      maxHeight: 100,
      paddingVertical: 8,
      paddingRight: 8,
    } as TextStyle,

    actionButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    } as ViewStyle,
  },

  // ==================== AGENT SELECTION MODAL ====================
  modal: {
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
      zIndex: 1000,
    } as ViewStyle,

    touchableOverlay: {
      flex: 1,
    } as ViewStyle,

    content: {
      backgroundColor: '#FBF7F4',
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingTop: 12,
      maxHeight: '75%',
      zIndex: 1001,
    } as ViewStyle,

    handleBar: {
      width: 40,
      height: 4,
      backgroundColor: '#E0E0E0',
      borderRadius: 2,
      alignSelf: 'center',
      marginBottom: 16,
    } as ViewStyle,

    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      marginBottom: 8,
    } as ViewStyle,

    headerTitleGroup: {} as ViewStyle,

    headerTitle: {
      fontSize: 22,
      fontFamily: 'SFProDisplayBold',
      color: '#2C2C2C',
      marginBottom: 4,
      letterSpacing: -0.3,
    } as TextStyle,

    headerSubtitle: {
      fontSize: 13,
      fontFamily: 'SFProDisplayRegular',
      color: '#8E8E93',
    } as TextStyle,

    closeButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
    } as ViewStyle,

    agentsList: {
      paddingHorizontal: 20,
      marginTop: 16,
    } as ViewStyle,

    agentItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 14,
      borderRadius: 28,
      marginBottom: 10,
      backgroundColor: '#FFFFFF',
    } as ViewStyle,

    agentItemDefault: {
    } as ViewStyle,

    agentItemSelected: {
      borderTopWidth: 1,
      borderLeftWidth: 1,
      borderRightWidth: 3,
      borderBottomWidth: 3,
      borderColor: '#5A86FF',
    } as ViewStyle,

    agentAvatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    } as ViewStyle,

    agentInfo: {
      flex: 1,
    } as ViewStyle,

    agentNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
      flexWrap: 'wrap',
    } as ViewStyle,

    agentName: {
      fontSize: 15,
      fontFamily: 'SFProDisplaySemibold',
      color: '#2C2C2C',
      letterSpacing: -0.2,
      marginRight: 6,
    } as TextStyle,

    agentDomainBadge: {
      backgroundColor: '#E0EAFF',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 10,
    } as ViewStyle,

    agentDomainText: {
      fontSize: 10,
      fontFamily: 'SFProDisplayMedium',
      color: '#5A86FF',
    } as TextStyle,

    agentDescription: {
      fontSize: 12,
      fontFamily: 'SFProDisplayRegular',
      color: '#8E8E93',
      lineHeight: 16,
    } as TextStyle,

    agentSpecialty: {
      fontSize: 12,
      fontFamily: 'SFProDisplayRegular',
      color: '#8E8E93',
    } as TextStyle,

    selectionIndicator: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    } as ViewStyle,

    selectionIndicatorSelected: {
      backgroundColor: '#5A86FF',
      borderTopWidth: 1,
      borderLeftWidth: 1,
      borderRightWidth: 2,
      borderBottomWidth: 2,
      borderColor: '#4A76EF',
    } as ViewStyle,

    selectionIndicatorUnselected: {
      borderTopWidth: 1,
      borderLeftWidth: 1,
      borderRightWidth: 2,
      borderBottomWidth: 2,
      borderColor: '#E0E0E0',
      backgroundColor: '#FFFFFF',
    } as ViewStyle,
  },

  // ==================== SAFEGUARD MODAL ====================
  safeGuard: {
    scrollView: {
      paddingHorizontal: 20,
    } as ViewStyle,

    section: {
      marginTop: 16,
    } as ViewStyle,

    featureItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 20,
    } as ViewStyle,

    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
      borderTopWidth: 1,
      borderLeftWidth: 1,
      borderRightWidth: 2,
      borderBottomWidth: 2,
      borderColor: 'rgba(0, 0, 0, 0.1)',
    } as ViewStyle,

    featureContent: {
      flex: 1,
    } as ViewStyle,

    featureTitle: {
      fontSize: 16,
      fontFamily: 'SFProDisplaySemibold',
      color: '#2C2C2C',
      marginBottom: 4,
      letterSpacing: -0.2,
    } as TextStyle,

    featureDescription: {
      fontSize: 14,
      fontFamily: 'SFProDisplayRegular',
      color: '#8E8E93',
      lineHeight: 20,
    } as TextStyle,

    infoCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: '#EFF6FF',
      borderRadius: 16,
      padding: 16,
      marginTop: 8,
      marginBottom: 24,
      borderTopWidth: 1,
      borderLeftWidth: 1,
      borderRightWidth: 2,
      borderBottomWidth: 2,
      borderColor: '#BFDBFE',
    } as ViewStyle,

    infoText: {
      flex: 1,
      fontSize: 13,
      fontFamily: 'SFProDisplayRegular',
      color: '#1E40AF',
      lineHeight: 18,
    } as TextStyle,
  },
} as const;

export type ChatStyles = typeof chatStyles;
