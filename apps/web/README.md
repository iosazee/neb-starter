# NEB Starter - Web App

A modern Next.js web application with server components, authentication, and database integration.

## Key Features

- **Universal Auth Server** - Serves as the authentication provider for both web and mobile apps
- **App Router Architecture** - Leverages Next.js App Router for efficient routing and server components
- **Server Components** - Uses React Server Components for improved performance and SEO
- **Authentication API** - Exposes auth endpoints that the mobile app consumes
- **Role Based Access Control** - Configured with better-auth's admin plugin.
- **Database Connection** - Prisma ORM integration for type-safe database access
- **UI Components** - Leverages shadcn/ui components styled with Tailwind CSS v4 for a beautiful, accessible interface
- **Dark Mode** - Built-in dark mode support with theme switching
- **Admin Interface** - Simple admin dashboard with cache monitoring
- **Responsive Design** - Mobile-first approach that works on all devices

## Getting Started

### Prerequisites

- Node.js 18+

### Environment Variables

Copy the sample environment file and update the values:

```bash
cp .env.sample .env.local
```

### Installation

```bash
# From the monorepo root
cd apps/web

# Install dependencies (if not already done at root level)
yarn install

# Start the development server
yarn dev
```

### Building for Production

```bash
# Build the app
yarn build

# Start the production server
yarn start
```

## Authentication

This app serves as the central authentication server for the entire ecosystem. Included authentication methods

- Google OAuth
- GitHub OAuth

To configure additional social providers or auth methods, modify `lib/auth.ts`.

The auth system is designed to handle both direct web authentication and mobile app authentication requests with a consistent approach, providing a unified user experience across platforms.

## Authorization

This app comes preconfigured with an admin dashboard accessible only to users with an `admin` role. Admins can access the admin dashboard at `admin/dashboard`. To assign the admin role to users, you can do this via direct database access, use your orm or follow the methods exposed by the [admin plugin](https://www.better-auth.com/docs/plugins/admin).

## Database Access

The web app connects to the shared database using Prisma. The prisma client is imported from the `database` package in the monorepo.

## Deploying

The Next.js app can be deployed to any Node.js-compatible hosting service:

1. Set up the required environment variables on your hosting platform
2. Build the application with `yarn build`
3. Deploy the built application

## Customizing

- **Pages/Layout**: Modify the app/page.tsx, edit app/layout.tsx for global layout changes, you can even swap out the entire app directory and start afresh, just ensure to remount Better-Auth's handler to handle api requests.
- **Styling**: Update `globals.css` and TailwindCSS configuration
- **Components**: Modify or add components in the `components` directory.
- **Authentication**: Configure additional providers in `lib/auth.ts`
