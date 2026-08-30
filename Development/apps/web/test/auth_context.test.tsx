import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import React from "react";
import { AuthProvider, useAuth } from "../src/context/AuthContext";
import * as authApi from "../src/api/auth";

vi.mock("../src/api/auth", () => ({
  loginUser: vi.fn(),
  logoutUser: vi.fn(),
  getCurrentUser: vi.fn(),
}));

const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe("AuthContext & Session Provider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with loading status and resolve to unauthenticated if no session exists", async () => {
    vi.mocked(authApi.getCurrentUser).mockResolvedValueOnce(null);

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.status).toBe("loading");

    await waitFor(() => {
      expect(result.current.status).toBe("unauthenticated");
      expect(result.current.user).toBeNull();
    });
  });

  it("should restore authenticated user session if valid cookie session is returned by me endpoint", async () => {
    const mockUser = {
      id: "u1",
      email: "analyst@aagnazar.in",
      name: "Analyst Commander",
      role: "analyst" as const,
      created_at: new Date().toISOString(),
    };
    vi.mocked(authApi.getCurrentUser).mockResolvedValueOnce(mockUser);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.status).toBe("authenticated");
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.hasRole("analyst")).toBe(true);
      expect(result.current.hasRole("admin")).toBe(false);
    });
  });

  it("should successfully log in and transition to authenticated status", async () => {
    vi.mocked(authApi.getCurrentUser).mockResolvedValueOnce(null);
    const mockUser = {
      id: "u2",
      email: "admin@aagnazar.in",
      name: "Admin Commander",
      role: "admin" as const,
      created_at: new Date().toISOString(),
    };
    vi.mocked(authApi.loginUser).mockResolvedValueOnce(mockUser);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.status).toBe("unauthenticated"));

    await act(async () => {
      await result.current.login("admin@aagnazar.in", "DemoPass123!");
    });

    expect(result.current.status).toBe("authenticated");
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.hasRole(["admin", "analyst"])).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it("should handle failed login and set user-friendly error message", async () => {
    vi.mocked(authApi.getCurrentUser).mockResolvedValueOnce(null);
    vi.mocked(authApi.loginUser).mockRejectedValueOnce(new Error("Invalid email or password."));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.status).toBe("unauthenticated"));

    let threwError = false;
    await act(async () => {
      try {
        await result.current.login("bad@aagnazar.in", "wrongpass");
      } catch {
        threwError = true;
      }
    });

    expect(threwError).toBe(true);
    expect(result.current.status).toBe("unauthenticated");
    expect(result.current.user).toBeNull();
    expect(result.current.error).toBe("Invalid email or password.");
  });

  it("should log out and reset user session state to unauthenticated", async () => {
    const mockUser = {
      id: "u3",
      email: "viewer@aagnazar.in",
      name: "Viewer User",
      role: "viewer" as const,
      created_at: new Date().toISOString(),
    };
    vi.mocked(authApi.getCurrentUser).mockResolvedValueOnce(mockUser);
    vi.mocked(authApi.logoutUser).mockResolvedValueOnce();

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.status).toBe("authenticated"));

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.status).toBe("unauthenticated");
    expect(result.current.user).toBeNull();
  });
});
