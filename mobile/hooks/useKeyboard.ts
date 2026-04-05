import { useEffect, useState } from 'react';
import { Keyboard, KeyboardEvent } from 'react-native';

export interface KeyboardState {
  isVisible: boolean;
  height: number;
}

/**
 * Custom hook to track keyboard visibility and height
 * Useful for adjusting UI when keyboard is shown/hidden
 */
export const useKeyboard = (): KeyboardState => {
  const [keyboardState, setKeyboardState] = useState<KeyboardState>({
    isVisible: false,
    height: 0,
  });

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', (event: KeyboardEvent) => {
      setKeyboardState({
        isVisible: true,
        height: event.endCoordinates.height,
      });
    });

    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardState({
        isVisible: false,
        height: 0,
      });
    });

    return () => {
      showSubscription?.remove();
      hideSubscription?.remove();
    };
  }, []);

  return keyboardState;
};