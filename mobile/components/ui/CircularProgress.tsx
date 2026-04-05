import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

interface CircularProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  showPercentage?: boolean;
  children?: React.ReactNode;
  duration?: number;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export const CircularProgress: React.FC<CircularProgressProps> = ({
  percentage,
  size = 120,
  strokeWidth = 8,
  color = '#5A86FF',
  backgroundColor = '#E5E7EB',
  showPercentage = true,
  children,
  duration = 800,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const circleRef = useRef<any>(null);

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const halfCircle = size / 2;

  useEffect(() => {
    // Animate from 0 to percentage
    Animated.timing(animatedValue, {
      toValue: percentage,
      duration,
      useNativeDriver: false, // SVG animations don't support native driver
    }).start();
  }, [percentage]);

  useEffect(() => {
    const listener = animatedValue.addListener((v) => {
      if (circleRef.current) {
        const strokeDashoffset = circumference - (circumference * v.value) / 100;
        circleRef.current.setNativeProps({
          strokeDashoffset,
        });
      }
    });

    return () => {
      animatedValue.removeListener(listener);
    };
  }, [circumference]);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <G rotation="-90" origin={`${halfCircle}, ${halfCircle}`}>
          {/* Background circle */}
          <Circle
            cx={halfCircle}
            cy={halfCircle}
            r={radius}
            stroke={backgroundColor}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress circle */}
          <AnimatedCircle
            ref={circleRef}
            cx={halfCircle}
            cy={halfCircle}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={circumference}
            strokeLinecap="round"
          />
        </G>
      </Svg>
      <View style={styles.content}>
        {showPercentage && !children ? (
          <Text style={[styles.percentageText, { fontSize: size * 0.25 }]}>
            {Math.round(percentage)}%
          </Text>
        ) : (
          children
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  content: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentageText: {
    fontFamily: 'SFProDisplayBold',
    color: '#1F2937',
    letterSpacing: -0.5,
  },
});
