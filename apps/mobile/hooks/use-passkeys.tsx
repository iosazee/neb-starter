import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { listPasskeys, getStorageKeys } from "~/lib/auth-client";
import * as SecureStore from "expo-secure-store";
import { useRefreshByUser } from "~/hooks/use-refresh-by-user";
import { useRefreshOnFocus } from "~/hooks/use-refresh-on-focus";
import {
  hasPasskeyRegistered,
  setPasskeyRegistered,
  removePasskeyRegistered,
  syncPasskeyRegistrationStatus,
} from "~/lib/utils";

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

interface UsePasskeysResult {
  passkeys: ServerPasskey[];
  hasRegisteredPasskey: boolean;
  currentDeviceHasCredential: boolean;
  currentCredentialId: string | null;
  isLoading: boolean;
  isRefetching: boolean;
  refetch: () => Promise<void>;
  error: Error | null;
}

// Interface for credential metadata stored in SecureStore
interface CredentialMetadata {
  userId: string;
  registeredAt?: string;
  lastUsedAt?: string;
}

export function usePasskeys(userId: string): UsePasskeysResult {
  const [currentCredentialId, setCurrentCredentialId] = useState<string | null>(null);
  const [localCredentialChecked, setLocalCredentialChecked] = useState(false);

  // Fetch current credential ID from storage
  const fetchCurrentCredentialId = useCallback(async () => {
    try {
      const STORAGE_KEYS = getStorageKeys();
      if (!STORAGE_KEYS) return null;

      // Read from secure storage
      const credentialIdsStr = await SecureStore.getItemAsync(STORAGE_KEYS.CREDENTIAL_IDS);

      if (credentialIdsStr) {
        try {
          const credentials = JSON.parse(credentialIdsStr) as Record<string, CredentialMetadata>;

          // Find credentials for this user
          const userCredentials = Object.entries(credentials)
            .filter(([_, metadata]) => metadata.userId === userId)
            // Sort by registeredAt (most recent first)
            .sort((a, b) => {
              const timeA = a[1].registeredAt ? new Date(a[1].registeredAt).getTime() : 0;
              const timeB = b[1].registeredAt ? new Date(b[1].registeredAt).getTime() : 0;
              return timeB - timeA; // Most recent first
            });

          if (userCredentials.length > 0) {
            // Take the most recently registered credential
            const [newestCredId] = userCredentials[0];

            setCurrentCredentialId(newestCredId);
            return newestCredId;
          }
        } catch (error) {
          console.error("[usePasskeys] Error parsing stored credentials:", error);
        }
      }

      return null;
    } catch (error) {
      console.error("[usePasskeys] Error fetching credential ID:", error);
      return null;
    } finally {
      setLocalCredentialChecked(true);
    }
  }, [userId]);

  // Run the fetch on mount and when userId changes
  useEffect(() => {
    fetchCurrentCredentialId();
  }, [fetchCurrentCredentialId, userId]);

  // Main query to fetch passkeys
  const {
    data: result,
    isLoading,
    error,
    refetch: refetchQuery,
  } = useQuery({
    queryKey: ["passkeys", userId],
    queryFn: async () => {
      // Call the listPasskeys function
      const result = await listPasskeys({
        userId,
      });

      if (result.error) {
        throw result.error;
      }

      // Check if local credential matches any server passkey
      if (currentCredentialId) {
        const exactMatch = passkeys.some(
          (pk: ServerPasskey) => pk.credentialId === currentCredentialId
        );

        if (!exactMatch && passkeys.length > 0) {
          // Here we could potentially update the local credential if needed
        }
      }

      return result;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Process the result
  const passkeys = (result?.data?.passkeys || []) as ServerPasskey[];
  const hasRegisteredPasskey = passkeys.length > 0;

  // Determine if current device has a credential in the server list
  const currentDeviceHasCredential = !!(
    currentCredentialId && passkeys.some((pk) => pk.credentialId === currentCredentialId)
  );

  // Support for pull-to-refresh
  const { isRefetching, refetchByUser } = useRefreshByUser(refetchQuery);

  // Auto-refresh when the screen comes into focus
  useRefreshOnFocus(refetchQuery);

  // Custom refetch function
  const refetch = async () => {
    await fetchCurrentCredentialId();
    await refetchByUser();
  };

  return {
    passkeys,
    hasRegisteredPasskey,
    currentDeviceHasCredential,
    currentCredentialId,
    isLoading: isLoading || !localCredentialChecked,
    isRefetching,
    refetch,

    error: error instanceof Error ? error : null,
  };
}

/**
 * React hook for managing passkey registration status in mobile components
 * This provides a reactive way to track passkey registration status using SecureStore
 */

export const usePasskeyRegistrationStatus = () => {
  const [hasRegistered, setHasRegistered] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load initial state
  useEffect(() => {
    const loadInitialState = async () => {
      try {
        const registered = await hasPasskeyRegistered();
        setHasRegistered(registered);
      } catch (error) {
        console.error("Failed to load passkey registration status:", error);
        setHasRegistered(false);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialState();
  }, []);

  const setRegistered = useCallback(async () => {
    try {
      await setPasskeyRegistered();
      setHasRegistered(true);
    } catch (error) {
      console.error("Failed to set passkey registered:", error);
    }
  }, []);

  const removeRegistered = useCallback(async () => {
    try {
      await removePasskeyRegistered();
      setHasRegistered(false);
    } catch (error) {
      console.error("Failed to remove passkey registered:", error);
    }
  }, []);

  const syncStatus = useCallback(async (passkeyCount: number) => {
    try {
      await syncPasskeyRegistrationStatus(passkeyCount);
      const updated = await hasPasskeyRegistered();
      setHasRegistered(updated);
    } catch (error) {
      console.error("Failed to sync passkey status:", error);
    }
  }, []);

  const refreshStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      const registered = await hasPasskeyRegistered();
      setHasRegistered(registered);
    } catch (error) {
      console.error("Failed to refresh passkey status:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    hasRegistered,
    isLoading,
    setRegistered,
    removeRegistered,
    syncStatus,
    refreshStatus,
  };
};
