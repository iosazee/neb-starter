import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import * as SecureStore from "expo-secure-store";
import { inferAdditionalFields } from "better-auth/client/plugins";
import { router } from "expo-router";
import { z } from "zod";
import { expoPasskeyClient } from "expo-passkey";
import { googlePolyAuthClient } from "google-polyauth/client";

const baseURL = process.env.EXPO_PUBLIC_AUTH_BASE_URL!;

export const authClient = createAuthClient({
  baseURL,
  plugins: [
    expoClient({
      scheme: "mobile",
      storagePrefix: "neb_starter",
      storage: SecureStore,
    }),
    expoPasskeyClient({
      storagePrefix: "neb_starter",
    }),
    googlePolyAuthClient(),
    inferAdditionalFields({
      user: {
        role: {
          type: "string",
          required: false,
          defaultValue: "user",
          input: false,
          validator: {
            input: z.enum(["user", "admin"]),
            output: z.enum(["user", "admin"]),
          },
        },
        firstName: {
          type: "string",
          required: true,
        },
        lastName: {
          type: "string",
          required: true,
        },
      },
    }),
  ],
  fetchOptions: {
    onError: (error) => {
      console.error("Auth error:", error);
      if (error.error.status === 401 || error.error.status === 403) {
        router.replace("/login");
      }
    },
  },
});

export const {
  signIn,
  signOut,
  authenticateWithPasskey,
  getBiometricInfo,
  getStorageKeys,
  registerPasskey,
  revokePasskey,
  listPasskeys,
  isPasskeySupported,
  hasPasskeysRegistered,
} = authClient;

// Export a hook for easy access to auth state
export const useAuth = () => {
  const { data: session, error, isPending } = authClient.useSession();
  return {
    session,
    isPending,
    isAuthenticated: !!session,
    error,
  };
};

// Export fetch client for authenticated requests
export const $fetch = authClient.$fetch;
