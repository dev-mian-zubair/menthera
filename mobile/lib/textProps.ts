import { Platform, TextStyle } from 'react-native';

/**
 * Default text style props to fix font cutting issues
 * Use this for all Text components
 */
export const defaultTextProps = {
  allowFontScaling: false,
  ...(Platform.OS === 'android' && {
    includeFontPadding: false,
  }),
};

/**
 * Get text style with proper line height to prevent cutting
 */
export function getTextStyle(fontSize: number): TextStyle {
  return {
    fontSize,
    lineHeight: Math.floor(fontSize * 1.5),
    ...(Platform.OS === 'android' && {
      includeFontPadding: false,
    }),
  };
}
