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
