const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add custom resolver settings
config.resolver.platforms = ['native', 'android', 'ios', 'web'];

module.exports = config;