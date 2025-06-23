"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import {
  ArrowLeft,
  User,
  Shield,
  Bell,
  Palette,
  Key,
  Smartphone,
  Trash2,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { SessionUser } from "@/@types";
import { PasskeyRegistration } from "@/components/auth/passkey-registration";
import { listPasskeys, revokePasskey } from "@/lib/auth-client";
import { formatDistanceToNow } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SettingsShellProps {
  user: SessionUser;
}

interface Passkey {
  id: string;
  credentialId: string;
  platform: string;
  lastUsed: string;
  createdAt: string;
  status: "active" | "revoked";
  metadata?: {
    deviceName?: string;
    deviceModel?: string;
    registrationMethod?: string;
  };
}

export function SettingsShell({ user }: SettingsShellProps) {
  const [passkeys, setPasskeys] = useState<Passkey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showPasskeyRegistration, setShowPasskeyRegistration] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [passkeyDataLoaded, setPasskeyDataLoaded] = useState(false);

  const getInitials = (name: string): string => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase();
  };

  const userInitials = getInitials(`${user.firstName} ${user.lastName}`);

  const fetchPasskeys = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError("");

      const result = await listPasskeys({
        userId: user.id,
        limit: 50,
      });

      if (result.error) {
        throw result.error;
      }

      setPasskeys(result.data?.passkeys || []);
      setPasskeyDataLoaded(true);
    } catch (err) {
      console.error("Failed to fetch passkeys:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch passkeys");
    } finally {
      setLoading(false);
    }
  };

  const handleRevokePasskey = async (credentialId: string) => {
    if (!user?.id) return;

    if (
      !confirm(
        "Are you sure you want to remove this passkey? You won't be able to use it for sign-in anymore."
      )
    ) {
      return;
    }

    try {
      setRevoking(credentialId);

      const result = await revokePasskey({
        userId: user.id,
        credentialId,
        reason: "user_requested",
      });

      if (result.error) {
        throw result.error;
      }

      await fetchPasskeys();
      alert("Passkey has been removed successfully");
    } catch (err) {
      console.error("Failed to revoke passkey:", err);
      alert("Failed to remove passkey. Please try again.");
    } finally {
      setRevoking(null);
    }
  };

  const handlePasskeyRegistrationComplete = () => {
    setShowPasskeyRegistration(false);
    fetchPasskeys();
  };

  const handlePasskeyRegistrationError = (error: Error) => {
    console.error("Passkey registration error:", error);
    setError(error.message);
  };

  // Load passkeys when the security tab is accessed
  const handleSecurityTabClick = () => {
    if (!passkeyDataLoaded) {
      fetchPasskeys();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="container mx-auto py-6 px-4 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground">Manage your account and preferences</p>
          </div>
        </div>

        {/* Settings Tabs */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="flex items-center gap-2"
              onClick={handleSecurityTabClick}
            >
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Preferences
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-20 w-20">
                    {user.image ? (
                      <AvatarImage src={user.image} alt={`${user.firstName} ${user.lastName}`} />
                    ) : null}
                    <AvatarFallback className="text-lg">{userInitials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-medium">
                      {user.firstName} {user.lastName}
                    </h3>
                    <p className="text-muted-foreground">{user.email}</p>
                    <Badge variant="outline" className="mt-2">
                      {user.role || "user"}
                    </Badge>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">First Name</label>
                      <p className="text-sm text-muted-foreground mt-1">{user.firstName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Last Name</label>
                      <p className="text-sm text-muted-foreground mt-1">{user.lastName}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Email Address</label>
                    <p className="text-sm text-muted-foreground mt-1">{user.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Account Role</label>
                    <p className="text-sm text-muted-foreground mt-1">{user.role || "user"}</p>
                  </div>
                </div>

                <div className="pt-4">
                  <Button>Edit Profile</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <div className="space-y-6">
              {/* Account Security Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Account Security
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Email Verification</h4>
                        <p className="text-sm text-muted-foreground">
                          Verify your email for account security
                        </p>
                      </div>
                      <Badge variant={user.emailVerified ? "default" : "secondary"}>
                        {user.emailVerified ? (
                          <div className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Verified
                          </div>
                        ) : (
                          "Not Verified"
                        )}
                      </Badge>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Two-Factor Authentication</h4>
                        <p className="text-sm text-muted-foreground">
                          Add an extra layer of security
                        </p>
                      </div>
                      <Badge variant="secondary">Not Enabled</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Passkey Management */}
              {showPasskeyRegistration ? (
                <PasskeyRegistration
                  userId={user.id}
                  userEmail={user.email}
                  userName={`${user.firstName} ${user.lastName}`}
                  onComplete={handlePasskeyRegistrationComplete}
                  onError={handlePasskeyRegistrationError}
                />
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Key className="h-5 w-5" />
                        Passkeys
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={fetchPasskeys}
                          disabled={loading}
                        >
                          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                          Refresh
                        </Button>
                        <Button onClick={() => setShowPasskeyRegistration(true)}>
                          <Key className="h-4 w-4 mr-2" />
                          Add Passkey
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {error && (
                      <Alert variant="destructive" className="mb-4">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    {loading && !passkeyDataLoaded ? (
                      <div className="flex items-center justify-center py-8">
                        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                        <span>Loading passkeys...</span>
                      </div>
                    ) : passkeys.length === 0 ? (
                      <div className="text-center py-8">
                        <Key className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">No passkeys registered</h3>
                        <p className="text-muted-foreground mb-4">
                          Add a passkey to enable secure, passwordless sign-in.
                        </p>
                        <Button onClick={() => setShowPasskeyRegistration(true)}>
                          <Key className="h-4 w-4 mr-2" />
                          Register Your First Passkey
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {passkeys.map((passkey) => (
                          <Card key={passkey.id} className="border">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                                    <Smartphone className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                  </div>
                                  <div>
                                    <h4 className="font-medium">
                                      {passkey.metadata?.deviceName ||
                                        (passkey.platform === "web" ? "Web Browser" : "Device")}
                                    </h4>
                                    <div className="text-sm text-muted-foreground space-y-1">
                                      <p>
                                        Last used{" "}
                                        {formatDistanceToNow(new Date(passkey.lastUsed), {
                                          addSuffix: true,
                                        })}
                                      </p>
                                      <p>Platform: {passkey.platform}</p>
                                      {passkey.metadata?.deviceModel && (
                                        <p className="truncate max-w-md">
                                          Device: {passkey.metadata.deviceModel}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleRevokePasskey(passkey.credentialId)}
                                  disabled={revoking === passkey.credentialId}
                                >
                                  {revoking === passkey.credentialId ? (
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Information Card */}
              <Card>
                <CardHeader>
                  <CardTitle>About Passkeys</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Passkeys are a secure, passwordless way to sign in using your device's built-in
                    authentication methods like fingerprint, face recognition, or security keys.
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>More secure than passwords</li>
                    <li>Faster and more convenient sign-in</li>
                    <li>Unique to each website - can't be reused by attackers</li>
                    <li>Protected by your device's security</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Email Notifications</h4>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications via email
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Configure
                    </Button>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Security Alerts</h4>
                      <p className="text-sm text-muted-foreground">
                        Get notified about security events
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Configure
                    </Button>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Account Updates</h4>
                      <p className="text-sm text-muted-foreground">Updates about your account</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Configure
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences">
            <Card>
              <CardHeader>
                <CardTitle>Application Preferences</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Theme</h4>
                      <p className="text-sm text-muted-foreground">Choose your preferred theme</p>
                    </div>
                    <Button variant="outline" size="sm">
                      System
                    </Button>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Language</h4>
                      <p className="text-sm text-muted-foreground">Select your language</p>
                    </div>
                    <Button variant="outline" size="sm">
                      English
                    </Button>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Timezone</h4>
                      <p className="text-sm text-muted-foreground">Set your timezone</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Auto-detect
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
