import { betterAuth, BetterAuthOptions } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin, customSession } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { db } from "database";
import * as z from "zod";
import { env } from "./env";
import { expo } from "@better-auth/expo";
import { expoPasskey } from "expo-passkey/server";
import { googlePolyAuth } from "google-polyauth/server";
import UserRoleService from "./user-role-service";
import hybridCacheStorage from "./cache-adapter";
import { mapAppleProfileToUser } from "./utils";

const isDevEnvironment = process.env.NODE_ENV === "development";
const domain = isDevEnvironment ? "localhost" : "neb-starter.vercel.app";

const options = {
  appName: "neb-starter",
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  baseURL: env.NEXT_PUBLIC_APP_URL,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: [
    "https://neb-starter.vercel.app",
    "https://www.neb-starter.vercel.app/api/auth",
    "mobile://",
    "exp+neb-mobile://",
    "exp+mobile://expo-development-client",
    ...(isDevEnvironment ? ["http://localhost:3000"] : []),
  ],
  secondaryStorage: hybridCacheStorage,
  session: {
    freshAge: 0,
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },
  user: {
    additionalFields: {
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
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google", "github"],
    },
  },
  socialProviders: {
    apple: {
      clientId: env.APPLE_CLIENT_ID,
      clientSecret: env.APPLE_CLIENT_SECRET,
      appBundleIdentifier: env.APPLE_APP_BUNDLE_IDENTIFIER,
      mapProfileToUser: mapAppleProfileToUser,
    },
    github: {
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
      mapProfileToUser: (profile) => {
        return {
          firstName: profile.name.split(" ")[0],
          lastName: profile.name.split(" ")[1],
        };
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          // Check if name contains a space (likely a real name)
          if (user.name && user.name.includes(" ")) {
            return {
              data: {
                ...user,
                firstName: user.name.split(" ")[0],
                lastName: user.name.split(" ")[1] || "User",
              },
            };
          }

          // If the name looks like an email (contains @ but no spaces)
          if (user.name && user.name.includes("@") && !user.name.includes(" ")) {
            const username = user.name.split("@")[0];
            const formattedUsername = username.charAt(0).toUpperCase() + username.slice(1);

            return {
              data: {
                ...user,
                firstName: formattedUsername,
                lastName: "User",
              },
            };
          }

          // Default fallback case
          return {
            data: {
              ...user,
              firstName: user.name || "New",
              lastName: user.name || "User",
            },
          };
        },
      },
    },
  },
  plugins: [
    admin(),
    expo(),
    googlePolyAuth({
      clientId: env.GOOGLE_WEB_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      additionalClientIds: [env.GOOGLE_IOS_CLIENT_ID].filter(Boolean) as string[],
      scope: ["openid", "profile", "email"],
    }),
    expoPasskey({
      rpId: domain,
      rpName: "neb-starter",
      logger: {
        enabled: false,
      },
      cleanup: {
        disableInterval: true,
      },
      origin: [
        "https://neb-starter.vercel.app",
        "android:apk-key-hash:BJcjfO2JQrG_98VLopoZHIUC7FPzLahmtT8tlaQNFKo",
      ],
    }),
    nextCookies(),
  ],
  onAPIError: {
    errorURL: "/error",
  },
  advanced: {
    generateId: false,
    crossSubDomainCookies: isDevEnvironment
      ? { enabled: false }
      : {
          enabled: true,
          domain: "neb-starter.vercel.app",
        },
    useSecureCookies: !isDevEnvironment ? true : false,
    cookies: {
      session_token: {
        attributes: {
          secure: !isDevEnvironment ? true : false,
          sameSite: "lax",
          ...(isDevEnvironment ? {} : { domain: ".neb-starter.vercel.app" }),
        },
      },
    },
  },
} satisfies BetterAuthOptions;

export const auth = betterAuth({
  ...options,
  plugins: [
    ...(options.plugins || []),
    customSession(async (sessionData) => {
      if (!sessionData) {
        return sessionData;
      }
      const { user, session } = sessionData;
      // Get role from cache service
      const role = await UserRoleService.getUserRole(session.userId);

      return {
        user: {
          ...user,
          role,
        },
        session,
      };
    }, options),
  ],
});
