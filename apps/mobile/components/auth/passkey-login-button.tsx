import React, { useState } from "react";
import { Pressable, View, Text, ActivityIndicator } from "react-native";
import { authenticateWithPasskey } from "~/lib/auth-client";
import { router } from "expo-router";
import { Key } from "lucide-react-native";

interface PasskeyLoginButtonProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  // Simple prop to control visibility without internal checks
  isAvailable?: boolean;
}

export function PasskeyLoginButton({
  onSuccess,
  onError,
  isAvailable = false,
}: PasskeyLoginButtonProps) {
  const [loading, setLoading] = useState(false);

  const handlePasskeyAuth = async () => {
    try {
      setLoading(true);

      const result = await authenticateWithPasskey({
        rpId: "neb-starter.vercel.app",
      });

      if (result.error) {
        throw result.error;
      }

      // Check if we have valid data with token and user
      if (result.data && result.data.token && result.data.user) {
        // Authentication successful
        // console.info("Authentication successful for user:", result.data.user.id);

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
      if (onError && error instanceof Error) {
        onError(error);
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
