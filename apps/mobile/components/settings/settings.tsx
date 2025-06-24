import React, { useState, useCallback } from "react";
import {
  View,
  Alert as RNAlert,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Text } from "~/components/ui/text";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "~/components/ui/alert";
import {
  Key,
  Info,
  Shield,
  Smartphone,
  AlertTriangle,
  CheckCircle,
  CheckCircle2,
  RefreshCw,
  XCircle,
  Mail,
} from "lucide-react-native";
import { revokePasskey, getStorageKeys } from "~/lib/auth-client";
import { syncPasskeyRegistrationStatus } from "~/lib/utils";
import { PasskeyRegistration } from "~/components/auth/passkey-registration";
import { useColorScheme } from "~/lib/useColorScheme";
import { formatDistanceToNow } from "date-fns";
import { queryClient } from "~/lib/query-client";
import * as SecureStore from "expo-secure-store";
import Animated, { FadeIn } from "react-native-reanimated";
import { usePasskeys } from "~/hooks/use-passkeys";

// Define the ServerPasskey type (same as in usePasskeys hook)
interface ServerPasskey {
  id: string;
  userId: string;
  credentialId: string;
  platform: string;
  lastUsed: string;
  status: "active" | "revoked";
  createdAt: string;
  updatedAt: string;
  revokedAt?: string;
  revokedReason?: string;
  metadata: Record<string, unknown>;
  aaguid?: string;
}

interface SettingsProps {
  user: {
    id: string;
    email: string;
    emailVerified?: boolean;
    phoneVerified?: boolean;
    firstName?: string;
    lastName?: string;
  };
}

