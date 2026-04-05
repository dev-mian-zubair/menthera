import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface LockBadgeProps {
  size?: 'small' | 'medium' | 'large';
  style?: object;
}

/**
 * LockBadge - Small lock icon badge for locked agents
 * Used on agent cards in the home screen
 */
export const LockBadge: React.FC<LockBadgeProps> = ({
  size = 'medium',
  style
}) => {
  const sizeConfig = {
    small: { iconSize: 12, padding: 4, borderRadius: 8 },
    medium: { iconSize: 16, padding: 6, borderRadius: 10 },
    large: { iconSize: 20, padding: 8, borderRadius: 12 },
  };

  const config = sizeConfig[size];

  return (
    <View
      style={[
        styles.badge,
        {
          padding: config.padding,
          borderRadius: config.borderRadius,
        },
        style
      ]}
    >
      <Ionicons
        name="lock-closed"
        size={config.iconSize}
        color="#FFFFFF"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
