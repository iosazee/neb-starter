import React, { useState } from "react";
import { View, Text, ActivityIndicator, TouchableOpacity, Platform } from "react-native";
import { signIn } from "~/lib/auth-client";
import { router } from "expo-router";
import { GoogleSignin, statusCodes } from "@react-native-google-signin/google-signin";
import { SocialIcon } from "~/components/social-icons";

// Configure Google Sign In
GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID!,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID!,
  scopes: ["profile", "email"],
});

interface GoogleLoginButtonProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function GoogleLoginButton({ onSuccess, onError }: GoogleLoginButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      if (Platform.OS === "android") {
        await GoogleSignin.hasPlayServices({
          showPlayServicesUpdateDialog: true,
        });
      }

      // Sign out first to ensure a fresh sign-in
      await GoogleSignin.signOut();

      // Start the sign-in flow
      const signInResult = await GoogleSignin.signIn();

      // Check for success based on your working example
      if ("type" in signInResult && signInResult.type !== "success") {
        throw new Error("Google sign-in failed");
      }

      // Extract user info based on the response structure
      const userInfo = "data" in signInResult ? signInResult.data : signInResult;

      // Get ID token from the result
      let accessToken = "";
      let idToken = "";

      // Try to access the token based on response structure
      if (userInfo && "idToken" in userInfo) {
        idToken = (userInfo as any).idToken || "";
      }

      // Get tokens if needed
      if (!idToken) {
        try {
          const tokenResult = await GoogleSignin.getTokens();
          idToken = tokenResult.idToken || "";
          accessToken = tokenResult.accessToken || "";
        } catch (tokenError) {
          console.error("Error getting tokens:", tokenError);
        }
      }

      // Sign in with Better Auth
      await signIn.social({
        provider: "google",
        idToken: {
          token: idToken,
          accessToken: accessToken,
        },
      });

      setIsLoading(false);
      onSuccess?.();
      router.replace("/dashboard");
    } catch (error: any) {
      setIsLoading(false);
      console.error("Google sign-in error:", error);

      // Handle user cancellation with comprehensive checks
      const isCancellation =
        error.code === statusCodes.SIGN_IN_CANCELLED ||
        (typeof error.message === "string" &&
          (error.message.toLowerCase().includes("cancel") ||
            error.message.toLowerCase().includes("cancelled") ||
            error.message.toLowerCase().includes("canceled") ||
            error.message.includes("12501") ||
            error.message.includes("The user canceled the sign-in flow"))) ||
        error.toString().toLowerCase().includes("cancel");

      if (isCancellation) {
        return;
      }

      // Handle temporary errors
      const isTemporaryError =
        error.code === statusCodes.IN_PROGRESS ||
        (typeof error.message === "string" &&
          (error.message.includes("network") ||
            error.message.includes("timeout") ||
            error.message.includes("temporarily unavailable")));

      if (isTemporaryError) {
        console.info("Temporary sign-in issue - no error shown");
        return;
      }

      // Handle other specific errors
      let errorMessage = "Authentication failed";

      if (error.code) {
        if (String(error.code) === String(statusCodes.PLAY_SERVICES_NOT_AVAILABLE)) {
          errorMessage = "Google Play services required";
        } else {
          errorMessage = "Google sign-in failed";
        }
      }

      onError?.(new Error(errorMessage));
    }
  };

  return (
    <TouchableOpacity
      className="flex-row items-center justify-center bg-white rounded-lg h-12 px-4 my-2 border border-gray-200"
      onPress={handleGoogleSignIn}
      disabled={isLoading}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color="#4285F4" />
      ) : (
        <View className="flex-row items-center justify-center">
          <View className="mr-3">
            <SocialIcon platform="google" size={18} />
          </View>
          <Text className="text-base font-semibold text-gray-800">Continue with Google</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
