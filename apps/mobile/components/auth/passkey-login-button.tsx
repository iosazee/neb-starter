import React, { useState } from "react";
import { Pressable, View, Text, ActivityIndicator } from "react-native";
import { authenticateWithPasskey } from "~/lib/auth-client";
import { removePasskeyRegistered } from "~/lib/utils";
import { router } from "expo-router";
import { Key } from "lucide-react-native";

interface PasskeyLoginButtonProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  onVisibilityChange?: (isVisible: boolean) => void;
  // Simple prop to control visibility without internal checks
  isAvailable?: boolean;
}

export function PasskeyLoginButton({
  onSuccess,
  onError,
  onVisibilityChange,
  isAvailable = false,
}: PasskeyLoginButtonProps) {
  const [loading, setLoading] = useState(false);

  const handlePasskeyAuth = async () => {
    try {
      setLoading(true);

      const result = await authenticateWithPasskey({
        rpId: "neb-starter-web.vercel.app",
        userVerification: "preferred",
      });

      if (result.error) {
        // If the error indicates no credentials, remove the SecureStore flag
        if (
          result.error.message.includes("no credentials") ||
          result.error.message.includes("No passkey found") ||
          result.error.message.includes("NotAllowedError")
        ) {
          await removePasskeyRegistered();
          onVisibilityChange?.(false);
        }
        throw result.error;
      }

      // Check if we have valid data with token and user
      if (result.data && result.data.token && result.data.user) {
        // Authentication successful
        // console.info("Passkey authentication successful for user:", result.data.user.id);

        // Notify parent component of success
        if (onSuccess) {
          onSuccess();
        }

        // Navigate to dashboard after a short delay
        setTimeout(() => {
          router.replace("/dashboard");
        }, 500);
      } else {
        console.error("Missing expected data in response:", result);
        throw new Error("Authentication response missing expected data");
      }
    } catch (error) {
      console.error("Passkey authentication error:", error);

      // Handle specific error types
      let errorMessage = "Passkey authentication failed";

      if (error instanceof Error) {
        if (error.message.includes("User cancelled") || error.message.includes("AbortError")) {
          // User cancelled - don't show error
          return;
        } else if (error.message.includes("NotAllowedError")) {
          errorMessage = "Passkey authentication was blocked. Please try again.";
        } else if (error.message.includes("NotSupportedError")) {
          errorMessage = "Passkeys are not supported on this device.";
        } else if (
          error.message.includes("no credentials") ||
          error.message.includes("No passkey found")
        ) {
          errorMessage = "No passkey found for this site. Please use another sign-in method.";
          // Remove the flag since no passkeys are available
          await removePasskeyRegistered();
          onVisibilityChange?.(false);
        } else {
          errorMessage = error.message;
        }
      }

      if (onError) {
        onError(new Error(errorMessage));
      }
    } finally {
      setLoading(false);
    }
  };

  // If passkeys aren't available, don't render anything
  if (!isAvailable) {
    return null;
  }

  // Show the authentication button
  return (
    <Pressable
      className={`h-12 w-full items-center justify-center rounded-lg border border-gray-200 bg-white my-2 ${loading ? "opacity-50" : ""}`}
      onPress={handlePasskeyAuth}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#007AFF" />
      ) : (
        <View className="flex-row items-center">
          <Key size={20} color="#333" className="mr-2" />
          <Text className="text-base font-semibold text-gray-800">Sign in with Passkey</Text>
        </View>
      )}
    </Pressable>
  );
}
