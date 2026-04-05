import React, { useMemo } from 'react';
import { View, ActivityIndicator, ViewStyle } from 'react-native';
import { tokens } from '@/lib/styles/core/tokens';
import { getTimeTheme } from '@/lib/utils/time-theme';

interface LoadingScreenProps {
  size?: 'small' | 'large';
  backgroundColor?: string;
  spinnerColor?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ size = 'large', backgroundColor, spinnerColor }) => {
  const theme = useMemo(() => getTimeTheme(), []);

  const containerStyle: ViewStyle = {
    flex: 1,
    backgroundColor: backgroundColor || theme.background,
    justifyContent: 'center',
    alignItems: 'center',
  };

  return (
    <View style={containerStyle}>
      <View style={{ marginTop: tokens.spacing.xl }}>
        <ActivityIndicator
          size={size}
          color={spinnerColor || theme.textColor}
        />
      </View>
    </View>
  );
};
