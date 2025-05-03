// apps/mobile/eslint.config.js
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");
const eslintPluginPrettierRecommended = require("eslint-plugin-prettier/recommended");
const reactCompiler = require("eslint-plugin-react-compiler");

module.exports = defineConfig([
  // Base Expo config
  expoConfig,

  // Prettier integration
  eslintPluginPrettierRecommended,

  // Project-specific config
  {
    ignores: ["dist/*", ".expo/*", "../../node_modules/*", "node_modules/*"],
    plugins: {
      "react-compiler": reactCompiler,
    },
    rules: {
      "react-compiler/react-compiler": "error",

      // Your overrides
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "no-console": ["warn", { allow: ["warn", "error", "info"] }],

      // Make react hooks rules more manageable
      "react-hooks/exhaustive-deps": "warn",

      // Adjust import rules
      "import/no-duplicates": "warn",

      // Handle namespace imports better
      "import/namespace": "warn",
    },
  },
]);
