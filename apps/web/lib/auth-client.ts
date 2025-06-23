import { createAuthClient } from "better-auth/react";
import {
  adminClient,
  customSessionClient,
  inferAdditionalFields,
} from "better-auth/client/plugins";
import { auth } from "@/lib/auth";
import { toast } from "sonner";
import { expoPasskeyClient } from "expo-passkey/web";

export const client = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
  plugins: [
    adminClient(),
    customSessionClient<typeof auth>(),
    inferAdditionalFields<typeof auth>(),
    expoPasskeyClient({
      storagePrefix: "neb-starter",
    }),
  ],
  fetchOptions: {
    onError(e) {
      if (e.error.status === 429) {
        toast.error("Too many attempts. Please try again later.");
      }
      // Redirect to error page for authentication errors
      if (e.error.status === 401 || e.error.status === 403) {
        window.location.href = `/error?error=${encodeURIComponent(e.error.message)}`;
      }
    },
  },
});

export const {
  signIn,
  signOut,
  useSession,
  registerPasskey,
  authenticateWithPasskey,
  isPlatformAuthenticatorAvailable,
  isPasskeySupported,
  hasPasskeysRegistered,
  listPasskeys,
  revokePasskey,
} = client;

// Export fetch client for authenticated requests
export const $fetch = client.$fetch;
