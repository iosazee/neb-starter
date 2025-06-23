"use client";

import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRouter } from "next/navigation";
import { GoogleLoginButton } from "@/components/auth/google-login-button";
import { GithubLoginButton } from "@/components/auth/github-login-button";
import { PasskeyLoginButton } from "@/components/auth/passkey-login-button";

export default function LoginForm({ callbackUrl = "/dashboard" }) {
  const [errorMessage, setErrorMessage] = useState("");
  const [isPasskeyVisible, setIsPasskeyVisible] = useState(false);
  const router = useRouter();

  // Handler for auth success
  const handleAuthSuccess = () => {
    router.push(callbackUrl);
  };

  // Handler for auth errors
  const handleAuthError = (error: Error) => {
    setErrorMessage(`Authentication failed: ${error.message || "Unknown error"}`);
  };

  // Handler for passkey visibility changes
  const handlePasskeyVisibilityChange = (isVisible: boolean) => {
    setIsPasskeyVisible(isVisible);
  };

  return (
    <>
      {/* Error message */}
      {errorMessage && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {/* Login Buttons */}
      <div className="space-y-3">
        {/* Passkey Login Button - Shows first if available (preferred method) */}
        <PasskeyLoginButton
          onSuccess={handleAuthSuccess}
          onError={handleAuthError}
          onVisibilityChange={handlePasskeyVisibilityChange}
        />

        {/* Conditional divider after passkey button */}
        {isPasskeyVisible && (
          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300 dark:border-gray-600"></span>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-slate-900 text-gray-500">OR</span>
            </div>
          </div>
        )}

        {/* Google Login Button */}
        <GoogleLoginButton onSuccess={handleAuthSuccess} onError={handleAuthError} />

        {/* Divider between Google and GitHub */}
        <div className="relative my-2">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-300 dark:border-gray-600"></span>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-slate-900 text-gray-500">OR</span>
          </div>
        </div>

        {/* GitHub Login Button */}
        <GithubLoginButton onSuccess={handleAuthSuccess} onError={handleAuthError} />
      </div>

      <div className="text-center text-sm text-muted-foreground mt-4">
        <p>
          By signing in, you agree to our{" "}
          <a href="/terms" className="underline underline-offset-4 hover:text-primary">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="/privacy" className="underline underline-offset-4 hover:text-primary">
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </>
  );
}
