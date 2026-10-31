import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { AuthUser } from "@shared/schema";

const AUTH_QUERY_KEY = ["/api/auth/me"] as const;

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => void;
  signIn: (username: string, password: string) => Promise<AuthUser>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function readError(response: Response): Promise<string> {
  const body = await response.json() as { message?: string };
  return body.message || "Authentication request failed";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const authQuery = useQuery<AuthUser | null>({
    queryKey: AUTH_QUERY_KEY,
    queryFn: async () => {
      const response = await fetch(AUTH_QUERY_KEY[0], { credentials: "include" });
      if (response.status === 401) return null;
      if (!response.ok) throw new Error(await readError(response));
      const result = await response.json() as { user: AuthUser };
      return result.user;
    },
    retry: false,
    staleTime: 0,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });

  const value = useMemo<AuthContextValue>(() => ({
    user: authQuery.data ?? null,
    isLoading: authQuery.isPending,
    error: authQuery.error,
    refresh: () => { void authQuery.refetch(); },
    signIn: async (username, password) => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });
      if (!response.ok) throw new Error(await readError(response));
      const result = await response.json() as { user: AuthUser };
      queryClient.setQueryData(AUTH_QUERY_KEY, result.user);
      return result.user;
    },
    signOut: async () => {
      await queryClient.cancelQueries();
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) throw new Error(await readError(response));
      await queryClient.cancelQueries();
      queryClient.removeQueries({
        predicate: (query) => query.queryKey[0] !== AUTH_QUERY_KEY[0],
      });
      queryClient.setQueryData(AUTH_QUERY_KEY, null);
    },
  }), [authQuery.data, authQuery.error, authQuery.isPending, authQuery.refetch, queryClient]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
