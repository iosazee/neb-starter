import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function mapAppleProfileToUser(profile: any) {
  console.log("Apple Sign In Profile:", JSON.stringify(profile, null, 2));

  // If we get first and last name directly from Apple's user object
  const firstName = profile.user?.name?.firstName;
  const lastName = profile.user?.name?.lastName;

  if (firstName && lastName) {
    return {
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`,
      image: profile.picture,
      emailVerified: profile.email_verified || true,
    };
  }

  // If we get a full name string
  if (profile.name) {
    const [first, ...rest] = profile.name.trim().split(/\s+/);
    const last = rest.join(" ");
    return {
      firstName: first || "Apple",
      lastName: last || "User",
      fullName: profile.name,
      image: profile.picture,
      emailVerified: profile.email_verified || true,
    };
  }

  // If we get an email but no name (common with Apple Sign In)
  if (profile.email) {
    // Create a username from the email (without domain)
    const username = profile.email.split("@")[0];
    // Capitalize the first letter for better presentation
    const formattedUsername = username.charAt(0).toUpperCase() + username.slice(1);

    return {
      firstName: formattedUsername,
      lastName: "User", // Default last name
      fullName: `${formattedUsername} User`,
      image: profile.picture,
      emailVerified: profile.email_verified || true,
    };
  }

  // Fallback for any other case
  return {
    firstName: "Apple",
    lastName: "User",
    fullName: "Apple User",
    image: profile.picture,
    emailVerified: profile.email_verified || true,
  };
}

// Constants
export const PASSKEY_REGISTERED_KEY = "neb_starter_passkey_registered";

/**
 * Set the flag indicating user has registered a passkey
 * This should be called when:
 * - User successfully registers a passkey
 * - App detects user has existing passkeys (during login or settings load)
 */
export const setPasskeyRegistered = (): void => {
  try {
    localStorage.setItem(PASSKEY_REGISTERED_KEY, "true");
    console.debug("Passkey registration flag set");
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
export const removePasskeyRegistered = (): void => {
  try {
    localStorage.removeItem(PASSKEY_REGISTERED_KEY);
    console.debug("Passkey registration flag removed");
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
export const hasPasskeyRegistered = (): boolean => {
  try {
    return localStorage.getItem(PASSKEY_REGISTERED_KEY) === "true";
  } catch (error) {
    console.warn("Failed to check passkey registration flag:", error);
    return false;
  }
};

/**
 * Clear all passkey-related data from localStorage
 * Useful for testing or user account deletion scenarios
 */
export const clearPasskeyData = (): void => {
  try {
    localStorage.removeItem(PASSKEY_REGISTERED_KEY);
    console.debug("All passkey data cleared");
  } catch (error) {
    console.warn("Failed to clear passkey data:", error);
  }
};

/**
 * Validate and sync passkey registration status with actual passkey list
 * This can be called periodically or when loading settings to ensure
 * the localStorage flag accurately reflects the user's passkey status
 *
 * @param passkeyCount Number of active passkeys the user currently has
 */
export const syncPasskeyRegistrationStatus = (passkeyCount: number): void => {
  const hasFlag = hasPasskeyRegistered();
  const shouldHaveFlag = passkeyCount > 0;

  if (hasFlag !== shouldHaveFlag) {
    if (shouldHaveFlag) {
      setPasskeyRegistered();
      console.info("Synced: Set passkey registration flag (user has passkeys)");
    } else {
      removePasskeyRegistered();
      console.info("Synced: Removed passkey registration flag (user has no passkeys)");
    }
  }
};

/**
 * Get debug information about passkey registration status
 * Useful for debugging and development
 */
export const getPasskeyDebugInfo = (): {
  hasRegistrationFlag: boolean;
  flagValue: string | null;
  timestamp: number;
} => {
  return {
    hasRegistrationFlag: hasPasskeyRegistered(),
    flagValue: localStorage.getItem(PASSKEY_REGISTERED_KEY),
    timestamp: Date.now(),
  };
};

/**
 * Browser storage event listener for passkey registration changes
 * Useful for components that need to react to changes from other tabs
 */
export const addPasskeyRegistrationListener = (
  callback: (hasRegistered: boolean) => void
): (() => void) => {
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === PASSKEY_REGISTERED_KEY) {
      callback(hasPasskeyRegistered());
    }
  };

  window.addEventListener("storage", handleStorageChange);

  // Return cleanup function
  return () => window.removeEventListener("storage", handleStorageChange);
};
