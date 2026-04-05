import { ExpoConfig, ConfigContext } from "expo/config";

// Identity values that vary per fork / deployer.
// Fail fast at config resolution time if any of these are unset — a showcase
// repo should not ship with hardcoded production identifiers as fallbacks.
const easProjectId = process.env.EAS_PROJECT_ID;
const expoOwner = process.env.EXPO_OWNER;
if (!easProjectId) {
  throw new Error(
    "EAS_PROJECT_ID is required. See README for how to configure this " +
      "for your own EAS / Expo account."
  );
}
if (!expoOwner) {
  throw new Error(
    "EXPO_OWNER is required. See README for how to configure this " +
      "for your own EAS / Expo account."
  );
}

// Bundle identifiers use a placeholder for public forks. Replace with your
// own reverse-DNS identifier before publishing to App Store / Play Store.
const iosBundleIdentifier =
  process.env.IOS_BUNDLE_IDENTIFIER || "com.example.menthera";
const androidPackage =
  process.env.ANDROID_PACKAGE || "com.example.menthera";

export default ({ config }: ConfigContext): ExpoConfig => ({
  name: "Menthera",
  slug: "menthera",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "menthera",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: iosBundleIdentifier,
    usesAppleSignIn: true,
    icon: "./assets/images/icon.png",
    infoPlist: {
      NSMicrophoneUsageDescription:
        "Menthera needs access to your microphone to conduct voice calls with AI agents",
      NSCameraUsageDescription:
        "Menthera needs access to your camera for video calls with AI agents",
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/images/adaptive-icon.png",
      backgroundColor: "#5A86FF",
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    package: androidPackage,
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/icon.png",
  },
  plugins: [
    "expo-dev-client",
    "expo-router",
    "expo-web-browser",
    [
      "expo-splash-screen",
      {
        backgroundColor: "#FBF7F4",
        image: "./assets/images/splash-logo.png",
        imageWidth: 200,
        resizeMode: "contain",
        dark: {
          backgroundColor: "#FBF7F4",
          image: "./assets/images/splash-logo.png",
        },
      },
    ],
    [
      "react-native-edge-to-edge",
      {
        android: {
          parentTheme: "Default",
          enforceNavigationBarContrast: false,
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    router: {},
    eas: {
      projectId: easProjectId,
    },
  },
  owner: expoOwner,
});
