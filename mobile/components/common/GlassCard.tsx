/**
 * GlassCard - Reusable Glassmorphic Card Component
 *
 * A premium card component with translucent background, subtle border,
 * and soft shadow for a modern glass-like appearance.
 */

import React from 'react';
import { View, ViewStyle, StyleSheet, Platform } from 'react-native';

interface GlassCardProps {
  children: React.ReactNode;
  /** Custom styles to merge with glass card base styles */
  style?: ViewStyle;
  /** Background color with transparency (default from theme) */
  backgroundColor?: string;
  /** Border color with transparency (default from theme) */
  borderColor?: string;
  /** Shadow color (default: rgba(0, 0, 0, 0.08)) */
  shadowColor?: string;
  /** Border radius (default: 24) */
  borderRadius?: number;
  /** Padding inside the card (default: 16) */
  padding?: number;
  /** Whether to show the border (default: true) */
  showBorder?: boolean;
  /** Whether to show the shadow (default: true) */
  showShadow?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  backgroundColor = 'rgba(255, 255, 255, 0.7)',
  borderColor = 'rgba(255, 255, 255, 0.3)',
  shadowColor = 'rgba(0, 0, 0, 0.08)',
  borderRadius = 24,
  padding = 16,
  showBorder = true,
  showShadow = true,
}) => {
  const glassStyle: ViewStyle = {
    backgroundColor,
    borderRadius,
    padding,
    ...(showBorder && {
      borderWidth: 1,
      borderColor,
    }),
    ...(showShadow && {
      shadowColor,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 1,
      shadowRadius: 24,
      elevation: 4,
    }),
  };

  return (
    <View style={[styles.container, glassStyle, style]}>
      {children}
    </View>
  );
};

/**
 * Preset glass card styles for different contexts
 */
export const glassPresets = {
  /** Default white glass for light themes */
  light: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: 'rgba(0, 0, 0, 0.08)',
  },
  /** Subtle glass with less opacity */
  subtle: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: 'rgba(0, 0, 0, 0.05)',
  },
  /** Dark glass for night mode */
  dark: {
    backgroundColor: 'rgba(30, 27, 75, 0.7)',
    borderColor: 'rgba(99, 102, 241, 0.2)',
    shadowColor: 'rgba(0, 0, 0, 0.3)',
  },
  /** Highlighted glass with stronger presence */
  elevated: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderColor: 'rgba(255, 255, 255, 0.4)',
    shadowColor: 'rgba(0, 0, 0, 0.12)',
  },
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});

export default GlassCard;
