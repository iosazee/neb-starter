import { google, GoogleOptions } from "better-auth/social-providers";
import { BetterAuthPlugin } from "better-auth";
import { OAuthProvider } from "better-auth/oauth2";

export interface GooglePolyAuthOptions extends GoogleOptions {
  // Additional client IDs to accept for token validation
  additionalClientIds?: string[];
}

/**
 * A plugin that extends the standard Google provider to support multiple client IDs
 * for token validation, which is especially useful for mobile applications.
 */
export const googlePolyAuth = (options: GooglePolyAuthOptions): BetterAuthPlugin => {
  return {
    id: "google-polyauth",

    init: (ctx) => {
      // Let's use the ctx parameter to log when the plugin is initialized
      ctx.logger?.debug?.("Initializing google-polyauth plugin", {
        primaryClientId: options.clientId,
        additionalClientIdsCount: options.additionalClientIds?.length || 0,
      });

      // Create the standard Google provider
      const googleProvider = google(options);

      // Extend the provider with our multi-client functionality
      if (googleProvider.verifyIdToken) {
        const originalVerifyIdToken = googleProvider.verifyIdToken;

        googleProvider.verifyIdToken = async (token: string, nonce?: string) => {
          if (options.disableIdTokenSignIn) {
            return false;
          }

          if (options.verifyIdToken) {
            return options.verifyIdToken(token, nonce);
          }

          try {
            // Try the original verification first
            const isValid = await originalVerifyIdToken(token, nonce);
            if (isValid) {
              ctx.logger?.debug?.("Validated Google token with primary client ID");
              return true;
            }

            // If that fails and we have additional client IDs, try those
            if (options.additionalClientIds?.length) {
              // Fetch token info from Google
              const response = await fetch(
                `https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${token}`
              );

              if (!response.ok) {
                ctx.logger?.debug?.("Failed to fetch Google token info");
                return false;
              }

              const tokenInfo = await response.json();

              // Check if audience matches any additional client IDs
              const isValidAudience = options.additionalClientIds.includes(tokenInfo.aud);

              // Verify the token is from Google
              const isValidIssuer =
                tokenInfo.iss === "https://accounts.google.com" ||
                tokenInfo.iss === "accounts.google.com";

              const isValid = isValidAudience && isValidIssuer;

              if (isValid) {
                ctx.logger?.debug?.("Validated Google token with additional client ID", {
                  clientId: tokenInfo.aud,
                });
              } else {
                ctx.logger?.debug?.("Google token validation failed", {
                  validAudience: isValidAudience,
                  validIssuer: isValidIssuer,
                  tokenAudience: tokenInfo.aud,
                  tokenIssuer: tokenInfo.iss,
                });
              }

              return isValid;
            }

            ctx.logger?.debug?.("No additional client IDs to try for Google token validation");
            return false;
          } catch (error) {
            ctx.logger?.error?.("Google ID token verification error", error);
            return false;
          }
        };
      }

      // Get existing socialProviders if available or create a new array
      // Need to safely access socialProviders from ctx, as it might not exist yet
      const existingSocialProviders: OAuthProvider<any>[] = (ctx as any).socialProviders || [];

      // Check if there's already a Google provider
      const existingGoogleProviderIndex = existingSocialProviders.findIndex(
        (provider: OAuthProvider<any>) => provider.id === "google"
      );

      // Create a new array to avoid modifying the original
      const socialProviders = [...existingSocialProviders];

      // If a Google provider already exists, replace it; otherwise, add our new one
      if (existingGoogleProviderIndex !== -1) {
        // Replace the existing Google provider
        ctx.logger?.debug?.(
          "Replacing existing Google provider with enhanced multi-client version"
        );
        socialProviders[existingGoogleProviderIndex] = googleProvider;
      } else {
        // Add our new Google provider
        ctx.logger?.debug?.("Adding Google polyauth provider");
        socialProviders.push(googleProvider);
      }

      // Return the context with our modified social providers
      return {
        context: {
          socialProviders,
        },
      };
    },
  };
};
