# NEB Starter - Mobile App

A cross-platform mobile application built with Expo and React Native that shares authentication and data access with the web app.

## Key Features

- **Universal Authentication** - Connects to the web app's auth server for seamless authentication
- **Biometric Authentication** - Implements secure biometric login using expo-passkey
- **Cross-Platform** - Runs on iOS and Android from a single codebase
- **UI Components** - Custom UI components built with [react-native-reusables](https://github.com/mrzachnugent/react-native-reusables) and styled with NativeWind
- **Native Features** - Access to device capabilities via Expo modules
- **Type Safety** - Fully typed with TypeScript

## Getting Started

### Prerequisites

- Node.js 18+
- Yarn package manager
- For iOS: macOS with Xcode installed
- For Android: Android Studio with SDK tools

### Environment Variables

Copy the sample environment file and update the values:

```bash
cp .env.sample .env.local
```

### Installation

```bash
# From the monorepo root
cd apps/mobile

# Install dependencies (if not already done at root level)
yarn install

# Start the Expo development server
yarn dev
```

### Running on Simulators/Emulators

```bash
# Run on iOS Simulator
yarn ios

# Run on Android Emulator
yarn android
```

### Running on Physical Devices

```bash
# Build and run on connected iOS device
yarn run:ios

# Build and run on connected Android device
yarn run:android
```

## Important Notes

- **Expo Go Limitations**: This project uses custom native modules and may not work reliably with Expo Go. It's recommended to use development builds on simulators or physical devices.

- **Development Builds**: To create a development build:

  ```bash
  # For iOS
  npx expo prebuild --platform ios
  npx expo run:ios

  # For Android
  npx expo prebuild --platform android
  npx expo run:android
  ```

## Authentication

The mobile app implements a comprehensive authentication strategy:

- **Web App Integration**: Connects to the Next.js web app for authentication services
- **Biometric Authentication**: Uses the [expo-passkey](https://www.npmjs.com/package/expo-passkey) package for:
  - Face ID/Touch ID on iOS
  - Fingerprint authentication on Android
- **Cross-Platform Auth**: Consistent auth experiences across platforms

Other supported authentication methods:

- Google Sign-In
- Apple Sign-In (iOS only)

### expo-passkey Integration

This starter kit showcases integration with the `expo-passkey` package, which enables secure biometric authentication:

## Customizing

- **Theme**: Update colors and styles in the `theme` directory
- **Navigation**: Modify tabs and navigation structure in `app/(tabs)/_layout.tsx`
- **Components**: Add or modify components in the `components` directory
- **Fonts**: Replace or add fonts in `assets/fonts` and register them in `app/_layout.tsx`

## Building for Production

To build the app for distribution:

```bash
# Build for iOS
npx eas build --platform ios

# Build for Android
npx eas build --platform android
```

For more detailed EAS build configuration, refer to the [Expo documentation](https://docs.expo.dev/build/introduction/).

## Troubleshooting

- **Clean Build**: If you encounter build issues, try cleaning the project:

  ```bash
  yarn clean
  ```

- **Module Resolution**: If you face module resolution errors, check the `babel.config.js` and `metro.config.js` files.

- **Native Dependencies**: When adding native dependencies, you may need to rebuild the development client:
  ```bash
  npx expo prebuild --clean
  ```
