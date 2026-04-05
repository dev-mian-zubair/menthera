import React from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface RoughSeparatorProps {
  color?: string;
  opacity?: number;
  marginVertical?: number;
}

export const RoughSeparator: React.FC<RoughSeparatorProps> = ({
  color = '#E5E7EB',
  opacity = 0.5,
  marginVertical = 16,
}) => {
  return (
    <View style={{ marginVertical, width: '100%', height: 8 }}>
      <Svg width="100%" height="8" viewBox="0 0 400 8" preserveAspectRatio="none">
        <Path
          d="M 0 4 Q 10 2, 20 4 T 40 4 T 60 4 T 80 4 T 100 4 T 120 4 T 140 4 T 160 4 T 180 4 T 200 4 T 220 4 T 240 4 T 260 4 T 280 4 T 300 4 T 320 4 T 340 4 T 360 4 T 380 4 L 400 4"
          stroke={color}
          strokeWidth="1.5"
          fill="none"
          opacity={opacity}
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
};
