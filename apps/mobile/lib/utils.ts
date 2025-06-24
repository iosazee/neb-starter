import { $fetch } from "~/lib/auth-client";
import * as SecureStore from "expo-secure-store";

// Constants
export const PASSKEY_REGISTERED_KEY = "neb_starter_passkey_registered";
const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL;

// Global flag for preventing automatic redirects
export const PREVENT_REDIRECT_KEY = "preventProfileRedirect";

// Helper function to check profile completeness
export const isProfileIncomplete = (profile: any) => {
  // Guard clause - early return if profile is falsy
  if (!profile) {
    return false;
  }

  // Check if profile data is nested inside a data property
  const userData = profile.data || profile;

  // Special case placeholders that indicate incomplete profiles
  const placeholderFirstNames = ["Apple", "User", "New"];
  const placeholderLastNames = ["User"];

  // Get the first and last name values, defaulting to empty strings
  const firstName = userData?.firstName || "";
  const lastName = userData?.lastName || "";

  // Check for default/placeholder names - ANY placeholder lastName makes the profile incomplete
  const hasPlaceholderFirstName = placeholderFirstNames.includes(firstName);
  const hasPlaceholderLastName = placeholderLastNames.includes(lastName);

  // Check for masked email from Apple's private relay
  const isMaskedEmail =
    typeof userData?.email === "string" && userData.email.endsWith("@privaterelay.appleid.com");

  const isIncomplete =
    (hasPlaceholderLastName && firstName !== "New") ||
    (firstName === "New" && lastName === "User") ||
    hasPlaceholderFirstName ||
    isMaskedEmail;

  return isIncomplete;
};

export const fetchProfile = async () => {
  try {
    const profile = await $fetch<any>(`${API_BASE}/profile/me`);

    return profile;
  } catch (error: any) {
    console.error("Error fetching user profile:", error);
    throw new Error(error?.message || "Failed to load profile");
  }
};

export const maskEmail = (email: string) => {
  const [user, domain] = email.split("@");
  const maskedUser = user[0] + "***" + user.slice(-1);
  return `${maskedUser}@${domain}`;
};

/**
 * Set the flag indicating user has registered a passkey
 * This should be called when:
 * - User successfully registers a passkey
 * - App detects user has existing passkeys (during login or settings load)
 */
export const setPasskeyRegistered = async (): Promise<void> => {
  try {
    await SecureStore.setItemAsync(PASSKEY_REGISTERED_KEY, "true");
    // console.info("Passkey registration flag set");
  } catch (error) {
    console.warn("Failed to set passkey registration flag:", error);
  }
};

/**
 * Remove the flag indicating user has registered passkeys
 * This should be called when:
 * - User removes all their passkeys
 * - Authentication attempt fails with "no credentials" error
 * - App detects user has no passkeys available
 */
export const removePasskeyRegistered = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(PASSKEY_REGISTERED_KEY);
    // console.info("Passkey registration flag removed");
  } catch (error) {
    console.warn("Failed to remove passkey registration flag:", error);
  }
};

/**
 * Check if user has previously registered a passkey
 * This is used to determine whether to show the passkey login button
 *
 * @returns true if user has registered a passkey before, false otherwise
 */
export const hasPasskeyRegistered = async (): Promise<boolean> => {
  try {
    const value = await SecureStore.getItemAsync(PASSKEY_REGISTERED_KEY);
    return value === "true";
  } catch (error) {
    console.warn("Failed to check passkey registration flag:", error);
    return false;
  }
};

/**
 * Clear all passkey-related data from SecureStore
 * Useful for testing or user account deletion scenarios
 */
export const clearPasskeyData = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(PASSKEY_REGISTERED_KEY);
    // console.info("All passkey data cleared");
  } catch (error) {
    console.warn("Failed to clear passkey data:", error);
  }
};

/**
 * Validate and sync passkey registration status with actual passkey list
 * This can be called periodically or when loading settings to ensure
 * the SecureStore flag accurately reflects the user's passkey status
 *
 * @param passkeyCount Number of active passkeys the user currently has
 */
export const syncPasskeyRegistrationStatus = async (passkeyCount: number): Promise<void> => {
  const hasFlag = await hasPasskeyRegistered();
  const shouldHaveFlag = passkeyCount > 0;

  if (hasFlag !== shouldHaveFlag) {
    if (shouldHaveFlag) {
      await setPasskeyRegistered();
      // console.info("Synced: Set passkey registration flag (user has passkeys)");
    } else {
      await removePasskeyRegistered();
      // console.info("Synced: Removed passkey registration flag (user has no passkeys)");
    }
  }
};

/**
 * Get debug information about passkey registration status
 * Useful for debugging and development
 */
export const getPasskeyDebugInfo = async (): Promise<{
  hasRegistrationFlag: boolean;
  flagValue: string | null;
  timestamp: number;
}> => {
  try {
    const flagValue = await SecureStore.getItemAsync(PASSKEY_REGISTERED_KEY);
    return {
      hasRegistrationFlag: flagValue === "true",
      flagValue,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.warn("Failed to get passkey debug info:", error);
    return {
      hasRegistrationFlag: false,
      flagValue: null,
      timestamp: Date.now(),
    };
  }
};
