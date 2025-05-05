import { ExpoConfig, ConfigContext } from "expo/config";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, ".env") });

export default ({ config: _config }: ConfigContext): ExpoConfig => ({
  name: "mobile",
  slug: "mobile",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/logo.png",
  scheme: "mobile",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.nebstarter.mobile",
    buildNumber: "1.0.0",
    usesAppleSignIn: true,
    appleTeamId: process.env.EXPO_APPLE_TEAM_ID,
    associatedDomains: ["webcredentials:neb-starter-web.vercel.app"],
  },
  android: {
    edgeToEdgeEnabled: true,
    adaptiveIcon: {
      foregroundImage: "./assets/images/logo.png",
      backgroundColor: "#ffffff",
    },
    package: "com.nebstarter.mobile",
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/logo.png",
  },
  plugins: [
    "expo-router",
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#ffffff",
      },
    ],
    "expo-asset",
    [
      "expo-font",
      {
        fonts: [
          "./assets/fonts/Poppins-Black.ttf",
          "./assets/fonts/Poppins-Bold.ttf",
          "./assets/fonts/Poppins-ExtraBold.ttf",
          "./assets/fonts/Poppins-ExtraLight.ttf",
          "./assets/fonts/Poppins-Light.ttf",
          "./assets/fonts/Poppins-Medium.ttf",
          "./assets/fonts/Poppins-Regular.ttf",
          "./assets/fonts/Poppins-SemiBold.ttf",
          "./assets/fonts/Poppins-Thin.ttf",
        ],
      },
    ],
    "expo-secure-store",
    [
      "expo-local-authentication",
      {
        faceIDPermission: "Allow $(PRODUCT_NAME) to use Face ID.",
      },
    ],
    ["expo-apple-authentication"],
    [
      "@react-native-google-signin/google-signin",
      {
        iosUrlScheme: process.env.EXPO_GOOGLE_IOS_URL_SCHEME,
      },
    ],
    [
      "expo-build-properties",
      {
        android: {
          compileSdkVersion: 35,
        },
      },
    ],
    "expo-web-browser",
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
});
