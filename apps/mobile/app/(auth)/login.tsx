import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  Platform,
  SafeAreaView,
  Image,
  ImageBackground,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
  Text,
} from "react-native";

import { useAuth, getBiometricInfo, hasPasskeysRegistered } from "~/lib/auth-client";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { ChevronDown, ChevronUp } from "lucide-react-native";
import { AppleSignInButton } from "~/components/auth/apple-login-button";
import { GoogleLoginButton } from "~/components/auth/google-login-button";
import { PasskeyLoginButton } from "~/components/auth/passkey-login-button";

// Error and Success message components
function ErrorMessage({ message }: { message: string }) {
  return (
    <View className="bg-red-100 border border-red-500 rounded-lg p-3 my-2">
      <Text className="text-red-500 text-sm">{message}</Text>
    </View>
  );
}

function SuccessMessage({ message }: { message: string }) {
  return (
    <View className="bg-green-100 border border-green-500 rounded-lg p-3 my-2">
      <Text className="text-green-600 text-sm">{message}</Text>
    </View>
  );
}

// Main Login Screen Component
export default function LoginScreen() {
  // Authentication state
  const { isAuthenticated, isPending } = useAuth();
  const [hasPasskey, setHasPasskey] = useState(false);
  const [passkeyAvailable, setPasskeyAvailable] = useState(false);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // UI state
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showAllOptions, setShowAllOptions] = useState(false);

  // Perform the passkey check once on component mount
  useEffect(() => {
    async function checkPasskeyStatus() {
      try {
        // Step 1: Check if passkey is registered
        const isPasskeyRegistered = await hasPasskeysRegistered();

        // If no passkey is registered, we can return early
        if (!isPasskeyRegistered) {
          setPasskeyAvailable(false);
          setHasPasskey(false);
          setIsLoading(false);

          // Also check first time user status
          checkFirstTimeStatus();
          return;
        }

        // Step 2: Check device capabilities if a passkey is registered
        const biometricSupport = await getBiometricInfo();

        // Check if biometrics are supported and enrolled
        const isHardwareSupported = biometricSupport.isSupported;
        const isEnrolled = biometricSupport.isEnrolled;

        // Platform-specific checks
        let isPlatformSupported = true;

        if (Platform.OS === "ios") {
          const version = parseInt(Platform.Version as string, 10);
          isPlatformSupported = version >= 16;
          // console.info("iOS version check:", version, isPlatformSupported);
        }

        if (Platform.OS === "android") {
          const apiLevel = biometricSupport.platformDetails?.apiLevel;
          isPlatformSupported = !!apiLevel && apiLevel >= 29;
          // console.info("Android API level check:", apiLevel, isPlatformSupported);
        }

        // Passkey is only truly available if registered AND device supports it
        const isAvailable = isHardwareSupported && isEnrolled && isPlatformSupported;
        // console.info("Final passkey availability:", isAvailable);

        setPasskeyAvailable(isAvailable);
        setHasPasskey(isAvailable);

        // Also check first time user status
        checkFirstTimeStatus();
      } catch (error) {
        console.error("Error checking passkey status:", error);
        setPasskeyAvailable(false);
        setHasPasskey(false);

        // Also check first time user status even on error
        checkFirstTimeStatus();
      } finally {
        setIsLoading(false);
      }
    }

    async function checkFirstTimeStatus() {
      try {
        // Check if the user has visited before
        const hasVisited = await SecureStore.getItemAsync("HAS_VISITED_BEFORE");
        setIsFirstTimeUser(!hasVisited);

        // If first time, mark that they've visited
        if (!hasVisited) {
          await SecureStore.setItemAsync("HAS_VISITED_BEFORE", "true");
        }
      } catch (error) {
        console.error("Error checking first time status:", error);
        setIsFirstTimeUser(true); // Default to first-time experience on error
      }
    }

    checkPasskeyStatus();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isAuthenticated && !isPending) {
        router.replace("/(tabs)/dashboard");
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isAuthenticated, isPending]);

  // Check if user is already authenticated
  useEffect(() => {
    let isMounted = true;

    // Only redirect if still mounted and authenticated
    if (isMounted && isAuthenticated && !isPending) {
      router.replace("/dashboard");
    }

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, isPending]);

  // Event handlers
  const handleGoogleSuccess = () => setSuccess("Google sign-in successful!");
  const handleGoogleError = (error: Error) => setError(error.message || "Google sign-in failed");
  const handleAppleSuccess = () => setSuccess("Apple sign-in successful!");
  const handleAppleError = (error: Error) => setError(error.message || "Apple sign-in failed");
  const handlePasskeySuccess = () => setSuccess("Passkey authentication successful!");
  const handlePasskeyError = (error: Error) =>
    setError(error.message || "Passkey authentication failed");
  const toggleOptions = () => setShowAllOptions((prev) => !prev);

  // Render the primary authentication component based on passkey status
  function renderPrimaryAuth() {
    if (isLoading) {
      return (
        <View className="h-12 items-center justify-center bg-gray-100 rounded-lg my-2">
          <ActivityIndicator size="small" color="#6200ee" />
        </View>
      );
    }

    if (hasPasskey) {
      return (
        <PasskeyLoginButton
          onSuccess={handlePasskeySuccess}
          onError={handlePasskeyError}
          isAvailable={passkeyAvailable}
        />
      );
    } else if (Platform.OS === "ios") {
      return <AppleSignInButton onSuccess={handleAppleSuccess} onError={handleAppleError} />;
    } else {
      return <GoogleLoginButton onSuccess={handleGoogleSuccess} onError={handleGoogleError} />;
    }
  }

  return (
    <ImageBackground
      source={require("~/assets/images/login-bg.jpg")}
      className="flex-1"
      resizeMode="cover"
    >
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <SafeAreaView className="flex-1">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          {/* Logo area */}
          <View className="flex-row p-4 pt-10">
            <Image
              source={require("~/assets/images/logo.png")}
              style={{ width: 80, height: 80, resizeMode: "contain" }}
            />
          </View>

          {/* Main content container */}
          <View className="flex-1 justify-center px-4 pb-8">
            {/* Header text */}
            <View className="items-center mb-6">
              <Text className="text-2xl font-bold text-white text-center">Welcome</Text>
              <Text className="text-base text-white/80 text-center mt-2">
                Sign in to access your account
              </Text>

              {isFirstTimeUser && (
                <Text className="text-base text-white/90 text-center mt-2">
                  First time here? Choose a sign-in method to get started!
                </Text>
              )}
            </View>

            {/* Login options */}
            <View className="w-full max-w-sm self-center">
              <View className="bg-white/90 rounded-xl overflow-hidden w-full max-w-sm self-center">
                <View className="p-4 border-b border-gray-200">
                  <Text className="text-lg font-semibold text-center">Sign in to Your Account</Text>
                </View>
                <View className="p-4">
                  {/* Primary authentication method */}
                  <View className="mb-4">
                    {renderPrimaryAuth()}

                    {/* More options toggle */}
                    <TouchableOpacity
                      onPress={toggleOptions}
                      className="flex-row items-center justify-center mt-3"
                    >
                      <Text className="text-purple-700 text-sm font-medium mr-1">
                        {showAllOptions ? "Hide options" : "More sign in options"}
                      </Text>
                      {showAllOptions ? (
                        <ChevronUp size={16} color="#6200ee" />
                      ) : (
                        <ChevronDown size={16} color="#6200ee" />
                      )}
                    </TouchableOpacity>

                    {/* Additional authentication options (collapsible) */}
                    {showAllOptions && (
                      <View className="mt-2">
                        {/* Show Apple if on iOS and not the primary (has passkey) */}
                        {Platform.OS === "ios" && hasPasskey && (
                          <>
                            <View className="flex-row items-center my-2">
                              <View className="flex-1 h-px bg-gray-200" />
                              <Text className="mx-2 text-gray-500">or</Text>
                              <View className="flex-1 h-px bg-gray-200" />
                            </View>
                            <AppleSignInButton
                              onSuccess={handleAppleSuccess}
                              onError={handleAppleError}
                            />
                          </>
                        )}

                        {/* Show Google if it's not the primary (on iOS) or if passkey is the primary */}
                        {(Platform.OS === "ios" || hasPasskey) && (
                          <>
                            <View className="flex-row items-center my-2">
                              <View className="flex-1 h-px bg-gray-200" />
                              <Text className="mx-2 text-gray-500">or</Text>
                              <View className="flex-1 h-px bg-gray-200" />
                            </View>
                            <GoogleLoginButton
                              onSuccess={handleGoogleSuccess}
                              onError={handleGoogleError}
                            />
                          </>
                        )}

                        {/* Show PasskeyLoginButton in additional options only if not already the primary */}
                        {!hasPasskey && (
                          <>
                            <View className="flex-row items-center my-2">
                              <View className="flex-1 h-px bg-gray-200" />
                              <Text className="mx-2 text-gray-500">or</Text>
                              <View className="flex-1 h-px bg-gray-200" />
                            </View>
                            {/* Pass passkey availability to avoid redundant checks */}
                            <PasskeyLoginButton
                              onSuccess={handlePasskeySuccess}
                              onError={handlePasskeyError}
                              isAvailable={passkeyAvailable}
                            />
                          </>
                        )}
                      </View>
                    )}
                  </View>

                  {error && <ErrorMessage message={error} />}
                  {success && <SuccessMessage message={success} />}

                  <View className="mt-4">
                    <Text className="text-xs text-gray-500 text-center">
                      By continuing, you agree to our Terms of Service and Privacy Policy.
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}
