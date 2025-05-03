import * as z from "zod";

const envSchema = z.object({
  APPLE_APP_BUNDLE_IDENTIFIER: z.string().min(1),
  APPLE_CLIENT_ID: z.string().min(1),
  APPLE_CLIENT_SECRET: z.string().min(1),
  BETTER_AUTH_SECRET: z.string().min(1),
  GITHUB_CLIENT_ID: z.string().min(1),
  GITHUB_CLIENT_SECRET: z.string().min(1),
  GOOGLE_WEB_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  GOOGLE_IOS_CLIENT_ID: z.string().min(1),
  GOOGLE_REDIRECT_URI: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().min(1),
  SITE_NAME: z.string().min(1),
});

export const env = envSchema.parse(process.env);
