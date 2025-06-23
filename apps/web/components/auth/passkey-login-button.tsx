"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import LoadingSpinner from "@/components/loading-spinner";
import { authenticateWithPasskey, isPasskeySupported } from "@/lib/auth-client";
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
  const [hasPasskey, setHasPasskey] = useState<boolean | null>(null);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(true);
  const searchParams = useSearchParams();

  // Check if passkeys are supported and registered
  useEffect(() => {
    const checkPasskeyAvailability = async () => {
      try {
        setIsCheckingAvailability(true);

        // First check if passkeys are supported
        const supported = await isPasskeySupported();
        setIsSupported(supported);

        if (!supported) {
          setHasPasskey(false);
          setIsCheckingAvailability(false);
          return;
        }

        // For web on login page, check if platform authenticator is available
        // If available, show the button optimistically - actual availability will be tested during auth
        let hasRegisteredPasskey = false;

        if (typeof window !== "undefined" && window.PublicKeyCredential) {
          try {
            // Check if platform authenticator is available
            const platformAvailable =
              await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();

            if (platformAvailable) {
              // Show the button if platform authenticator exists
              // The actual passkey availability will be discovered during authentication attempt
              hasRegisteredPasskey = true;
            }
          } catch (error) {
            console.debug("Could not check platform authenticator availability");
          }
        }

        setHasPasskey(hasRegisteredPasskey);
      } catch (error) {
        console.error("Failed to check passkey availability:", error);
        setIsSupported(false);
        setHasPasskey(false);
      } finally {
        setIsCheckingAvailability(false);
      }
    };

    checkPasskeyAvailability();
  }, []);

  // Notify parent about visibility changes
  useEffect(() => {
    if (!isCheckingAvailability && isSupported !== null && hasPasskey !== null) {
      const isVisible = isSupported && hasPasskey;
      onVisibilityChange?.(isVisible);
    }
  }, [isCheckingAvailability, isSupported, hasPasskey, onVisibilityChange]);

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
        // If the error is about no credentials, it means user doesn't have passkeys
        // In this case, we should hide the button for future attempts
        if (
          result.error.message.includes("no credentials") ||
          result.error.message.includes("No passkey found")
        ) {
          setHasPasskey(false);
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
          // Hide the button since no passkeys are available
          setHasPasskey(false);
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
  if (isCheckingAvailability || isSupported === null || hasPasskey === null) {
    return null; // Return null instead of loading spinner to avoid layout shift
  }

  // Don't render if passkeys aren't supported or no passkey is available
  if (!isSupported || !hasPasskey) {
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
