import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';

interface SemiCircleGaugeProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  useGradient?: boolean;
  gradientColors?: string[];
  usedValue?: number | string;
  totalValue?: number | string;
  usedTextColor?: string;
  totalTextColor?: string;
}

export const SemiCircleGauge: React.FC<SemiCircleGaugeProps> = ({
  percentage,
  size = 100,
  strokeWidth = 14,
  color = '#5A86FF',
  backgroundColor = '#F9FAFB',
  useGradient = true,
  gradientColors = ['#6ED7C4', '#5A86FF'],
  usedValue = 0,
  totalValue = 0,
  usedTextColor,
  totalTextColor,
}) => {
  const radius = (size - strokeWidth) / 2;
  const centerX = size / 2;
  const centerY = size / 2;

  // Semi-circle starts at 180° (left) and goes to 0°/360° (right)
  // We need to draw the arc clockwise from left to right along the bottom

  // Background arc - full semi-circle (180° span)
  const backgroundPath = describeArc(centerX, centerY, radius, -180, 0);

  // Progress arc - based on percentage (0% = no arc, 100% = full semi-circle)
  const progress = Math.min(Math.max(percentage, 0), 100);
  const progressEndAngle = -180 + (progress / 100) * 180;
  const progressPath = describeArc(centerX, centerY, radius, -180, progressEndAngle);

  // Helper function to describe an arc
  function describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number) {
    const start = polarToCartesian(x, y, radius, startAngle);
    const end = polarToCartesian(x, y, radius, endAngle);
    const angleDiff = endAngle - startAngle;
    const largeArcFlag = Math.abs(angleDiff) > 180 ? '1' : '0';

    return [
      'M', start.x, start.y,
      'A', radius, radius, 0, largeArcFlag, 1, end.x, end.y
    ].join(' ');
  }

  function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
    const angleInRadians = angleInDegrees * Math.PI / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  }

  // Determine color based on percentage
  const getColor = () => {
    if (useGradient) return 'url(#gaugeGradient)';
    if (progress >= 90) return '#FF6B6B';
    if (progress >= 70) return '#FFD166';
    return color;
  };

  // Format values to show as whole numbers
  const formatValue = (value: number | string): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return Math.round(num).toString();
  };

  return (
    <View style={[styles.container, { width: size, height: size / 2 + 20 }]}>
      <Svg width={size} height={size / 2 + 10} style={styles.svg}>
        <Defs>
          <LinearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={gradientColors[0]} stopOpacity="1" />
            <Stop offset="100%" stopColor={gradientColors[1]} stopOpacity="1" />
          </LinearGradient>
        </Defs>

        {/* Background Arc */}
        <Path
          d={backgroundPath}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
        />

        {/* Progress Arc */}
        {progress > 0 && (
          <Path
            d={progressPath}
            stroke={getColor()}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
          />
        )}
      </Svg>

      {/* Usage Text */}
      <View style={styles.usageContainer}>
        <Text style={[styles.usedText, usedTextColor && { color: usedTextColor }]}>{formatValue(usedValue)}</Text>
        <Text style={[styles.totalText, totalTextColor && { color: totalTextColor }]}>/ {formatValue(totalValue)}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  svg: {
    transform: [{ scaleY: 1 }],
  },
  usageContainer: {
    position: 'absolute',
    bottom: 5,
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  usedText: {
    fontSize: 18,
    fontFamily: 'SFProDisplayBold',
    color: '#2C2C2C',
    letterSpacing: -0.5,
  },
  totalText: {
    fontSize: 12,
    fontFamily: 'SFProDisplayMedium',
    color: '#C7C7CC',
    marginLeft: 2,
  },
});
