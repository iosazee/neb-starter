import React, { useState, useEffect, useTransition } from "react";
import { View, TextInput, Button, Text, Alert, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { $fetch } from "~/lib/auth-client";
import * as SecureStore from "expo-secure-store";
import { PREVENT_REDIRECT_KEY } from "~/lib/utils";

type ProfileData = {
  id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
};

type ProfileResponse =
  | {
      data?: ProfileData;
      error?: any;
    }
  | ProfileData;

const API_BASE = "https://neb-starter.vercel.app/api/mobile";

// --- Update user profile using $fetch
const updateProfile = async (data: { firstName: string; lastName: string; email: string }) => {
  try {
    const response = await $fetch<{ data: any }>(`${API_BASE}/profile/update`, {
      method: "POST",
      body: data,
    });

    if (response.error) {
      console.error("Error updating profile:", response.error);
      throw new Error(response.error?.message || "Failed to update profile");
    }

    return response.data;
  } catch (error: any) {
    console.error("Error updating profile:", error);
    throw new Error(error?.message || "Failed to update profile");
  }
};

// --- Email validation helper
const isValidEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export default function UpdateProfile() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();

  const existingProfile = queryClient.getQueryData<ProfileResponse>(["userProfile"]);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set flag in SecureStore to prevent automatic redirection
    const setRedirectFlag = async () => {
      try {
        await SecureStore.setItemAsync(PREVENT_REDIRECT_KEY, "true");
      } catch (error) {
        console.error("[UpdateProfile] Error setting redirect flag:", error);
      }
    };

    setRedirectFlag();

    if (existingProfile) {
      // Extract user data from the nested structure
      const userData: ProfileData =
        existingProfile && "data" in existingProfile && existingProfile.data
          ? existingProfile.data
          : (existingProfile as ProfileData) || {};

      setFirstName(userData.firstName ?? "");
      setLastName(userData.lastName ?? "");
      setEmail(userData.email ?? "");
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }

    // Cleanup function to remove the flag when unmounting
    return () => {
      const clearRedirectFlag = async () => {
        try {
          await SecureStore.deleteItemAsync(PREVENT_REDIRECT_KEY);
        } catch (error) {
          console.error("[UpdateProfile] Error clearing redirect flag:", error);
        }
      };

      clearRedirectFlag();
    };
  }, [existingProfile]);

  const mutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      // Invalidate and refetch queries after a successful update
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });

      Alert.alert("Success", "Profile updated successfully", [
        {
          text: "OK",
          onPress: () => {
            startTransition(() => {
              router.replace("/(tabs)/dashboard");
            });
          },
        },
      ]);
    },
    onError: (err: Error) => {
      Alert.alert("Update Failed", err.message);
    },
  });

  const handleSubmit = () => {
    if (!firstName || !lastName || !email) {
      Alert.alert("Validation Error", "All fields are required");
      return;
    }

    if (!isValidEmail(email)) {
      Alert.alert("Validation Error", "Invalid email address");
      return;
    }

    mutation.mutate({ firstName, lastName, email });
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View className="flex-1 p-4">
      <Text className="text-2xl font-bold mb-6">Update Your Profile</Text>

      <Text className="mb-2">First Name</Text>
      <TextInput
        value={firstName}
        onChangeText={setFirstName}
        placeholder="First Name"
        className="border p-2 mb-4 rounded-md"
      />

      <Text className="mb-2">Last Name</Text>
      <TextInput
        value={lastName}
        onChangeText={setLastName}
        placeholder="Last Name"
        className="border p-2 mb-4 rounded-md"
      />

      <Text className="mb-2">Email</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        keyboardType="email-address"
        autoCapitalize="none"
        className="border p-2 mb-6 rounded-md"
      />

      <Button
        title={mutation.isPending || isPending ? "Updating..." : "Update Profile"}
        disabled={mutation.isPending || isPending}
        onPress={handleSubmit}
      />
    </View>
  );
}
