import { useCallback, useState } from 'react';
import { Alert, Linking, Platform, PermissionsAndroid } from 'react-native';
import { Audio } from 'expo-av';
import { router } from 'expo-router';
import { ROUTES } from '@/lib/routes';
import { logger } from '@/lib/utils/logger';

/**
 * Hook for starting calls with permission gating.
 * Requests microphone permission BEFORE navigating to CallScreen,
 * providing a cleaner UX where users aren't seeing "Connecting..."
 * while the permission dialog is showing.
 */
export const useStartCall = () => {
  const [isCheckingPermissions, setIsCheckingPermissions] = useState(false);

  const checkAndRequestPermissions = async (): Promise<boolean> => {
    try {
      if (Platform.OS === 'android') {
        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'This app needs access to your microphone to make calls.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );

        if (result === PermissionsAndroid.RESULTS.GRANTED) {
          return true;
        }

        if (result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
          Alert.alert(
            'Microphone Access Required',
            'Please enable microphone access in Settings to make calls.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() },
            ]
          );
        }

        return false;
      } else {
        // iOS: Check and request microphone permission explicitly
        const { status } = await Audio.getPermissionsAsync();
        if (status === 'granted') return true;

        const { granted } = await Audio.requestPermissionsAsync();
        if (granted) return true;

        Alert.alert(
          'Microphone Access Required',
          'Please enable microphone access in Settings to make calls.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        );
        return false;
      }
    } catch (error) {
      logger.error('[useStartCall] Permission error:', error);
      return false;
    }
  };

  const startCall = useCallback(async (agentId: string) => {
    if (isCheckingPermissions) return;

    setIsCheckingPermissions(true);
    try {
      const hasPermissions = await checkAndRequestPermissions();
      if (hasPermissions) {
        router.push(ROUTES.CALL(agentId));
      }
    } finally {
      setIsCheckingPermissions(false);
    }
  }, [isCheckingPermissions]);

  return { startCall, isCheckingPermissions };
};
