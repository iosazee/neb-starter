import { createAuthClient } from "better-auth/react";
import {
  passkeyClient,
  adminClient,
  customSessionClient,
  inferAdditionalFields,
} from "better-auth/client/plugins";
import { auth } from "@/lib/auth";
import { toast } from "sonner";

export const client = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
  plugins: [
    passkeyClient(),
    adminClient(),
    customSessionClient<typeof auth>(),
    inferAdditionalFields<typeof auth>(),
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

export const { signIn, signOut, useSession, passkey } = client;

// Export fetch client for authenticated requests
export const $fetch = client.$fetch;
