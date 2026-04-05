import React from 'react';
import { View, Text, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ConnectionStatusProps {
  isOnline: boolean;
  retryCount: number;
  onRetry?: () => void;
}

/**
 * ConnectionStatus Component
 * Shows network status and retry information
 */
export const ConnectionStatus = React.memo(
  ({ isOnline, retryCount, onRetry }: ConnectionStatusProps) => {
    if (isOnline && retryCount === 0) {
      return null;
    }

    const statusText = isOnline
      ? retryCount > 0
        ? `Attempting to resend (${retryCount}/3)...`
        : 'Connected'
      : 'Connection lost';

    const statusColor = isOnline ? '#5A86FF' : '#F44';
    const backgroundColor = isOnline ? '#F0F4FF' : '#FEE';

    return (
      <View
        style={{
          backgroundColor,
          borderBottomWidth: 1,
          borderBottomColor: `${statusColor}40`,
          paddingHorizontal: 16,
          paddingVertical: 10,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          {isOnline ? (
            <Ionicons name="wifi" size={16} color={statusColor} style={{ marginRight: 8 }} />
          ) : (
            <Ionicons name="alert-circle" size={16} color={statusColor} style={{ marginRight: 8 }} />
          )}
          <Text
            style={{
              fontSize: 13,
              color: statusColor,
              fontFamily: 'SFProDisplayMedium',
              flex: 1,
            }}
          >
            {statusText}
          </Text>
        </View>

        {!isOnline && onRetry && (
          <Ionicons
            name="refresh"
            size={16}
            color={statusColor}
            onPress={onRetry}
            style={{ marginLeft: 8 }}
          />
        )}
      </View>
    );
  }
);

ConnectionStatus.displayName = 'ConnectionStatus';
