import { Redirect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ActivityIndicator } from "react-native";
import { useAuth } from "~/lib/auth-client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchProfile, isProfileIncomplete, PREVENT_REDIRECT_KEY } from "~/lib/utils";
import { useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";

export default function Index() {
  const { isAuthenticated, isPending } = useAuth();
  const queryClient = useQueryClient();
  const [preventRedirect, setPreventRedirect] = useState(false);

  // Check SecureStore for the prevent redirect flag
  useEffect(() => {
    const checkRedirectFlag = async () => {
      try {
        const value = await SecureStore.getItemAsync(PREVENT_REDIRECT_KEY);
        if (value === "true") {
          setPreventRedirect(true);
        } else {
          setPreventRedirect(false);
        }
      } catch (error) {
        console.error("[RootIndex] Error getting redirect flag:", error);
        setPreventRedirect(false);
      }
    };

    checkRedirectFlag();
  }, []);

  // Check if we already have the profile data in cache
  const existingProfile = queryClient.getQueryData(["userProfile"]);

  // Only fetch profile if authenticated and we don't already have it
  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ["userProfile"],
    queryFn: fetchProfile,
    enabled: isAuthenticated && !isPending,
    staleTime: 1000, // Lower stale time for testing
  });

  // Use either cached or newly fetched profile
  const userProfile = profile || existingProfile;

  // Check profile completeness
  const incomplete = isAuthenticated && userProfile && isProfileIncomplete(userProfile);

  if (isPending || (isAuthenticated && isProfileLoading)) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  // If authenticated but profile is incomplete, redirect to update profile (unless prevented)
  if (incomplete && !preventRedirect) {
    return (
      <SafeAreaView className="flex-1 bg-[#fff]">
        <Redirect href="/(flows)/update-profile" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#fff]">
      <Redirect href={isAuthenticated ? "/(tabs)/dashboard" : "/(tabs)"} />
    </SafeAreaView>
  );
}
