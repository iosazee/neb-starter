import React from "react";
import { View, ScrollView, ActivityIndicator } from "react-native";
import { Text } from "~/components/ui/text";
import { Button } from "~/components/ui/button";
import { router } from "expo-router";
import { useAuth } from "~/lib/auth-client";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NotFoundScreen() {
  const { isAuthenticated, isPending } = useAuth();

  const navigateHome = () => {
    if (isAuthenticated) {
      router.push("/(tabs)/dashboard");
    } else {
      router.push("/(tabs)");
    }
  };

  if (isPending) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="px-4 py-16 items-center justify-center flex-1">
          <View className="items-center">
            <Text className="text-6xl font-poppins-bold tracking-tight mb-4 text-center text-foreground">
              404
            </Text>
            <Text className="text-xl text-muted-foreground text-center mb-6">
              Oops! The page you&apos;re looking for doesn&apos;t exist.
            </Text>
            <Button size="lg" onPress={navigateHome}>
              <Text>Return to {isAuthenticated ? "Dashboard" : "Home"}</Text>
            </Button>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