export function Settings({ user }: SettingsProps) {
  const { colors } = useColorScheme();
  const [revokingCredentialId, setRevokingCredentialId] = useState<string | null>(null);

  // Use our custom hook to fetch and manage passkeys
  const {
    passkeys,
    hasRegisteredPasskey,
    currentDeviceHasCredential,
    currentCredentialId,
    isLoading,
    isRefetching,
    refetch,
  } = usePasskeys(user.id);

  // Warning background color
  const warningBgColor = colors.destructive + "10";
  // Gray/muted background color
  const mutedBgColor = colors.grey5 + "40";

  const updateSecureStoreFlag = async (passkeyList: ServerPasskey[]) => {
    // Update SecureStore flag based on whether user has any active passkeys
    const activePasskeys = passkeyList.filter((passkey) => passkey.status === "active");
    await syncPasskeyRegistrationStatus(activePasskeys.length);

    // console.info(
    //   `Updated SecureStore passkey flag based on ${activePasskeys.length} active passkeys`
    // );
  };

  const handlePasskeyRegistrationComplete = async () => {
    // Refetch passkeys and invalidate the query cache
    await refetch();
  };

  const handleRevokePasskey = useCallback(
    async (credentialId: string) => {
      RNAlert.alert(
        "Remove Passkey",
        "Are you sure you want to remove this passkey? You won't be able to use it for sign-in anymore.",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Remove",
            style: "destructive",
            onPress: async () => {
              try {
                setRevokingCredentialId(credentialId);

                // Use the package's revokePasskey function with updated parameters
                const result = await revokePasskey({
                  userId: user.id,
                  credentialId: credentialId,
                  reason: "user_requested",
                });

                if (result.error) {
                  throw result.error;
                }

                // If this is the current device credential, clean up local storage
                const STORAGE_KEYS = getStorageKeys();
                if (currentCredentialId === credentialId && STORAGE_KEYS) {
                  // The new structure stores credential IDs in CREDENTIAL_IDS key
                  const credentialIdsStr = await SecureStore.getItemAsync(
                    STORAGE_KEYS.CREDENTIAL_IDS
                  );
                  if (credentialIdsStr) {
                    try {
                      const credentials = JSON.parse(credentialIdsStr);
                      // Remove this credential ID
                      if (credentials[credentialId]) {
                        delete credentials[credentialId];
                        // Save the updated credentials
                        await SecureStore.setItemAsync(
                          STORAGE_KEYS.CREDENTIAL_IDS,
                          JSON.stringify(credentials)
                        );
                      }
                    } catch (error) {
                      console.error("Error updating stored credentials:", error);
                    }
                  }
                }

                // Invalidate relevant queries
                queryClient.invalidateQueries({ queryKey: ["session"] });
                queryClient.invalidateQueries({
                  queryKey: ["passkeys", user.id],
                });

                // Refetch to get updated list and update SecureStore flag
                await refetch();

                RNAlert.alert("Success", "Passkey has been removed successfully");
              } catch (error) {
                console.error("Error revoking passkey:", error);
                RNAlert.alert("Error", "Failed to remove passkey. Please try again.");
              } finally {
                setRevokingCredentialId(null);
              }
            },
          },
        ]
      );
    },
    [user.id, currentCredentialId, setRevokingCredentialId, refetch]
  );

  // Update SecureStore flag whenever passkeys change
  React.useEffect(() => {
    if (passkeys.length >= 0) {
      // Only run when we have actual data (even if empty)
      updateSecureStoreFlag(passkeys);
    }
  }, [passkeys]);

  // Format the date with a better error-handling approach
  const formatLastUsed = (lastUsedStr: string | undefined): string => {
    if (!lastUsedStr) return "Unknown";

    try {
      // First, check if the string is a valid date
      const date = new Date(lastUsedStr);

      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return "Recently";
      }

      // Use formatDistanceToNow with the date object directly
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      console.info("Error formatting date:", error);
      return "Recently";
    }
  };

  // Render item function for passkeys
  const renderPasskeyItem = useCallback(
    ({ item }: { item: ServerPasskey }) => {
      // Handle metadata parsing with proper type checking
      let metadata: Record<string, any> = {};

      if (typeof item.metadata === "string") {
        try {
          // Parse metadata if it's a string
          metadata = JSON.parse(item.metadata as string);
        } catch (error) {
          console.error("Error parsing metadata:", error);
          // Use empty object as fallback
          metadata = {};
        }
      } else if (typeof item.metadata === "object" && item.metadata !== null) {
        // If it's already an object, use it directly
        metadata = item.metadata as Record<string, any>;
      }

      // Use the new formatting function
      const formattedDate = formatLastUsed(item.lastUsed);

      const credentialId = item.credentialId;
      const isRevoking = revokingCredentialId === credentialId;
      const isCurrentDevice = currentCredentialId === credentialId;

      return (
        <Animated.View entering={FadeIn.duration(400).delay(200)} className="mb-4">
          <Card className="overflow-hidden border border-border">
            <CardContent className="p-0">
              <View className="p-4 border-b border-border">
                <View className="flex-row justify-between items-center">
                  <View className="flex-row items-center flex-1">
                    <View
                      className="p-2 mr-3 rounded-full"
                      style={{ backgroundColor: colors.primary + "15" }}
                    >
                      <Smartphone size={20} color={colors.primary} />
                    </View>
                    <View className="flex-1">
                      <Text className="font-semibold text-card-foreground">
                        {metadata.deviceName ||
                          metadata.deviceModel ||
                          (item.platform === "ios" ? "iOS Device" : "Android Device")}
                      </Text>
                      <Text className="text-xs text-muted-foreground">
                        Last used {formattedDate}
                      </Text>
                    </View>
                  </View>
                  {isCurrentDevice && (
                    <Badge variant="outline" className="border-primary/30 bg-primary/10">
                      <Text className="text-xs text-primary">Current Device</Text>
                    </Badge>
                  )}
                </View>
              </View>

              <View className="px-4 py-3 border-b border-border">
                <View className="flex-row justify-between">
                  <Text className="text-sm text-muted-foreground">Authentication</Text>
                  <Text className="text-sm font-medium">
                    {metadata.biometricType ||
                      (item.platform === "ios" ? "Face ID / Touch ID" : "Biometric")}
                  </Text>
                </View>
              </View>

              <View className="px-4 py-3 border-b border-border">
                <View className="flex-row justify-between">
                  <Text className="text-sm text-muted-foreground">Device Model</Text>
                  <Text className="text-sm font-medium">{metadata.deviceModel || "Unknown"}</Text>
                </View>
              </View>

              <View className="px-4 py-3">
                <View className="flex-row justify-between">
                  <Text className="text-sm text-muted-foreground">App Version</Text>
                  <Text className="text-sm font-medium">{metadata.appVersion || "Unknown"}</Text>
                </View>
              </View>

              {isCurrentDevice && (
                <View className="px-4 pb-4 pt-2">
                  <Button
                    variant="destructive"
                    onPress={() => handleRevokePasskey(credentialId)}
                    disabled={isRevoking}
                  >
                    {isRevoking ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <>
                        <XCircle size={16} className="mr-2" />
                        <Text>Remove This Passkey</Text>
                      </>
                    )}
                  </Button>
                </View>
              )}
            </CardContent>
          </Card>
        </Animated.View>
      );
    },
    [colors.primary, currentCredentialId, handleRevokePasskey, revokingCredentialId]
  );

  const fullName =
    user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : undefined;

  return (
    <Animated.View
      entering={FadeIn.duration(400)}
      className="space-y-6"
      style={Platform.OS === "android" ? { paddingBottom: 16 } : undefined}
    >
      {/* Account Security Status */}
      <Card className="mb-2 overflow-hidden border border-border">
        <CardHeader className="bg-card p-4 border-b border-border">
          <View className="flex-row items-center">
            <Shield size={20} color={colors.primary} className="mr-2" />
            <Text className="text-xl font-semibold text-card-foreground">Account Security</Text>
          </View>
        </CardHeader>
        <CardContent className="p-0">
          {/* Email Verification */}
          <View className="p-4 border-b border-border flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <View className="w-10 items-center">
                <Mail size={20} color={colors.grey2} />
              </View>
              <View className="flex-1 ml-2">
                <Text className="font-medium text-card-foreground">Email Verification</Text>
                <Text className="text-sm text-muted-foreground">
                  Verify your email for account security
                </Text>
              </View>
            </View>
            <Badge variant={user.emailVerified ? "default" : "secondary"}>
              {user.emailVerified ? (
                <View className="flex-row items-center">
                  <CheckCircle2 size={12} color="#fff" className="mr-1" />
                  <Text className="text-white text-xs">Verified</Text>
                </View>
              ) : (
                <Text className="text-xs">Not Verified</Text>
              )}
            </Badge>
          </View>

          {/* Phone Verification */}
          <View className="p-4 border-b border-border flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <View className="w-10 items-center">
                <Smartphone size={20} color={colors.grey2} />
              </View>
              <View className="flex-1 ml-2">
                <Text className="font-medium text-card-foreground">Phone Verification</Text>
                <Text className="text-sm text-muted-foreground">
                  Add a verified phone number for additional security
                </Text>
              </View>
            </View>
            <Badge variant={user.phoneVerified ? "default" : "secondary"}>
              {user.phoneVerified ? (
                <View className="flex-row items-center">
                  <CheckCircle2 size={12} color="#fff" className="mr-1" />
                  <Text className="text-white text-xs">Verified</Text>
                </View>
              ) : (
                <Text className="text-xs">Not Verified</Text>
              )}
            </Badge>
          </View>

          {!user.emailVerified && (
            <Alert icon={AlertTriangle} iconSize={20} variant="destructive" className="mx-4 my-4">
              <AlertTitle>Email Verification Required</AlertTitle>
              <AlertDescription>
                Please verify your email address to enable all security features.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Passkey Management */}
      <Card className="mb-2 overflow-hidden border border-border">
        <CardHeader className="bg-card p-4 border-b border-border">
          <View className="flex-row items-center">
            <Key size={20} color={colors.primary} className="mr-2" />
            <Text className="text-xl font-semibold text-card-foreground">Passkeys</Text>
          </View>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          {/* Passkey Registration */}
          {!currentDeviceHasCredential ? (
            <>
              <Alert icon={Info} iconSize={18}>
                <AlertTitle>Enable Passkeys</AlertTitle>
                <AlertDescription>
                  Passkeys let you sign in quickly and securely using your device&apos;s biometric
                  authentication.
                </AlertDescription>
              </Alert>
              <View className="border border-border rounded-lg overflow-hidden p-4">
                <PasskeyRegistration
                  userId={user.id}
                  userEmail={user.email}
                  userName={fullName}
                  onComplete={handlePasskeyRegistrationComplete}
                />
              </View>
            </>
          ) : (
            <Alert icon={CheckCircle} iconSize={20} className="mb-4">
              <AlertTitle>Passkey Enabled</AlertTitle>
              <AlertDescription>
                You have enabled passkey authentication on this device. You can now use biometrics
                to sign in.
              </AlertDescription>
            </Alert>
          )}

          {/* Registered Passkeys List */}
          {isLoading && !isRefetching ? (
            <View className="items-center justify-center py-6">
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : passkeys.length > 0 ? (
            <View>
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-lg font-semibold text-card-foreground">
                  Registered Devices
                </Text>
                <TouchableOpacity
                  className="flex-row items-center p-2 rounded-md"
                  style={{ backgroundColor: colors.grey5 }}
                  onPress={refetch}
                  disabled={isRefetching}
                  activeOpacity={0.7}
                >
                  {isRefetching ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <>
                      <RefreshCw size={16} color={colors.grey2} className="mr-1" />
                      <Text className="text-sm text-muted-foreground">Refresh</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {hasRegisteredPasskey && !currentDeviceHasCredential && (
                <View
                  className="mb-4 p-3 rounded-lg flex-row items-center"
                  style={{ backgroundColor: warningBgColor }}
                >
                  <AlertTriangle size={16} color={colors.destructive} className="mr-2" />
                  <Text className="flex-1 text-destructive">
                    You have passkeys on other devices, but not on this device yet.
                  </Text>
                </View>
              )}

              <FlatList
                data={passkeys}
                renderItem={renderPasskeyItem}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                contentContainerStyle={{ paddingBottom: 16 }}
              />
            </View>
          ) : (
            <View
              className="items-center justify-center py-6 rounded-lg"
              style={{ backgroundColor: mutedBgColor }}
            >
              <Key size={24} color={colors.grey2} className="mb-3" />
              <Text className="text-center text-muted-foreground">
                No passkeys registered. Register a passkey to enable biometric sign-in.
              </Text>
              <Button
                className="mt-4"
                variant="secondary"
                onPress={refetch}
                disabled={isRefetching}
              >
                {isRefetching ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <>
                    <RefreshCw size={16} className="mr-2" />
                    <Text>Refresh</Text>
                  </>
                )}
              </Button>
            </View>
          )}
        </CardContent>
      </Card>
    </Animated.View>
  );
}
