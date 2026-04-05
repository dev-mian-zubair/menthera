/**
 * Call Screen Style Lookup
 * Route: /call/[agentId] (fullscreen modal)
 *
 * Dark immersive call interface with GPU-rendered shader orb.
 * Layout: top bar → center orb + avatar → agent name → bottom controls
 */

import { ViewStyle, TextStyle, Platform, Dimensions } from 'react-native';
import { tokens } from '../../core/tokens';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ORB_SIZE = Math.round(SCREEN_WIDTH * 0.65);

export const callStyles = {
  // ==================== MAIN CONTAINER ====================
  safeArea: {
    flex: 1,
  } as ViewStyle,

  // ==================== TOP BAR ====================
  topBar: {
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 12,
    } as ViewStyle,

    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    } as ViewStyle,

    centerInfo: {
      alignItems: 'center',
      flex: 1,
    } as ViewStyle,

    durationText: {
      fontSize: 17,
      fontFamily: 'SFProDisplaySemibold',
      letterSpacing: -0.2,
    } as TextStyle,

    spacer: {
      width: 40,
    } as ViewStyle,
  },

  // ==================== CONTENT CONTAINER ====================
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 160,
  } as ViewStyle,

  // ==================== STATUS TEXT ====================
  statusSection: {
    container: {
      alignItems: 'center',
      marginBottom: 24,
    } as ViewStyle,

    connectingText: {
      fontSize: 15,
      fontFamily: 'SFProDisplaySemibold',
      marginBottom: 8,
      letterSpacing: -0.2,
    } as TextStyle,
  },

  // ==================== ORB + AVATAR ====================
  orbSection: {
    container: {
      alignItems: 'center',
      justifyContent: 'center',
      width: ORB_SIZE,
      height: ORB_SIZE,
    } as ViewStyle,

    avatarOverlay: {
      position: 'absolute',
      alignItems: 'center',
      justifyContent: 'center',
    } as ViewStyle,
  },

  // ==================== QUOTA INDICATOR ====================
  quotaIndicator: {
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      marginTop: 12,
    } as ViewStyle,

    icon: {
      marginRight: 6,
    } as ViewStyle,

    text: {
      fontSize: 13,
      fontFamily: 'SFProDisplayMedium',
      letterSpacing: -0.1,
    } as TextStyle,
  },

  // ==================== AGENT INFO ====================
  agentInfo: {
    container: {
      alignItems: 'center',
      marginTop: 24,
    } as ViewStyle,

    name: {
      fontSize: 24,
      fontFamily: 'SFProDisplayBold',
      marginBottom: 6,
      letterSpacing: -0.4,
    } as TextStyle,

    specialty: {
      fontSize: 14,
      fontFamily: 'SFProDisplayRegular',
      textAlign: 'center',
    } as TextStyle,
  },

  // ==================== CALL CONTROLS ====================
  controls: {
    container: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingTop: 16,
      paddingHorizontal: 24,
      paddingBottom: 48,
    } as ViewStyle,

    handleBar: {
      width: 40,
      height: 4,
      borderRadius: 2,
      alignSelf: 'center',
      marginBottom: 28,
    } as ViewStyle,

    buttonsRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      paddingVertical: 8,
    } as ViewStyle,

    button: {
      width: 72,
      height: 72,
      borderRadius: 36,
      alignItems: 'center',
      justifyContent: 'center',
    } as ViewStyle,
  },

  // ==================== NOT FOUND STATE ====================
  notFound: {
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    } as ViewStyle,

    message: {
      fontSize: 15,
      fontFamily: 'SFProDisplayRegular',
    } as TextStyle,
  },

  // ==================== CONSTANTS ====================
  ORB_SIZE,

  // ==================== SPACER ====================
  spacer: {
    flex: 1,
  } as ViewStyle,

  // Keep legacy references for anything that still uses them
  durationSection: {
    container: {
      alignItems: 'center',
      marginBottom: 40,
    } as ViewStyle,
    durationText: {
      fontSize: 20,
      fontFamily: 'SFProDisplaySemibold',
      letterSpacing: -0.3,
    } as TextStyle,
  },

  avatarSection: {
    container: {
      alignItems: 'center',
      marginBottom: 24,
      marginTop: 20,
    } as ViewStyle,
  },
} as const;

export type CallStyles = typeof callStyles;
