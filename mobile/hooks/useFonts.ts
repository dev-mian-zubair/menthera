import { useFonts as useExpoFonts } from 'expo-font';

export function useFonts() {
  const [fontsLoaded, fontError] = useExpoFonts({
    'SFProDisplayRegular': require('../assets/fonts/SF-Pro-Display-Regular.otf'),
    'SFProDisplayLight': require('../assets/fonts/SF-Pro-Display-Light.otf'),
    'SFProDisplayMedium': require('../assets/fonts/SF-Pro-Display-Medium.otf'),
    'SFProDisplaySemibold': require('../assets/fonts/SF-Pro-Display-Semibold.otf'),
    'SFProDisplayBold': require('../assets/fonts/SF-Pro-Display-Bold.otf'),
    'GentiumPlus': require('../assets/fonts/GentiumPlus-Regular.ttf'),
    'ErodeRegular': require('../assets/fonts/Erode-Regular.otf'),
    'ErodeBold': require('../assets/fonts/Erode-Bold.otf'),
  });

  return {
    fontsLoaded,
    fontError
  };
}
