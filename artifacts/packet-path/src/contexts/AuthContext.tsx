import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useGetMe, useLogout, setAuthTokenGetter } from "@workspace/api-client-react";
import type { User } from "@workspace/api-client-react";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("packetpath_token"));
  const [user, setUser] = useState<User | null>(null);
  const logoutMutation = useLogout();

  const { data: meData, isLoading } = useGetMe({
    query: {
      enabled: !!token,
      retry: false,
      queryKey: ["auth", "me", token],
    },
  });

  useEffect(() => {
    if (meData) {
      setUser(meData);
    }
  }, [meData]);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem("packetpath_token", newToken);
    setToken(newToken);
    setUser(newUser);
    setAuthTokenGetter(() => newToken);
  };

  const handleLogout = () => {
    logoutMutation.mutate(undefined as unknown as void);
    localStorage.removeItem("packetpath_token");
    setToken(null);
    setUser(null);
    setAuthTokenGetter(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading: !!token && isLoading && !user,
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
