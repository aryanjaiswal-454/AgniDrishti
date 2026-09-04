import { User } from "@agnidrishti/shared-types";
import { apiClient } from "./client";
import { ApiResponse } from "./types";

export type UserProfile = Omit<User, "password_hash">;

export interface AuthSuccessData {
  user: UserProfile;
  token?: string; // Kept for backwards compatibility if needed
}

export async function getCurrentUser(idToken?: string): Promise<UserProfile | null> {
  const response = await apiClient<ApiResponse<AuthSuccessData>>("/auth/me", {
    // The Firebase auth observer can run immediately after a popup succeeds.
    // Supplying the token it has already resolved avoids a request being sent
    // before the API client observes auth.currentUser.
    headers: idToken ? { Authorization: `Bearer ${idToken}` } : undefined,
  });
  return response.success && response.data?.user ? response.data.user : null;
}
