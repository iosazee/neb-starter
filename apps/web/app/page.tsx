import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Database, Lock, Smartphone, Globe, Code2 } from "lucide-react";
import { ModeToggle } from "@/components/general/mood-toggle";
import AuthButton from "@/components/ui/auth-button";
import { SocialIcon } from "@/components/social-icons";
import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-24 flex flex-col items-center">
      <div className="absolute top-8 right-8">
        <ModeToggle />
      </div>
      <div className="absolute top-8 left-8">
        <Image
          src="/logo.png"
          alt="NEB Starter Kit"
          width={50}
          height={50}
          className="rounded-lg"
        />
      </div>
      {/* Hero Section */}
      <div className="text-center space-y-6 max-w-3xl mb-16">
        <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">NEB Starter Kit</h1>
        <p className="text-xl text-muted-foreground">
          A production-ready universal app monorepo featuring Next.js, Expo, and better-auth
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          <Badge variant="outline" className="px-2 py-1">
            Next.js
          </Badge>
          <Badge variant="outline" className="px-2 py-1">
            Expo
          </Badge>
          <Badge variant="outline" className="px-2 py-1">
            Better-auth
          </Badge>
          <Badge variant="outline" className="px-2 py-1">
            Prisma ORM
          </Badge>
          <Badge variant="outline" className="px-2 py-1">
            Tailwind CSS v4
          </Badge>
          <Badge variant="outline" className="px-2 py-1">
            shadcn/ui
          </Badge>
        </div>
        <div className="flex flex-wrap gap-4 justify-center">
          <AuthButton
            loginText="Get Started"
            authenticatedText="Dashboard"
            loginHref="/login"
            authenticatedHref="/dashboard"
          />
          <Link
            href="https://github.com/iosazee/neb-starter"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 h-10 px-4 py-2 rounded-md text-sm font-medium transition-colors border border-input bg-background hover:bg-accent hover:text-accent-foreground"
          >
            <SocialIcon
              platform="github"
              size={4}
              className="text-foreground"
              linkWrapper={false}
            />
            GitHub
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl mb-16">
        <Card>
          <CardHeader>
            <Globe className="w-10 h-10 mb-2 text-primary" />
            <CardTitle>Next.js Web App</CardTitle>
            <CardDescription>
              Modern web frontend and backend with the latest Next.js features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>
              Built with App Router and server components to deliver fast, SEO-friendly web
              experiences with optimal performance.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Smartphone className="w-10 h-10 mb-2 text-primary" />
            <CardTitle>Expo Mobile App</CardTitle>
            <CardDescription>
              Cross-platform mobile experiences with Expo and React Native
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>
              Develop iOS and Android applications from a single codebase with Expo&apos;s powerful
              toolchain and React Native.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Lock className="w-10 h-10 mb-2 text-primary" />
            <CardTitle>Authentication</CardTitle>
            <CardDescription>Secure, pre-configured auth with better-auth</CardDescription>
          </CardHeader>
          <CardContent>
            <p>
              Implement secure authentication and authorization flows across web and mobile
              platforms with minimal configuration.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Database className="w-10 h-10 mb-2 text-primary" />
            <CardTitle>Database Integration</CardTitle>
            <CardDescription>Type-safe database access with Prisma ORM</CardDescription>
          </CardHeader>
          <CardContent>
            <p>
              Uses Prisma ORM with Neon PostgreSQL for remote database access. You can easily swap
              this out with a database of your choice (MySQL, SQLite, etc.) and an ORM of your
              preference or just plain SQL queries.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Code2 className="w-10 h-10 mb-2 text-primary" />
            <CardTitle>Monorepo Structure</CardTitle>
            <CardDescription>Organized codebase with shared packages</CardDescription>
          </CardHeader>
          <CardContent>
            <p>
              Efficiently manage your web and mobile applications in a single repository with shared
              types, components, and business logic.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <svg
              className="w-10 h-10 mb-2 text-primary"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 16.7C15.3 16.7 13.8 18.9 12 21C10.3 19 8.8 16.7 4 16.7C4 10.5 7.6 8.3 12 13.3C16.3 8.4 20 10.5 20 16.7Z" />
              <path d="M12 2V11" />
            </svg>
            <CardTitle>Flexible Deployment</CardTitle>
            <CardDescription>
              Deploy your application with the provider of your choice
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>
              The web app can be deployed to any platform that runs Node.js - including serverless
              providers (Vercel, Netlify, AWS, Cloudflare Pages) or self-hosted on your own VPS
              infrastructure with equal ease.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Code Samples */}
      <div className="w-full max-w-3xl mb-16">
        <Tabs defaultValue="setup">
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="setup">Quick Setup</TabsTrigger>
            <TabsTrigger value="next">Next.js App</TabsTrigger>
            <TabsTrigger value="expo">Expo App</TabsTrigger>
          </TabsList>
          <TabsContent value="setup" className="p-4 bg-muted rounded-md mt-2 overflow-x-auto">
            <pre className="text-sm">
              <code>
                {`# Clone the repository
git clone https://github.com/iosazee/neb-starter.git my-app

# Navigate to the project directory
cd my-app

# Install dependencies
yarn install

# Set up environment variables
cp apps/web/.env.sample apps/web/.env.local
cp packages/database/.env.sample packages/database/.env

# Start development servers
yarn dev`}
              </code>
            </pre>
          </TabsContent>
          <TabsContent value="next" className="p-4 bg-muted rounded-md mt-2 overflow-x-auto">
            <pre className="text-sm">
              <code>
                {`# Start the Next.js web application
cd apps/web

# Start the development server
yarn dev

# The app will be available at http://localhost:3000
# You can also build for production
yarn build

# And run the production build
yarn start`}
              </code>
            </pre>
          </TabsContent>
          <TabsContent value="expo" className="p-4 bg-muted rounded-md mt-2 overflow-x-auto">
            <pre className="text-sm">
              <code>
                {`# Start the Expo mobile application
cd apps/mobile

# Start the development server
yarn dev

# IMPORTANT: This setup requires running a development build 
# on your own device or simulator. It may not work reliably 
# with the Expo Go app due to custom native modules.

# For iOS simulator
yarn ios

# For Android simulator
yarn android

# For development build on physical device
yarn run:ios    # For iOS devices
yarn run:android  # For Android devices`}
              </code>
            </pre>
          </TabsContent>
        </Tabs>
      </div>

      {/* CTA Section */}
      <div className="text-center max-w-2xl">
        <h2 className="text-2xl font-bold mb-4">Ready to build your cross-platform app?</h2>
        <p className="mb-6">
          Start building your next project with the NEB Starter Kit and focus on what matters most -
          your application&apos;s unique features.
        </p>
        <AuthButton
          loginText="Get Started Now"
          authenticatedText="Go to Dashboard"
          loginHref="/login"
          authenticatedHref="/(members)/dashboard"
          size="lg"
        />
      </div>
    </div>
  );
}
