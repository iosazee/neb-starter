import { useEffect } from "react";
import { Tabs, usePathname, router } from "expo-router";
import { Home, User, LayoutDashboard } from "lucide-react-native";
import { Image, Pressable, View, ActivityIndicator } from "react-native";
import { useColorScheme } from "~/lib/useColorScheme";
import { ThemeToggle } from "~/components/ui/theme-toggle";
import { PlatformPressable } from "@react-navigation/elements";
import { useAuth } from "~/lib/auth-client";

export default function TabsLayout() {
  const { isDarkColorScheme } = useColorScheme();
  const { isAuthenticated, isPending } = useAuth();
  const pathname = usePathname();

  // Check if user tries to access protected routes
  useEffect(() => {
    // Only redirect if trying to access protected tabs and not authenticated
    if (!isPending && !isAuthenticated) {
      // Check if current path is a protected route
      if (pathname === "/(tabs)/dashboard" || pathname === "/(tabs)/profile") {
        // Redirect to login
        router.replace("/(auth)/login");
      }
    }
  }, [isAuthenticated, isPending, pathname]);

  // Show loading while checking authentication
  if (isPending && (pathname === "/(tabs)/dashboard" || pathname === "/(tabs)/profile")) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: {
          height: 100,
        },
        tabBarStyle: {
          backgroundColor: isDarkColorScheme ? "rgb(21, 21, 24)" : "rgb(255, 255, 255)",
        },
        tabBarButton: (props) => (
          <PlatformPressable {...props} android_ripple={{ color: "transparent" }} />
        ),
        headerLeft: () => (
          <View className="flex-row items-center ml-8">
            <Pressable>
              <Image
                source={
                  isDarkColorScheme
                    ? require("~/assets/images/logo.png")
                    : require("~/assets/images/logo.png")
                }
                className="w-12 h-12"
                resizeMode="contain"
              />
            </Pressable>
          </View>
        ),
        headerTitle: "",
        headerRight: () => (
          <View className="mr-8">
            <ThemeToggle />
          </View>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color }) => <LayoutDashboard size={24} color={color} />,
          // Hide dashboard tab for non-authenticated users
          href: isAuthenticated ? "/(tabs)/dashboard" : null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <User size={24} color={color} />,
          // Hide profile tab for non-authenticated users
          href: isAuthenticated ? "/(tabs)/profile" : null,
        }}
      />
    </Tabs>
  );
}
