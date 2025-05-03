"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Github, Loader2 } from "lucide-react";
import { signIn } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";

interface GithubLoginButtonProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  onClick?: () => void;
}

export const GithubLoginButton = ({ onSuccess, onError, onClick }: GithubLoginButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleGithubAuth = async () => {
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
          const { data, error } = await fetch("/api/auth/sign-in/social", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              provider: "github",
              callbackURL: redirectUrl,
              errorCallbackURL: `${baseUrl}/auth/error`,
            }),
          }).then((res) => res.json());

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
          const url = new URL("/api/auth/signin/github", baseUrl);
          url.searchParams.set("callbackUrl", redirectUrl);
          window.location.href = url.toString();
          return;
        }
      } else {
        // Chrome and other browsers use the library method
        await signIn.social({
          provider: "github",
          callbackURL: redirectUrl,
          errorCallbackURL: `${baseUrl}/auth/error`,
          fetchOptions: {
            onSuccess: () => {
              // Use full page navigation rather than router.push to ensure fresh page load and proper cookie handling
              window.location.href = redirectUrl;
              onSuccess?.();
            },
            onError: (ctx) => {
              console.error("Auth error details:", ctx.error);
              router.push(`/auth/error?error=${encodeURIComponent(ctx.error.message)}`);
              onError?.(ctx.error);
            },
          },
        });
      }
    } catch (error) {
      console.error("GitHub authentication error:", error);
      onError?.(error instanceof Error ? error : new Error("Authentication failed"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      className="w-full flex items-center justify-center gap-2 h-12 text-base  dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600  dark:hover:bg-gray-700 dark:hover:border-gray-500 transition-colors duration-200"
      onClick={handleGithubAuth}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
      ) : (
        <Github className="w-5 h-5 mr-2" />
      )}
      <span>{isLoading ? "Signing In..." : "Continue with GitHub"}</span>
    </Button>
  );
};
