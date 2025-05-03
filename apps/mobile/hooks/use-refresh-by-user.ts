import { useState } from "react";

export function useRefreshByUser(refetch: () => Promise<unknown>) {
  const [isRefetching, setIsRefetching] = useState(false);

  async function refetchByUser() {
    setIsRefetching(true);

    try {
      await refetch();
    } finally {
      setIsRefetching(false);
    }
  }

  return {
    isRefetching,
    refetchByUser,
  };
}
