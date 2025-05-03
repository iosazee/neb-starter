import React, { useState, useEffect } from "react";
import { View, ScrollView, TouchableOpacity, Pressable } from "react-native";
import { useTheme } from "@react-navigation/native";
import { router } from "expo-router";
import { BarChart, Settings, User, Calendar, CreditCard, Users, LogOut } from "lucide-react-native";
import { Text } from "~/components/ui/text";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "~/components/ui/alert";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "~/components/ui/tabs";
import { useAuth, signOut } from "~/lib/auth-client";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";

export default function DashboardScreen() {
  const { colors } = useTheme();
  const { session, isAuthenticated, isPending } = useAuth();
  const [tabValue, setTabValue] = useState("overview");
  const [menuOpen, setMenuOpen] = useState(false);

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
    <View className="flex-1 bg-background">
      {/* Backdrop for menu closing */}
      {menuOpen && (
        <Pressable
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 5,
          }}
          onPress={() => setMenuOpen(false)}
        />
      )}

      {/* Header/App Bar - Similar to web navbar */}
      <View className="h-16 flex-row items-center justify-between px-4 bg-card border-b border-border">
        <Text className="text-lg font-bold">Dashboard</Text>
        <TouchableOpacity onPress={() => setMenuOpen(!menuOpen)}>
          <Avatar className="h-10 w-10" alt="">
            {user.image ? <AvatarImage source={{ uri: user.image }} /> : null}
            <AvatarFallback>
              <Text>{getInitials()}</Text>
            </AvatarFallback>
          </Avatar>
        </TouchableOpacity>
      </View>

      {/* User dropdown menu - Similar to web dropdown */}
      {menuOpen && (
        <View className="absolute right-4 top-16 z-10 w-56 bg-card rounded-md shadow-lg p-2 border border-border">
          <View className="p-2 border-b border-border">
            <Text className="font-medium">
              {user.firstName} {user.lastName}
            </Text>
            <Text className="text-xs text-muted-foreground">{user.email}</Text>
            <Text className="text-xs text-muted-foreground mt-1">Role: {user.role || "user"}</Text>
          </View>
          <TouchableOpacity
            className="flex-row items-center p-2"
            onPress={() => {
              setMenuOpen(false);
              router.push("/profile");
            }}
          >
            <User size={16} className="mr-2" color={colors.text} />
            <Text>Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-row items-center p-2"
            onPress={() => {
              setMenuOpen(false);
            }}
          >
            <Settings size={16} className="mr-2" color={colors.text} />
            <Text>Settings</Text>
          </TouchableOpacity>
          <View className="h-px bg-border my-1" />
          <TouchableOpacity
            className="flex-row items-center p-2"
            onPress={() => {
              setMenuOpen(false);
              handleSignOut();
            }}
          >
            <LogOut size={16} className="mr-2" color={colors.notification} />
            <Text className="text-destructive">Sign Out</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Main Content */}
      <ScrollView className="flex-1 px-4 py-4">
        {/* Welcome card - Matches web version */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Welcome to your dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <Text className="text-muted-foreground">
              Hello, {user.firstName}! You are logged in as {user.role || "user"}.
            </Text>
            <Text className="text-muted-foreground mt-2">
              This is a simple starter dashboard for your application.
            </Text>
          </CardContent>
        </Card>

        {/* Dashboard navigation - Using tabs instead of sidebar for mobile */}
        <Tabs value={tabValue} onValueChange={setTabValue} className="mb-6">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TabsList orientation="horizontal">
              <TabsTrigger value="overview">
                <View className="flex-row items-center">
                  <BarChart size={16} className="mr-1" />
                  <Text>Overview</Text>
                </View>
              </TabsTrigger>
              <TabsTrigger value="users">
                <View className="flex-row items-center">
                  <Users size={16} className="mr-1" />
                  <Text>Users</Text>
                </View>
              </TabsTrigger>
              <TabsTrigger value="calendar">
                <View className="flex-row items-center">
                  <Calendar size={16} className="mr-1" />
                  <Text>Calendar</Text>
                </View>
              </TabsTrigger>
              <TabsTrigger value="billing">
                <View className="flex-row items-center">
                  <CreditCard size={16} className="mr-1" />
                  <Text>Billing</Text>
                </View>
              </TabsTrigger>
            </TabsList>
          </ScrollView>

          <TabsContent value="overview">
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>User Information</CardTitle>
              </CardHeader>
              <CardContent>
                <View className="space-y-3">
                  <View className="flex-row justify-between items-center">
                    <Text className="font-medium">Full Name:</Text>
                    <Text>
                      {user.firstName} {user.lastName}
                    </Text>
                  </View>
                  <View className="flex-row justify-between items-center">
                    <Text className="font-medium">Email:</Text>
                    <Text>{user.email}</Text>
                  </View>
                  <View className="flex-row justify-between items-center">
                    <Text className="font-medium">Role:</Text>
                    <Text>{user.role || "user"}</Text>
                  </View>
                  <View className="flex-row justify-between items-center">
                    <Text className="font-medium">Account Status:</Text>
                    <Badge variant="secondary">
                      <Text>Active</Text>
                    </Badge>
                  </View>
                </View>
              </CardContent>
            </Card>

            <Alert icon={BarChart}>
              <AlertTitle>Dashboard Overview</AlertTitle>
              <AlertDescription>
                This is where you would display key metrics and overview information.
              </AlertDescription>
            </Alert>
          </TabsContent>

          <TabsContent value="users">
            <Alert icon={Users}>
              <AlertTitle>User Management</AlertTitle>
              <AlertDescription>View and manage users in your application.</AlertDescription>
            </Alert>

            <Card className="mt-4">
              <CardContent className="py-4">
                <Text className="text-center text-muted-foreground">
                  User management features will appear here.
                </Text>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calendar">
            <Alert icon={Calendar}>
              <AlertTitle>Calendar</AlertTitle>
              <AlertDescription>View your schedule and upcoming events.</AlertDescription>
            </Alert>

            <Card className="mt-4">
              <CardContent className="py-4">
                <Text className="text-center text-muted-foreground">
                  Your calendar and schedule will appear here.
                </Text>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing">
            <Alert icon={CreditCard}>
              <AlertTitle>Billing</AlertTitle>
              <AlertDescription>Manage your billing and subscription details.</AlertDescription>
            </Alert>

            <Card className="mt-4">
              <CardContent className="py-4">
                <Text className="text-center text-muted-foreground">
                  Your billing information will appear here.
                </Text>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </ScrollView>
    </View>
  );
}
