import React, { useState, useEffect } from "react";
import { View, ActivityIndicator, Platform, Alert } from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import { signIn } from "~/lib/auth-client";
import { router } from "expo-router";
import { queryClient } from "~/lib/query-client";
import { fetchProfile, isProfileIncomplete } from "~/lib/utils";

interface AppleSignInButtonProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function AppleSignInButton({ onSuccess, onError }: AppleSignInButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isAppleAuthAvailable, setIsAppleAuthAvailable] = useState(false);

  useEffect(() => {
    AppleAuthentication.isAvailableAsync()
      .then(setIsAppleAuthAvailable)
      .catch((error) => {
        console.error("Apple authentication is not available:", error);
        setIsAppleAuthAvailable(false);
      });
  }, []);

  const handleAppleSignIn = async () => {
    setIsLoading(true);

    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        throw new Error("No identity token returned");
      }

      // Sign in with Better Auth
      await signIn.social({
        provider: "apple",
        idToken: {
          token: credential.identityToken,
        },
      });

      // Fetch profile and update query cache
      const profile = await fetchProfile();
      queryClient.setQueryData(["userProfile"], profile);

      // Check profile completeness
      const incomplete = isProfileIncomplete(profile);

      setIsLoading(false);
      Alert.alert("Signed in successfully");

      if (incomplete) {
        console.info("[AppleSignIn] Redirecting to update profile");
        router.replace({
          pathname: "/(flows)/update-profile",
          params: { forceUpdate: "true" },
        });
      } else {
        onSuccess?.();
        router.replace("/(tabs)/dashboard");
      }
    } catch (error: any) {
      setIsLoading(false);

      if (error?.code === "ERR_CANCELED") {
        // User cancelled, no need for alert
        return;
      }

      console.error("Apple Sign In Error:", error);

      Alert.alert("Apple sign-in failed", error.message);

      onError?.(error instanceof Error ? error : new Error("Apple sign-in failed"));
    }
  };

  if (Platform.OS !== "ios" || !isAppleAuthAvailable) {
    return null;
  }

  if (isLoading) {
    return (
      <View className="h-12 w-full items-center justify-center my-2">
        <ActivityIndicator size="small" color="#007AFF" />
      </View>
    );
  }

  return (
    <AppleAuthentication.AppleAuthenticationButton
      buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
      buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
      cornerRadius={8}
      style={{ width: "100%", height: 48, marginVertical: 8 }}
      onPress={handleAppleSignIn}
    />
  );
}
