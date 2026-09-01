import { User } from "@agnidrishti/shared-types";
import { apiClient } from "./client";
import { ApiResponse } from "./types";

export type UserProfile = Omit<User, "password_hash">;

export interface AuthSuccessData {
  user: UserProfile;
  token?: string; // Kept for backwards compatibility if needed
}

export async function getCurrentUser(): Promise<UserProfile | null> {
  try {
    const response = await apiClient<ApiResponse<AuthSuccessData>>("/auth/me");
    if (response.success && response.data?.user) return response.data.user;
    return null;
  } catch (_err) {
    return null;
  }
}
