/**
 * Usage Card Style Lookup
 * Clean horizontal layout - compact and scannable
 */

import { ViewStyle, TextStyle } from 'react-native';
import { tokens } from '../core/tokens';

export const usageCardStyles = {
  // ==================== CONTAINER ====================
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 16,
    marginBottom: 16,
  } as ViewStyle,

  // ==================== HEADER ====================
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  } as ViewStyle,

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  } as ViewStyle,

  planBadge: {
    fontSize: 14,
    fontFamily: 'SFProDisplaySemibold',
    color: '#5A86FF',
    backgroundColor: 'rgba(90, 134, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 100,
    overflow: 'hidden',
  } as TextStyle,

  resetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  } as ViewStyle,

  resetText: {
    fontSize: 13,
    fontFamily: 'SFProDisplayMedium',
    color: '#8E8E93',
  } as TextStyle,

  // ==================== GAUGES GRID ====================
  gaugesGrid: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-around',
  } as ViewStyle,

  gaugeItem: {
    flex: 1,
    alignItems: 'center',
  } as ViewStyle,

  divider: {
    width: 1,
    backgroundColor: '#F0F0F2',
    marginHorizontal: 12,
    alignSelf: 'stretch',
  } as ViewStyle,

  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  } as ViewStyle,

  statLabel: {
    fontSize: 13,
    fontFamily: 'SFProDisplayMedium',
    color: '#8E8E93',
  } as TextStyle,

  statNumbers: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 8,
  } as ViewStyle,

  statValue: {
    fontSize: 22,
    fontFamily: 'SFProDisplayBold',
    color: '#2C2C2C',
    letterSpacing: -0.5,
  } as TextStyle,

  statTotal: {
    fontSize: 14,
    fontFamily: 'SFProDisplayMedium',
    color: '#C7C7CC',
    marginLeft: 2,
  } as TextStyle,

  // ==================== ERROR STATE ====================
  errorContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  } as ViewStyle,

  errorText: {
    fontSize: 14,
    fontFamily: 'SFProDisplayMedium',
    color: '#FF6B6B',
  } as TextStyle,
} as const;

export type UsageCardStyles = typeof usageCardStyles;
