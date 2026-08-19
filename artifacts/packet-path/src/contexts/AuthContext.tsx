import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useGetMe, useLogout, setAuthTokenGetter } from "@workspace/api-client-react";
import type { User } from "@workspace/api-client-react";

// A few older UI surfaces still read `fullName`. Keep that field optional at
// the AuthContext boundary while the canonical generated API field remains `name`.
type AuthenticatedUser = User & { fullName?: string };

interface AuthContextType {
  user: AuthenticatedUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const AUTH_RESTORE_TIMEOUT_MS = 12_000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("packetpath_token"));
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const logoutMutation = useLogout();

  const { data: meData, isLoading, isError } = useGetMe({
    query: {
      enabled: !!token,
      retry: false,
      queryKey: ["auth", "me", token],
    },
  });

  const clearLocalSession = () => {
    localStorage.removeItem("packetpath_token");
    setToken(null);
    setUser(null);
    setAuthTokenGetter(null);
  };

  useEffect(() => {
    if (meData && token) {
      setUser(meData);
    }
  }, [meData, token]);

  // A stale/invalid session should never leave the application believing the
  // user is authenticated. Clear it immediately when the restore request fails.
  useEffect(() => {
    if (token && isError) {
      clearLocalSession();
    }
  }, [token, isError]);

  // Render or a remote database can occasionally leave a browser request
  // pending much longer than is useful. Do not trap the whole application on
  // "Loading PacketPath..." forever: abandon the saved session and return the
  // user to the login screen if session restoration does not finish promptly.
  useEffect(() => {
    if (!token || user) return;

    const timeoutId = window.setTimeout(() => {
      clearLocalSession();
    }, AUTH_RESTORE_TIMEOUT_MS);

    return () => window.clearTimeout(timeoutId);
  }, [token, user]);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem("packetpath_token", newToken);
    setToken(newToken);
    setUser(newUser);
    setAuthTokenGetter(() => newToken);
  };

  const handleLogout = () => {
    logoutMutation.mutate(undefined as unknown as void);
    clearLocalSession();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading: !!token && isLoading && !user && !isError,
        login,
        logout: handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
