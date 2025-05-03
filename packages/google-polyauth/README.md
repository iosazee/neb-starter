# NEB Starter - Google Polyauth

A Better-Auth plugin that extends the standard Google provider to support multiple client IDs for token validation across your application ecosystem.

## Overview

When building multiple applications that share the same user base (different web apps, mobile apps, or a combination), you need to create separate client applications on the Google Cloud Console, each with its own client ID. Better Auth's standard Google provider only supports a single client ID, which creates authentication issues when your users try to sign in from different applications.

Google Polyauth solves this by enabling token validation against multiple client IDs, providing a seamless authentication experience across your entire application ecosystem. Whether you're managing a suite of web applications, cross-platform deployments (web, iOS, Android), or white-labeled products, this plugin ensures unified authentication with minimal configuration.

## Features

- **Multi-Client Support** - Validate Google tokens against multiple client IDs
- **Unified User Base** - Share users seamlessly across multiple applications
- **Application Ecosystem** - Support authentication across web apps, mobile apps, and services
- **Type Safety** - Full TypeScript support with client/server type inference
- **Debug Logging** - Detailed logging for troubleshooting authentication issues
- **Graceful Fallback** - Attempts primary client ID validation first, then falls back to additional IDs
- **Simple Integration** - Drop-in replacement for the standard Google provider

## Usage

### Server-Side Setup

In your authentication configuration file:

```typescript
import { betterAuth } from "better-auth";
import { googlePolyAuth } from "google-polyauth/server";

export const auth = betterAuth({
  // Other Better Auth options...

  plugins: [
    googlePolyAuth({
      clientId: process.env.GOOGLE_PRIMARY_CLIENT_ID, // Primary client ID
      clientSecret: process.env.GOOGLE_CLIENT_SECRET, // Client secret
      additionalClientIds: [
        process.env.GOOGLE_APP2_CLIENT_ID, // Secondary web app
        process.env.GOOGLE_IOS_CLIENT_ID, // iOS app
        process.env.GOOGLE_ANDROID_CLIENT_ID, // Android app
      ],
      scope: ["openid", "profile", "email"], // Requested scopes
    }),
    // Other plugins...
  ],
});
```

### Client-Side Setup

Import the client-side companion to ensure type safety:

```typescript
import { createAuthClient } from "better-auth/react";
import { googlePolyAuthClient } from "google-polyauth/client";

export const authClient = createAuthClient({
  // Other Better Auth client options...

  plugins: [
    googlePolyAuthClient(),
    // Other client plugins...
  ],
});
```

## API Reference

### Server Plugin Options

The `googlePolyAuth` function accepts all standard Google provider options plus:

- `additionalClientIds`: Array of additional client IDs to validate tokens against

### How It Works

1. When a Google ID token is received, it first attempts validation with the primary client ID
2. If that fails and additional client IDs are configured, it fetches token info from Google
3. It validates the token audience against the additional client IDs
4. It verifies the token issuer is Google
5. If validation succeeds with any client ID, authentication proceeds

## Use Cases

- **Multi-Application Suites** - Support authentication across a suite of related web applications
  - Corporate portals with different applications for different departments
  - SaaS platforms with multiple web interfaces sharing the same user database
  - Educational platforms with separate applications for students, teachers, and administrators
- **White-Labeled Applications** - Enable authentication for multiple branded versions of your product
  - Client-specific deployments with unique Google client IDs
  - Marketplace applications where each installation needs its own client ID
- **Cross-Platform Applications** - Seamless sign-in across web and mobile platforms
  - Web application + iOS + Android apps
  - Desktop and web applications sharing authentication
- **Development Environments** - Support different client IDs for your deployment pipeline
  - Development, staging, and production environments
  - Testing and QA environments
