/**
 * Menthera Logo Component
 *
 * Clean, modern logo for Menthera AI Companion
 * Features an abstract "M" icon with AI spark accent
 *
 * @example
 * <MentheraLogo size="medium" />
 * <MentheraLogo size="large" variant="light" />
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { logoStyles } from '@/lib/styles/components/logo.styles';

export interface MentheraLogoProps {
  /**
   * Size variant
   * - small: 40px icon, 16px text
   * - medium: 60px icon, 24px text (default)
   * - large: 80px icon, 32px text
   */
  size?: 'small' | 'medium' | 'large';

  /**
   * Color variant
   * - default: Dark text for light backgrounds
   * - light: Light text for dark backgrounds
   */
  variant?: 'default' | 'light';

  /**
   * Show wordmark text
   * @default true
   */
  showWordmark?: boolean;
}

export const MentheraLogo: React.FC<MentheraLogoProps> = ({
  size = 'medium',
  variant = 'default',
  showWordmark = true,
}) => {
  // Get size-specific styles
  const containerStyle: any = [
    logoStyles.container,
    logoStyles[size],
  ];

  const iconContainerStyle: any = [
    logoStyles.iconContainer,
    logoStyles[`icon${size.charAt(0).toUpperCase() + size.slice(1)}` as keyof typeof logoStyles],
  ];

  const outerCircleStyle: any = [
    logoStyles.outerCircle,
    logoStyles[`outerCircle${size.charAt(0).toUpperCase() + size.slice(1)}` as keyof typeof logoStyles],
  ];

  const innerContainerStyle: any = [
    logoStyles.innerContainer,
    logoStyles[`innerContainer${size.charAt(0).toUpperCase() + size.slice(1)}` as keyof typeof logoStyles],
  ];

  const leftPeakStyle: any = [
    logoStyles.mPeak,
    logoStyles.leftPeak,
    logoStyles[`leftPeak${size.charAt(0).toUpperCase() + size.slice(1)}` as keyof typeof logoStyles],
  ];

  const middlePeakStyle: any = [
    logoStyles.mPeak,
    logoStyles.middlePeak,
    logoStyles[`middlePeak${size.charAt(0).toUpperCase() + size.slice(1)}` as keyof typeof logoStyles],
  ];

  const rightPeakStyle: any = [
    logoStyles.mPeak,
    logoStyles.rightPeak,
    logoStyles[`rightPeak${size.charAt(0).toUpperCase() + size.slice(1)}` as keyof typeof logoStyles],
  ];

  const accentDotStyle: any = [
    logoStyles.accentDot,
    logoStyles[`accentDot${size.charAt(0).toUpperCase() + size.slice(1)}` as keyof typeof logoStyles],
  ];

  const wordmarkStyle: any = [
    logoStyles.wordmark,
    logoStyles[`wordmark${size.charAt(0).toUpperCase() + size.slice(1)}` as keyof typeof logoStyles],
    ...(variant === 'light' ? [logoStyles.wordmarkLight] : []),
  ];

  return (
    <View style={containerStyle}>
      {/* Icon */}
      <View style={iconContainerStyle}>
        {/* Outer circle */}
        <View style={outerCircleStyle} />

        {/* Inner "M" shape */}
        <View style={innerContainerStyle}>
          <View style={leftPeakStyle} />
          <View style={middlePeakStyle} />
          <View style={rightPeakStyle} />
        </View>

        {/* Accent dot (AI spark) */}
        <View style={accentDotStyle} />
      </View>

      {/* Wordmark */}
      {showWordmark && (
        <Text style={wordmarkStyle}>Menthera</Text>
      )}
    </View>
  );
};
