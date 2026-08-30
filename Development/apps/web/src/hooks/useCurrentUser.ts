import { useAuth } from "../context/AuthContext";
import { UserProfile } from "../api/auth";

/**
 * Hook to retrieve current authenticated user session and role status from AuthContext.
 */
export function useCurrentUser(): {
  user: UserProfile | null;
  status: "loading" | "authenticated" | "unauthenticated";
  isAuthenticated: boolean;
  isLoading: boolean;
  hasRole: (roles: any) => boolean;
} {
  const { user, status, hasRole } = useAuth();

  return {
    user,
    status,
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
    hasRole,
  };
}

