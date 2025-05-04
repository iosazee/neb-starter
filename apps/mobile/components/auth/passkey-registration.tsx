import React, { useState, useEffect } from "react";
import { View, Pressable, ActivityIndicator, Platform, Alert, Linking } from "react-native";
import { Text } from "~/components/ui/text";
import { registerPasskey, getBiometricInfo, isPasskeySupported } from "~/lib/auth-client";
import { cn } from "~/lib/cn";
import * as Application from "expo-application";

export const PasskeyRegistration = ({
  userId,
  userEmail,
  userName,
  onComplete,
}: {
  userId: string;
  userEmail?: string;
  userName?: string;
  onComplete?: () => void;
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [biometricInfo, setBiometricInfo] = useState<any>(null);
  const [passkeysSupported, setPasskeysSupported] = useState<boolean | null>(null);

  // Use email for userName field
  const webAuthnUserName = userEmail || userId;
  const displayName = userName || userEmail || userId;

  useEffect(() => {
    checkPasskeySupport();
  }, []);

  const openSecuritySettings = async () => {
    if (Platform.OS === "android") {
      try {
        // First try to open biometric settings directly
        await Linking.sendIntent("android.settings.BIOMETRIC_ENROLL");
      } catch {
        try {
          // Then try security settings
          await Linking.sendIntent("android.settings.SECURITY_SETTINGS");
        } catch {
          // Finally fall back to general settings
          await Linking.openSettings();
        }
      }
    } else if (Platform.OS === "ios") {
      // On iOS, we can only guide users to the settings
      Alert.alert(
        "Biometrics Required",
        `Please enable Face ID or Touch ID in your iOS Settings to use passkeys`,
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Open Settings",
            onPress: () => Linking.openSettings(),
          },
        ]
      );
    }
  };

  const showSetupPrompt = () => {
    const message = Platform.select({
      android:
        "To use passkeys, you need to set up fingerprint or face unlock in your device settings.",
      ios: "To use passkeys, you need to enable Face ID or Touch ID in your iOS Settings.",
      default: "Please set up biometric authentication in your device settings to use passkeys.",
    });

    Alert.alert("Biometric Setup Required", message, [
      {
        text: "Open Settings",
        onPress: openSecuritySettings,
      },
      {
        text: "Cancel",
        style: "cancel",
      },
    ]);
  };

  const checkPasskeySupport = async () => {
    try {
      // First check if passkeys are supported on the device
      const supported = await isPasskeySupported();
      setPasskeysSupported(supported);

      if (supported) {
        // Get biometric info for UI display purposes
        const info = await getBiometricInfo();
        setBiometricInfo(info);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check passkey support");
      setPasskeysSupported(false);
    }
  };

  const handleRegister = async () => {
    try {
      setLoading(true);
      setError("");

      // Double-check passkey support before proceeding
      const supported = await isPasskeySupported();
      if (!supported) {
        throw new Error(
          Platform.OS === "ios"
            ? "Passkeys require iOS 16 or later with Face ID or Touch ID enabled"
            : "Passkeys require Android 10 or later with biometric authentication enabled"
        );
      }

      // Prepare metadata for registration
      const metadata = {
        lastLocation: "mobile-app",
        appVersion: Application.nativeApplicationVersion || "1.0.0",
        deviceModel:
          Platform.OS === "ios"
            ? Platform.constants.systemName + " " + Platform.constants.osVersion
            : biometricInfo?.platformDetails?.brand || "Android device",
        biometricType: biometricInfo?.authenticationType || "Biometric",
        // Store user-friendly identifiers in metadata too
        displayName: displayName,
        email: userEmail,
      };

      const result = await registerPasskey({
        userId,
        userName: webAuthnUserName,
        displayName: displayName,
        rpId: "neb-starter-web.vercel.app",
        rpName: "NEB Starter",
        metadata,
      });

      if (result.error) {
        console.error("Passkey registration error:", result.error.message, result.error.stack);
        throw result.error;
      }

      if (result.data?.success) {
        const authType =
          biometricInfo?.authenticationType ||
          (Platform.OS === "ios" ? "Face ID/Touch ID" : "Biometric authentication");

        Alert.alert(
          "Passkey Registered",
          `${authType} passkey has been successfully registered for quick sign-in. You can now use it to sign in to your account.`,
          [{ text: "OK", onPress: () => onComplete?.() }]
        );
      } else {
        throw new Error("Passkey registration failed - no success confirmation from server");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to register passkey";
      console.error("Passkey registration failed:", errorMessage, err);

      setError(errorMessage);

      // Show setup prompt for biometric-related errors
      if (
        errorMessage.toLowerCase().includes("biometric") ||
        errorMessage.toLowerCase().includes("face id") ||
        errorMessage.toLowerCase().includes("touch id") ||
        errorMessage.toLowerCase().includes("fingerprint")
      ) {
        showSetupPrompt();
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle loading state while checking support
  if (passkeysSupported === null) {
    return (
      <View className="p-4 bg-card rounded-lg">
        <ActivityIndicator size="small" />
        <Text className="text-center mt-2">Checking passkey support...</Text>
      </View>
    );
  }

  // Handle unsupported case
  if (passkeysSupported === false) {
    return (
      <View className="p-4 bg-card rounded-lg space-y-4">
        <Text className="text-lg font-semibold">Passkeys Not Supported</Text>
        <Text className="text-muted-foreground">
          {Platform.OS === "ios"
            ? "Your device needs iOS 16 or later with Face ID or Touch ID enabled to use passkeys."
            : "Your device needs Android 10 or later with biometric authentication enabled to use passkeys."}
        </Text>

        <Pressable
          className="h-12 items-center justify-center rounded-lg bg-primary"
          onPress={openSecuritySettings}
        >
          <Text className="text-primary-foreground font-semibold">Open Settings</Text>
        </Pressable>
      </View>
    );
  }

  // Get the auth type name for display
  const authTypeName =
    biometricInfo?.authenticationType || (Platform.OS === "ios" ? "Face ID/Touch ID" : "Biometric");

  return (
    <View className="p-4 bg-card rounded-lg space-y-4">
      <Text className="text-lg font-semibold">Enable Passkey Authentication</Text>
      <Text className="text-muted-foreground">
        Register a passkey to sign in quickly and securely using {authTypeName.toLowerCase()} on
        this device
      </Text>

      {error ? (
        <View className="bg-destructive/10 p-4 rounded-lg">
          <Text className="text-destructive text-center">{error}</Text>
        </View>
      ) : null}

      <Pressable
        className={cn(
          "h-12 items-center justify-center rounded-lg bg-primary",
          loading && "opacity-50"
        )}
        onPress={handleRegister}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-primary-foreground font-semibold">
            Register Passkey with {authTypeName}
          </Text>
        )}
      </Pressable>

      <View className="mt-2">
        <Text className="text-xs text-muted-foreground text-center">
          This allows you to sign in securely without entering your password
        </Text>
      </View>
    </View>
  );
};
