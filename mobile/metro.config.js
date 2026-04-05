const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

let config = getDefaultConfig(__dirname);

// Configure SVG transformer for react-native-svg
config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve("react-native-svg-transformer"),
};

config.resolver = {
  ...config.resolver,
  assetExts: config.resolver.assetExts.filter((ext) => ext !== "svg"),
  sourceExts: [...config.resolver.sourceExts, "svg"],
};

// Apply NativeWind configuration
config = withNativeWind(config, { input: './global.css' });

module.exports = config;
