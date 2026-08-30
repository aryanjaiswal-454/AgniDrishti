import { User, LoginInput } from "@agnidrishti/shared-types";
import { apiClient } from "./client";
import { ApiResponse } from "./types";

export type UserProfile = Omit<User, "password_hash">;

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthSuccessData {
  user: UserProfile;
  token?: string;
}

/**
 * Perform login request to backend API.
 * Uses httpOnly cookies via credentials: 'include'.
 */
export async function loginUser(input: LoginCredentials): Promise<UserProfile> {
  const response = await apiClient<ApiResponse<AuthSuccessData>>("/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });

  if (!response.data?.user) {
    throw new Error("Authentication response did not contain user profile.");
  }

  return response.data.user;
}

/**
 * Fetch the authenticated user profile using active httpOnly cookie session.
 */
export async function getCurrentUser(): Promise<UserProfile | null> {
  try {
    const response = await apiClient<ApiResponse<AuthSuccessData>>("/auth/me", {
      method: "GET",
    });

    if (response.success && response.data?.user) {
      return response.data.user;
    }
    return null;
  } catch (_err) {
    // Gracefully handle unauthenticated status on initial app load
    return null;
  }
}

/**
 * Terminate the user session and clear httpOnly cookies.
 */
export async function logoutUser(): Promise<void> {
  try {
    await apiClient("/auth/logout", {
      method: "POST",
    });
  } catch (_err) {
    // Ignore network errors during logout
  }
}

