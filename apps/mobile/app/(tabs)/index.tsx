import React, { useState } from "react";
import { ScrollView, View, Linking } from "react-native";
import { Text } from "~/components/ui/text";
import { Button } from "~/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "~/components/ui/tabs";
import {
  Github,
  Database,
  Lock,
  Smartphone,
  Globe,
  Code2,
  Flame,
  LucideIcon,
} from "~/lib/icons/lucide-icons";
import { router } from "expo-router";
import { NAV_THEME } from "~/theme";

// Type definitions
interface FeatureCard {
  icon: LucideIcon;
  title: string;
  description: string;
  content: string;
}

type TabContentMap = {
  [key: string]: string;
};

export default function HomeScreen() {
  // Use state for tab value
  const [tabValue, setTabValue] = useState<string>("setup");

  const openGitHub = () => {
    Linking.openURL("https://github.com/iosazee/neb-starter");
  };

  const getStarted = () => {
    router.push("/(auth)/login");
  };

  // Tab content
  const tabContent: TabContentMap = {
    setup: `# Clone the repository
git clone https://github.com/iosazee/neb-starter.git my-app

# Navigate to the project directory
cd my-app

# Install dependencies
yarn install

# Set up environment variables
cp apps/web/.env.sample apps/web/.env.local
cp packages/database/.env.sample packages/database/.env

# Start development servers
yarn dev`,
    next: `# Start the Next.js web application
cd apps/web

# Start the development server
yarn dev

# The app will be available at http://localhost:3000
# You can also build for production
yarn build

# And run the production build
yarn start`,
    expo: `# Start the Expo mobile application
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
yarn run:android  # For Android devices`,
  };

  // Feature cards data
  const featureCards: FeatureCard[] = [
    {
      icon: Globe,
      title: "Next.js Web App",
      description: "Modern web frontend and backend with the latest Next.js features",
      content:
        "Built with App Router and server components to deliver fast, SEO-friendly web experiences with optimal performance.",
    },
    {
      icon: Smartphone,
      title: "Expo Mobile App",
      description: "Cross-platform mobile experiences with Expo and React Native",
      content:
        "Develop iOS and Android applications from a single codebase with Expo's powerful toolchain and React Native.",
    },
    {
      icon: Lock,
      title: "Authentication",
      description: "Secure, pre-configured auth with better-auth",
      content:
        "Implement secure authentication and authorization flows across web and mobile platforms with minimal configuration.",
    },
    {
      icon: Database,
      title: "Database Integration",
      description: "Type-safe database access with Prisma ORM",
      content:
        "Uses Prisma ORM with Neon PostgreSQL for remote database access. You can easily swap this out with a database of your choice (MySQL, SQLite, etc.) and an ORM of your preference or just plain SQL queries.",
    },
    {
      icon: Code2,
      title: "Monorepo Structure",
      description: "Organized codebase with shared packages",
      content:
        "Efficiently manage your web and mobile applications in a single repository with shared types, components, and business logic.",
    },
    {
      icon: Flame,
      title: "Flexible Deployment",
      description: "Deploy your application with the provider of your choice",
      content:
        "The web app can be deployed to any platform that runs Node.js - including serverless providers (Vercel, Netlify, AWS, Cloudflare Pages) or self-hosted on your own VPS infrastructure with equal ease.",
    },
  ];

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="px-4 py-16 items-center">
        {/* Hero Section */}
        <View className="items-center mb-12">
          <Text className="text-4xl font-poppins-bold tracking-tight mb-4 text-center text-foreground">
            NEB Starter Kit
          </Text>
          <Text className="text-xl text-muted-foreground text-center mb-6">
            A production-ready universal app monorepo featuring Next.js, Expo, and better-auth
          </Text>

          {/* Badges */}
          <View className="flex-row flex-wrap justify-center mb-6">
            <Badge variant="outline" className="mx-0.5 mb-1">
              <Text>Next.js</Text>
            </Badge>
            <Badge variant="outline" className="mx-0.5 mb-1">
              <Text>Expo</Text>
            </Badge>
            <Badge variant="outline" className="mx-0.5 mb-1">
              <Text>Better-auth</Text>
            </Badge>
            <Badge variant="outline" className="mx-0.5 mb-1">
              <Text>Prisma ORM</Text>
            </Badge>
            <Badge variant="outline" className="mx-0.5 mb-1">
              <Text>Tailwind CSS v4</Text>
            </Badge>
            <Badge variant="outline" className="mx-0.5 mb-1">
              <Text>shadcn/ui</Text>
            </Badge>
          </View>

          {/* Buttons */}
          <View className="flex-row flex-wrap justify-center gap-4 mb-6">
            <Button onPress={getStarted}>
              <Text>Get Started</Text>
            </Button>
            <Button variant="outline" onPress={openGitHub}>
              <View className="flex-row items-center gap-2">
                <Github size={16} color="#000" />
                <Text>GitHub</Text>
              </View>
            </Button>
          </View>
        </View>

        {/* Features Section */}
        <View className="w-full mb-12">
          {featureCards.map((card, index) => (
            <Card key={index} className="mb-4">
              <CardHeader>
                <View className="mb-2">
                  <card.icon
                    size={32}
                    color={NAV_THEME.light.colors.primary}
                    width={32}
                    height={32}
                  />
                </View>
                <CardTitle>{card.title}</CardTitle>
                <CardDescription>{card.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Text>{card.content}</Text>
              </CardContent>
            </Card>
          ))}
        </View>

        {/* Code Samples */}
        <View className="w-full mb-12">
          <Tabs value={tabValue} onValueChange={setTabValue}>
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="setup">Quick Setup</TabsTrigger>
              <TabsTrigger value="next">Next.js App</TabsTrigger>
              <TabsTrigger value="expo">Expo App</TabsTrigger>
            </TabsList>

            <TabsContent value="setup">
              <View className="p-4 bg-muted rounded-md mt-2">
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <Text className="text-sm font-poppins-regular text-foreground dark:text-red-800">
                    {tabContent.setup}
                  </Text>
                </ScrollView>
              </View>
            </TabsContent>

            <TabsContent value="next">
              <View className="p-4 bg-muted rounded-md mt-2">
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <Text className="text-sm font-poppins-regular text-foreground dark:text-red-800">
                    {tabContent.next}
                  </Text>
                </ScrollView>
              </View>
            </TabsContent>

            <TabsContent value="expo">
              <View className="p-4 bg-muted rounded-md mt-2">
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <Text className="text-sm font-poppins-regular text-foreground dark:text-red-800">
                    {tabContent.expo}
                  </Text>
                </ScrollView>
              </View>
            </TabsContent>
          </Tabs>
        </View>

        {/* CTA Section */}
        <View className="items-center mb-8">
          <Text className="text-2xl font-poppins-bold mb-4 text-center">
            Ready to build your cross-platform app?
          </Text>
          <Text className="mb-6 text-center text-muted-foreground">
            Start building your next project with the NEB Starter Kit and focus on what matters most
            - your application&apos;s unique features.
          </Text>
          <Button size="lg" onPress={getStarted}>
            <Text>Get Started Now</Text>
          </Button>
        </View>
      </View>
    </ScrollView>
  );
}
