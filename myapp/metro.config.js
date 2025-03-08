// metro.config.js
const {
    wrapWithReanimatedMetroConfig,
  } = require('react-native-reanimated/metro-config');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add json to assetExts
config.resolver.assetExts.push('json');

module.exports = wrapWithReanimatedMetroConfig(config);