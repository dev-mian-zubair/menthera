import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

interface CircularProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  useGradient?: boolean;
  gradientColors?: string[];
  showPercentage?: boolean;
  children?: React.ReactNode;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  percentage,
  size = 100,
  strokeWidth = 8,
  color = '#5A86FF',
  backgroundColor = 'rgba(255, 255, 255, 0.2)',
  useGradient = false,
  gradientColors = ['#5A86FF', '#B39DDB'],
  showPercentage = true,
  children,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(Math.max(percentage, 0), 100);
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const center = size / 2;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={gradientColors[0]} stopOpacity="1" />
            <Stop offset="100%" stopColor={gradientColors[1]} stopOpacity="1" />
          </LinearGradient>
        </Defs>

        {/* Background Circle */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Progress Circle */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={useGradient ? 'url(#progressGradient)' : color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>

      {/* Center Content */}
      <View style={styles.centerContent}>
        {children || (
          showPercentage && (
            <Text style={styles.percentageText}>{Math.round(progress)}%</Text>
          )
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContent: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentageText: {
    fontSize: 20,
    fontFamily: 'SFProDisplayBold',
    color: '#FFFFFF',
  },
});
