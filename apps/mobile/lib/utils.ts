import { $fetch } from "~/lib/auth-client";

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
