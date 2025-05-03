import { BetterAuthClientPlugin } from "better-auth/client";
import type { googlePolyAuth } from "./server.js";

type GooglePolyAuthPlugin = typeof googlePolyAuth;

/**
 * Client-side companion for the google-polyauth plugin.
 * This allows type-safe integration between the server and client plugins.
 */
export const googlePolyAuthClient = () => {
  return {
    id: "google-polyauth",
    $InferServerPlugin: {} as ReturnType<GooglePolyAuthPlugin>,
  } satisfies BetterAuthClientPlugin;
};
