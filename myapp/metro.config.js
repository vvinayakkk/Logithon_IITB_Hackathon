const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add json to assetExts
config.resolver.assetExts.push('json');

module.exports = config;