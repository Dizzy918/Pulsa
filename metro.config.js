// Standard Expo Metro config. Kept explicit so any future custom resolvers
// (SVG transformer, additional asset extensions, etc.) have a home.
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Bundle the YAMNet model as an asset so react-native-fast-tflite can load it
// via require("../assets/models/yamnet.tflite").
config.resolver.assetExts.push("tflite");

module.exports = config;
