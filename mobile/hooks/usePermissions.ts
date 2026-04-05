import { useEffect, useState } from 'react';
import { Platform, PermissionsAndroid, Alert, Linking } from 'react-native';
import { Audio } from 'expo-av';
import { logger } from '@/lib/utils/logger';

export const usePermissions = () => {
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [permissionsError, setPermissionsError] = useState<string | null>(null);

  const requestPermissions = async () => {
    try {
      if (Platform.OS === 'android') {
        const permissions = [
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          PermissionsAndroid.PERMISSIONS.CAMERA,
        ];

        const results = await PermissionsAndroid.requestMultiple(permissions);

        const allGranted =
          results['android.permission.RECORD_AUDIO'] === PermissionsAndroid.RESULTS.GRANTED &&
          results['android.permission.CAMERA'] === PermissionsAndroid.RESULTS.GRANTED;

        if (allGranted) {
          setPermissionsGranted(true);
        } else {
          logger.warn('[usePermissions] Some permissions denied');
          setPermissionsError('Microphone and camera permissions are required for calls');
        }
      } else if (Platform.OS === 'ios') {
        const { granted } = await Audio.requestPermissionsAsync();
        if (granted) {
          setPermissionsGranted(true);
        } else {
          setPermissionsError('Microphone permission is required for calls');
          Alert.alert(
            'Microphone Access Required',
            'Please enable microphone access in Settings to make calls.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() },
            ]
          );
        }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to request permissions';
      logger.error('[usePermissions] Error:', errorMsg);
      setPermissionsError(errorMsg);
    }
  };

  useEffect(() => {
    requestPermissions();
  }, []);

  return {
    permissionsGranted,
    permissionsError,
    requestPermissions,
  };
};
