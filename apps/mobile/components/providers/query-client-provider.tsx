import { QueryClientProvider as TanstackQueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "~/lib/query-client";
import { useOnlineManager } from "~/hooks/use-online-manager";
import { useAppState } from "~/hooks/use-app-state";

interface QueryClientProviderProps {
  children: React.ReactNode;
}

export function QueryClientProvider({ children }: QueryClientProviderProps) {
  useOnlineManager();
  useAppState();

  return <TanstackQueryClientProvider client={queryClient}>{children}</TanstackQueryClientProvider>;
}
