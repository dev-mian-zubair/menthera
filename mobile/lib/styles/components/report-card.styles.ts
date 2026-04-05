/**
 * Report Notification Card Styles
 * Used for quest completion notifications in chat
 */

import { ViewStyle, TextStyle } from 'react-native';

export const reportCardStyles = {
  // ==================== OUTER CONTAINER ====================
  outerContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  } as ViewStyle,

  // ==================== CONTAINER ====================
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  } as ViewStyle,

  // Inner content wrapper
  contentWrapper: {
    padding: 16,
  } as ViewStyle,

  // ==================== HEADER ====================
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  } as ViewStyle,

  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  } as ViewStyle,

  icon: {
    fontSize: 26,
  } as TextStyle,

  headerText: {
    flex: 1,
    justifyContent: 'center',
  } as ViewStyle,

  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 6,
  } as ViewStyle,

  badgeText: {
    fontSize: 10,
    fontFamily: 'SFProDisplaySemibold',
    color: '#FFFFFF',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  } as TextStyle,

  title: {
    fontSize: 17,
    fontFamily: 'SFProDisplayBold',
    color: '#000000',
    marginBottom: 4,
    letterSpacing: -0.3,
    lineHeight: 22,
  } as TextStyle,

  description: {
    fontSize: 14,
    fontFamily: 'SFProDisplayRegular',
    color: '#666666',
    lineHeight: 19,
    letterSpacing: -0.1,
  } as TextStyle,

  // ==================== TIMESTAMP ====================
  timestamp: {
    fontSize: 11,
    fontFamily: 'SFProDisplayRegular',
    color: '#8E8E93',
    textAlign: 'right',
    marginTop: 8,
  } as TextStyle,
} as const;

export type ReportCardStyles = typeof reportCardStyles;
