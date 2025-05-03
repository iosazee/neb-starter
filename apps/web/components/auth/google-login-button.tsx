"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { SocialIcon } from "@/components/social-icons";
import LoadingSpinner from "@/components/loading-spinner";
import { signIn, $fetch } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";

interface GoogleLoginButtonProps {
  mode?: "login" | "connect";
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  onClick?: () => void;
}

export const GoogleLoginButton = ({
  mode = "login",
  onSuccess,
  onError,
  onClick,
}: GoogleLoginButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleGoogleAuth = async () => {
    try {
      setIsLoading(true);
      onClick?.();

      // Get the base URL dynamically
      const baseUrl = window.location.origin;

      // Get callback URL from searchParams or use default
      const callbackPath = searchParams?.get("callbackUrl") || "/dashboard";

      // Construct the redirect URL properly
      const redirectUrl = callbackPath.startsWith("http")
        ? callbackPath
        : `${baseUrl}${callbackPath.startsWith("/") ? callbackPath : `/${callbackPath}`}`;

      // Detect browser
      const userAgent = navigator.userAgent.toLowerCase();
      const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent);
      const isFirefox = userAgent.indexOf("firefox") > -1;

      // For Safari and Firefox, use direct fetch approach
      if (isSafari || isFirefox) {
        try {
          // Use $fetch from auth-client
          const { data, error } = await $fetch<{ url: string }>("sign-in/social", {
            method: "POST",
            body: {
              provider: "google",
              callbackURL: redirectUrl,
              errorCallbackURL: `${baseUrl}/auth/error`,
            },
          });

          if (data?.url) {
            // Use full page navigation for redirect to ensure cookies are properly handled
            window.location.href = data.url;
            return;
          }

          if (error) {
            throw new Error(`Auth request failed: ${error.message || "Unknown error"}`);
          }
        } catch (fetchError) {
          console.warn("Browser-specific auth method failed:", fetchError);

          // Fallback to direct URL approach
          const url = new URL("/api/auth/signin/google", baseUrl);
          url.searchParams.set("callbackUrl", redirectUrl);
          window.location.href = url.toString();
          return;
        }
      } else {
        // Chrome and other browsers use the library method
        await signIn.social({
          provider: "google",
          callbackURL: redirectUrl,
          errorCallbackURL: `${baseUrl}/auth/error`,
          fetchOptions: {
            onSuccess: () => {
              if (mode === "login") {
                // Use full page navigation rather than router.push to ensure
                // fresh page load and proper cookie handling
                window.location.href = redirectUrl;
              }
              onSuccess?.();
            },
            onError: (ctx) => {
              console.error("Auth error details:", ctx.error);
              router.push(`/auth/error?error=${encodeURIComponent(ctx.error.message)}`);
            },
          },
        });
      }
    } catch (error) {
      console.error("Google authentication error:", error);
      onError?.(error instanceof Error ? error : new Error("Authentication failed"));
    } finally {
      setIsLoading(false);
    }
  };

  const buttonText = mode === "login" ? "Sign in with Google" : "Connect Google Calendar";

  return (
    <Button
      variant="outline"
      size="lg"
      className="w-full flex items-center justify-center gap-2 h-12 text-base  dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600  dark:hover:bg-gray-700 dark:hover:border-gray-500 transition-colors duration-200"
      onClick={handleGoogleAuth}
      disabled={isLoading}
    >
      {isLoading ? <LoadingSpinner /> : <SocialIcon href="#" platform="google" />}
      <span className="ml-2">{buttonText}</span>
    </Button>
  );
};
