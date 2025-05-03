const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const { wrapWithReanimatedMetroConfig } = require("react-native-reanimated/metro-config");
const path = require("path");

// Find the project and workspace directories
const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

// Get the default config
const config = getDefaultConfig(projectRoot);

// Watch all files within the monorepo
config.watchFolders = [monorepoRoot];
// Let Metro know where to resolve packages and in what order
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];
// Force Metro to resolve (sub)dependencies only from the `nodeModulesPaths`
config.resolver.disableHierarchicalLookup = true;

// Configure the resolver with new options
config.resolver.unstable_enablePackageExports = true;
config.resolver.unstable_conditionNames = ["react-native", "require", "browser"];

// Add support for mjs and cjs files which might be needed by some packages
config.resolver.sourceExts = [...config.resolver.sourceExts, "mjs", "cjs"];

// Add support for additional asset file types
config.resolver.assetExts = [
  ...config.resolver.assetExts,
  // Image formats
  "bmp",
  "gif",
  "jpg",
  "jpeg",
  "png",
  "psd",
  "svg",
  "webp",
  "m4v",
  "mp4",
  "webm",
  "html",
  "pdf",
  "otf",
  "ttf",
  "zip",
  "db",
];

// Apply NativeWind configuration
const nativeWindConfig = withNativeWind(config, {
  input: "./global.css",
  inlineRem: 16,
});

// Export the final config wrapped with Reanimated
module.exports = wrapWithReanimatedMetroConfig(nativeWindConfig);
