/**
 * Home Screen Style Lookup
 * Route: / (tab)
 *
 * Main home feed screen with swipeable agent cards and usage statistics
 */

import { ViewStyle } from 'react-native';
import { tokens } from '../../core/tokens';

export const homeStyles = {
  // ==================== SAFE AREA ====================
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  } as ViewStyle,

  // ==================== CONTAINER ====================
  container: {
    flex: 1,
  } as ViewStyle,
} as const;

export type HomeStyles = typeof homeStyles;
