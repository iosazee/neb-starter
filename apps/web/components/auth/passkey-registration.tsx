"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import LoadingSpinner from "@/components/loading-spinner";
import {
  registerPasskey,
  isPasskeySupported,
  isPlatformAuthenticatorAvailable,
} from "@/lib/auth-client";
import { setPasskeyRegistered } from "@/lib/utils";
import { Key, Shield, CheckCircle, AlertTriangle } from "lucide-react";

interface PasskeyRegistrationProps {
  userId: string;
  userEmail?: string;
  userName?: string;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

export const PasskeyRegistration = ({
  userId,
  userEmail,
  userName,
  onComplete,
  onError,
}: PasskeyRegistrationProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  const [isPlatformAvailable, setIsPlatformAvailable] = useState<boolean | null>(null);

  // Use email for userName field if no userName provided
  const webAuthnUserName = userEmail || userId;
  const displayName = userName || userEmail || userId;

  useEffect(() => {
    checkPasskeySupport();
  }, []);

  const checkPasskeySupport = async () => {
    try {
      const [supported, platformAvailable] = await Promise.all([
        isPasskeySupported(),
        isPlatformAuthenticatorAvailable().catch(() => false),
      ]);

      setIsSupported(supported);
      setIsPlatformAvailable(platformAvailable);
    } catch (err) {
      console.error("Error checking passkey support:", err);
      setIsSupported(false);
      setIsPlatformAvailable(false);
      setError("Failed to check passkey support on this device");
    }
  };

  const handleRegister = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccess(false);

      // Double-check passkey support before proceeding
      const supported = await isPasskeySupported();
      if (!supported) {
        throw new Error(
          "Passkeys are not supported in this browser. Please use a modern browser that supports WebAuthn."
        );
      }

      // Prepare metadata for registration
      const metadata = {
        lastLocation: "web-app",
        appVersion: "1.0.0",
        deviceModel: navigator.userAgent,
        registrationMethod: "manual",
        // Store user-friendly identifiers in metadata
        displayName: displayName,
        email: userEmail,
        registeredAt: new Date().toISOString(),
      };

      // Call registerPasskey with WebAuthn parameters
      const result = await registerPasskey({
        userId,
        userName: webAuthnUserName,
        displayName: displayName,
        rpId: window.location.hostname,
        rpName: "NEB Starter",
        attestation: "none",
        authenticatorSelection: {
          authenticatorAttachment: "cross-platform",
          userVerification: "preferred",
          residentKey: "preferred",
        },
        timeout: 60000,
        metadata,
      });

      if (result.error) {
        console.error("Passkey registration error:", result.error.message, result.error);
        throw result.error;
      }

      if (result.data?.success) {
        setSuccess(true);

        // Set localStorage flag to indicate user has registered a passkey
        setPasskeyRegistered();
        console.info("Passkey registration successful, localStorage flag set");

        // Show success message briefly before calling onComplete
        setTimeout(() => {
          onComplete?.();
        }, 2000);
      } else {
        throw new Error("Passkey registration failed - no success confirmation from server");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to register passkey";
      console.error("Passkey registration failed:", errorMessage, err);

      setError(errorMessage);
      onError?.(err instanceof Error ? err : new Error(errorMessage));
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while checking support
  if (isSupported === null) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <LoadingSpinner />
            <span>Checking passkey support...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show unsupported message
  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <span>Passkeys Not Supported</span>
          </CardTitle>
          <CardDescription>
            Your browser doesn&apos;t support passkeys. Please use a modern browser like Chrome, Firefox,
            Safari, or Edge.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Passkeys require a browser with WebAuthn support. Please update your browser or try a
              different one.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Show success state
  if (success) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span>Passkey Registered Successfully!</span>
          </CardTitle>
          <CardDescription>
            You can now use your passkey to sign in quickly and securely.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Your passkey has been registered. The passkey login option will now appear on the
              login page for faster sign-in.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Key className="h-5 w-5 text-blue-500" />
          <span>Enable Passkey Authentication</span>
        </CardTitle>
        <CardDescription>
          Register a passkey to sign in quickly and securely using{" "}
          {isPlatformAvailable ? "your device's biometric authentication or" : ""} security key.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4" />
            <span>Secure authentication without passwords</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Key className="h-4 w-4" />
            <span>Uses your device&apos;s built-in security</span>
          </div>
        </div>

        <Button onClick={handleRegister} disabled={loading} className="w-full" size="lg">
          {loading ? (
            <>
              <LoadingSpinner />
              <span className="ml-2">Registering Passkey...</span>
            </>
          ) : (
            <>
              <Key className="h-4 w-4 mr-2" />
              <span>Register Passkey</span>
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          This will prompt you to use your device&apos;s authentication method (fingerprint, face
          recognition, or security key). After registration, a passkey login option will appear on
          the login page.
        </p>
      </CardContent>
    </Card>
  );
};
