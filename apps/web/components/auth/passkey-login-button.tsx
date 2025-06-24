"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import LoadingSpinner from "@/components/loading-spinner";
import { authenticateWithPasskey, isPasskeySupported } from "@/lib/auth-client";
import { hasPasskeyRegistered, removePasskeyRegistered } from "@/lib/utils";
import { useSearchParams } from "next/navigation";
import { Key } from "lucide-react";

interface PasskeyLoginButtonProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  onClick?: () => void;
  onVisibilityChange?: (isVisible: boolean) => void;
}

export const PasskeyLoginButton = ({
  onSuccess,
  onError,
  onClick,
  onVisibilityChange,
}: PasskeyLoginButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  const [hasRegisteredPasskey, setHasRegisteredPasskey] = useState<boolean>(false);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(true);
  const searchParams = useSearchParams();

  // Check if user has previously registered a passkey
  useEffect(() => {
    const checkPasskeyRegistration = async () => {
      try {
        setIsCheckingAvailability(true);

        // First check if passkeys are supported by the browser
        const supported = await isPasskeySupported();
        setIsSupported(supported);

        if (!supported) {
          setHasRegisteredPasskey(false);
          setIsCheckingAvailability(false);
          return;
        }

        // Check localStorage for registration flag
        const hasRegistered = hasPasskeyRegistered();
        setHasRegisteredPasskey(hasRegistered);
      } catch (error) {
        console.error("Failed to check passkey registration status:", error);
        setIsSupported(false);
        setHasRegisteredPasskey(false);
      } finally {
        setIsCheckingAvailability(false);
      }
    };

    checkPasskeyRegistration();
  }, []);

  // Notify parent about visibility changes
  useEffect(() => {
    if (!isCheckingAvailability && isSupported !== null) {
      const isVisible = isSupported && hasRegisteredPasskey;
      onVisibilityChange?.(isVisible);
    }
  }, [isCheckingAvailability, isSupported, hasRegisteredPasskey, onVisibilityChange]);

  const handlePasskeyAuth = async () => {
    try {
      setIsLoading(true);
      onClick?.();

      // Get callback URL from searchParams or use default
      const callbackPath = searchParams?.get("callbackUrl") || "/dashboard";
      const baseUrl = window.location.origin;
      const redirectUrl = callbackPath.startsWith("http")
        ? callbackPath
        : `${baseUrl}${callbackPath.startsWith("/") ? callbackPath : `/${callbackPath}`}`;

      // Attempt passkey authentication
      const result = await authenticateWithPasskey({
        rpId: window.location.hostname,
        userVerification: "preferred",
        timeout: 60000,
        metadata: {
          lastLocation: "web-app",
          appVersion: "1.0.0",
        },
      });

      if (result.error) {
        // If the error indicates no credentials, remove the localStorage flag
        if (
          result.error.message.includes("no credentials") ||
          result.error.message.includes("No passkey found") ||
          result.error.message.includes("NotAllowedError")
        ) {
          removePasskeyRegistered();
          setHasRegisteredPasskey(false);
          onVisibilityChange?.(false);
        }
        throw result.error;
      }

      // Check if we have valid authentication data
      if (result.data && result.data.token && result.data.user) {
        // Authentication successful
        console.info("Passkey authentication successful for user:", result.data.user.id);

        // Call success callback
        onSuccess?.();

        // Navigate to the callback URL
        window.location.href = redirectUrl;
      } else {
        console.error("Missing expected data in passkey response:", result);
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
          errorMessage = "Passkeys are not supported in this browser.";
        } else if (
          error.message.includes("no credentials") ||
          error.message.includes("No passkey found")
        ) {
          errorMessage = "No passkey found for this site. Please use another sign-in method.";
          // Remove the flag since no passkeys are available
          removePasskeyRegistered();
          setHasRegisteredPasskey(false);
          onVisibilityChange?.(false);
        } else {
          errorMessage = error.message;
        }
      }

      onError?.(new Error(errorMessage));
    } finally {
      setIsLoading(false);
    }
  };

  // Don't render while checking availability
  if (isCheckingAvailability || isSupported === null) {
    return null; // Return null to avoid layout shift
  }

  // Don't render if passkeys aren't supported or user hasn't registered one
  if (!isSupported || !hasRegisteredPasskey) {
    return null;
  }

  return (
    <Button
      variant="outline"
      size="lg"
      className="w-full flex items-center justify-center gap-2 h-12 text-base text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700 dark:hover:border-gray-500 transition-colors duration-200"
      onClick={handlePasskeyAuth}
      disabled={isLoading}
    >
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <Key size={20} className="text-blue-600 dark:text-blue-400" />
      )}
      <span className="ml-2">{isLoading ? "Authenticating..." : "Sign in with Passkey"}</span>
    </Button>
  );
};
