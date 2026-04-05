import React from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface BubbleTailProps {
  isUser: boolean;
  color?: string;
}

export const BubbleTail = React.memo(({ isUser, color }: BubbleTailProps) => {
  const tailColor = color || (isUser ? '#007AFF' : '#FFFFFF');

  return (
    <View
      style={{
        position: 'absolute',
        bottom: -10,
        ...(isUser ? { right: -17 } : { left: -17.1 }),
        width: 25,
        height: 25,
        ...(isUser ? {} : { transform: [{ scaleX: -1 }] }),
      }}
    >
      <Svg width="15" height="15" viewBox="0 0 15 15">
        <Path
          d="M 0 0 C 0 3 0 7 3 12 C 5 14 8 15 12 15 C 10 12 8 8 8 4 C 8 2 6 0 0 0 Z"
          fill={tailColor}
        />
      </Svg>
    </View>
  );
});

BubbleTail.displayName = 'BubbleTail';
