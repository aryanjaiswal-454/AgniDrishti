import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { UserRole } from "@agnidrishti/shared-types";
import { UserProfile, loginUser, logoutUser, getCurrentUser } from "../api/auth";

export interface AuthContextValue {
  user: UserProfile | null;
  status: "loading" | "authenticated" | "unauthenticated";
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [status, setStatus] = useState<"loading" | "authenticated" | "unauthenticated">("loading");
  const [error, setError] = useState<string | null>(null);

  // Check initial session on application mount via GET /api/v1/auth/me
  useEffect(() => {
    let isMounted = true;

    async function checkSession() {
      try {
        const currentUser = await getCurrentUser();
        if (isMounted) {
          if (currentUser) {
            setUser(currentUser);
            setStatus("authenticated");
          } else {
            setUser(null);
            setStatus("unauthenticated");
          }
        }
      } catch (_err) {
        if (isMounted) {
          setUser(null);
          setStatus("unauthenticated");
        }
      }
    }

    checkSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setStatus("loading");
    setError(null);
    try {
      const loggedInUser = await loginUser({ email, password });
      setUser(loggedInUser);
      setStatus("authenticated");
      setError(null);
    } catch (err: any) {
      setUser(null);
      setStatus("unauthenticated");
      setError(err.message || "Failed to sign in. Please verify your credentials.");
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } finally {
      setUser(null);
      setStatus("unauthenticated");
      setError(null);
    }
  }, []);

  const hasRole = useCallback(
    (roles: UserRole | UserRole[]): boolean => {
      if (!user) return false;
      const roleList = Array.isArray(roles) ? roles : [roles];
      return roleList.includes(user.role);
    },
    [user]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        status,
        error,
        login,
        logout,
        hasRole,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

