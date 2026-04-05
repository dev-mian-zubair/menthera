import React from 'react';
import { View, Image, ViewStyle } from 'react-native';
import { getAvatarDisplay } from '@/lib/utils/avatar-utils';

interface AvatarProps {
  avatar: string;
  size?: number;
  style?: ViewStyle;
  backgroundColor?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  avatar,
  size = 40,
  style,
  backgroundColor = 'transparent',
}) => {
  const avatarDisplay = getAvatarDisplay(avatar);

  if (avatarDisplay.type === 'svg') {
    const SvgComponent = avatarDisplay.value as React.FC<any>;
    const svgSize = size * 0.85;
    return (
      <View
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden',
          },
          style
        ]}
      >
        <SvgComponent width={svgSize} height={svgSize} />
      </View>
    );
  }

  // Fallback to URL image
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor,
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'hidden',
        },
        style
      ]}
    >
      <Image
        source={{ uri: avatarDisplay.value as string }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        resizeMode="cover"
      />
    </View>
  );
};
