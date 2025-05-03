import React, { useState, useEffect } from "react";
import { View, ScrollView } from "react-native";
import { Text } from "~/components/ui/text";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "~/components/ui/tabs";
import { LogOut, Edit, ChevronRight } from "lucide-react-native";
import { useAuth, signOut } from "~/lib/auth-client";
import { Settings as SecuritySettings } from "~/components/settings/settings";
import { router } from "expo-router";
import Animated, { FadeIn } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@react-navigation/native";

export default function ProfileScreen() {
  const { colors } = useTheme();
  const { session, isAuthenticated, isPending } = useAuth();
  const [tabValue, setTabValue] = useState("profile");

  useEffect(() => {
    if (!isPending && !isAuthenticated) {
      router.replace("/(auth)/login");
    }
  }, [isAuthenticated, isPending]);

  if (isPending || !session) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text>Loading...</Text>
      </View>
    );
  }

  const user = session.user;

  // Get initials for avatar fallback
  const getInitials = () => {
    if (!user.firstName && !user.lastName) return "U";
    return `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase();
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace("/(auth)/login");
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
      <ScrollView className="flex-1 bg-background">
        <View className="px-4 py-6">
          {/* Profile Header */}
          <Animated.View entering={FadeIn.duration(400)} className="items-center mb-6">
            <Avatar className="h-10 w-10" alt="">
              {user.image ? <AvatarImage source={{ uri: user.image }} /> : null}
              <AvatarFallback>
                <Text>{getInitials()}</Text>
              </AvatarFallback>
            </Avatar>
            <Text className="text-2xl font-bold mb-1">
              {user.firstName} {user.lastName}
            </Text>
            <Text className="text-muted-foreground mb-2">{user.email}</Text>
            <Badge variant="outline">
              <Text>Role: {user.role || "user"}</Text>
            </Badge>
          </Animated.View>

          {/* Profile Tabs */}
          <Tabs value={tabValue} onValueChange={setTabValue} className="mb-6">
            <TabsList>
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            {/* Profile Tab Content */}
            <TabsContent value="profile">
              <Card className="mb-4">
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Manage your personal details</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {/* Name */}
                  <View className="p-4 border-b border-border flex-row items-center justify-between">
                    <View>
                      <Text className="text-sm text-muted-foreground">First Name</Text>
                      <Text className="font-medium">{user.firstName || "Not set"}</Text>
                    </View>
                    <Button variant="ghost" size="sm">
                      <Edit size={16} color={colors.primary} />
                    </Button>
                  </View>

                  {/* Last Name */}
                  <View className="p-4 border-b border-border flex-row items-center justify-between">
                    <View>
                      <Text className="text-sm text-muted-foreground">Last Name</Text>
                      <Text className="font-medium">{user.lastName || "Not set"}</Text>
                    </View>
                    <Button variant="ghost" size="sm">
                      <Edit size={16} color={colors.primary} />
                    </Button>
                  </View>

                  {/* Email */}
                  <View className="p-4 border-b border-border flex-row items-center justify-between">
                    <View>
                      <Text className="text-sm text-muted-foreground">Email</Text>
                      <Text className="font-medium">{user.email}</Text>
                    </View>
                    <Button variant="ghost" size="sm">
                      <Edit size={16} color={colors.primary} />
                    </Button>
                  </View>

                  {/* Additional fields can be added here */}
                </CardContent>
              </Card>

              <Card className="mb-4">
                <CardHeader>
                  <CardTitle>Account Information</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {/* Account Created */}
                  <View className="p-4 border-b border-border">
                    <Text className="text-sm text-muted-foreground">Account Created</Text>
                    <Text className="font-medium">April 7, 2025</Text>
                  </View>

                  {/* Account Status */}
                  <View className="p-4 flex-row items-center justify-between">
                    <Text className="text-sm text-muted-foreground">Account Status</Text>
                    <Badge variant="default">
                      <Text className="text-white text-xs">Active</Text>
                    </Badge>
                  </View>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Tab Content */}
            <TabsContent value="security">
              <SecuritySettings user={user} />
            </TabsContent>

            {/* Settings Tab Content */}
            <TabsContent value="settings">
              <Card className="mb-4">
                <CardHeader>
                  <CardTitle>Application Settings</CardTitle>
                  <CardDescription>Customize your app experience</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {/* Notification Settings */}
                  <View className="p-4 border-b border-border flex-row items-center justify-between">
                    <View>
                      <Text className="font-medium">Notification Settings</Text>
                      <Text className="text-sm text-muted-foreground">
                        Manage your notifications
                      </Text>
                    </View>
                    <ChevronRight size={20} color={colors.text + "80"} />
                  </View>

                  {/* Appearance */}
                  <View className="p-4 border-b border-border flex-row items-center justify-between">
                    <View>
                      <Text className="font-medium">Appearance</Text>
                      <Text className="text-sm text-muted-foreground">
                        Dark mode and theme preferences
                      </Text>
                    </View>
                    <ChevronRight size={20} color={colors.text + "80"} />
                  </View>

                  {/* Privacy */}
                  <View className="p-4 border-b border-border flex-row items-center justify-between">
                    <View>
                      <Text className="font-medium">Privacy</Text>
                      <Text className="text-sm text-muted-foreground">
                        Manage your privacy settings
                      </Text>
                    </View>
                    <ChevronRight size={20} color={colors.text + "80"} />
                  </View>

                  {/* Language */}
                  <View className="p-4 flex-row items-center justify-between">
                    <View>
                      <Text className="font-medium">Language</Text>
                      <Text className="text-sm text-muted-foreground">
                        Set your preferred language
                      </Text>
                    </View>
                    <ChevronRight size={20} color={colors.text + "80"} />
                  </View>
                </CardContent>
              </Card>

              <Card className="mb-4">
                <CardHeader>
                  <CardTitle>Support</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {/* Help Center */}
                  <View className="p-4 border-b border-border flex-row items-center justify-between">
                    <View>
                      <Text className="font-medium">Help Center</Text>
                      <Text className="text-sm text-muted-foreground">Get help with the app</Text>
                    </View>
                    <ChevronRight size={20} color={colors.text + "80"} />
                  </View>

                  {/* Contact Support */}
                  <View className="p-4 border-b border-border flex-row items-center justify-between">
                    <View>
                      <Text className="font-medium">Contact Support</Text>
                      <Text className="text-sm text-muted-foreground">
                        Reach out to our support team
                      </Text>
                    </View>
                    <ChevronRight size={20} color={colors.text + "80"} />
                  </View>

                  {/* About */}
                  <View className="p-4 flex-row items-center justify-between">
                    <View>
                      <Text className="font-medium">About</Text>
                      <Text className="text-sm text-muted-foreground">
                        App version and information
                      </Text>
                    </View>
                    <Text className="text-sm text-muted-foreground">v1.0.0</Text>
                  </View>
                </CardContent>
              </Card>

              {/* Sign Out Button */}
              <Button variant="destructive" className="w-full mb-6" onPress={handleSignOut}>
                <LogOut size={16} className="mr-2" />
                <Text>Sign Out</Text>
              </Button>
            </TabsContent>
          </Tabs>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
