import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import React from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { AuthProvider, useAuth } from "../src/context/AuthContext";
import * as authApi from "../src/api/auth";

vi.mock("../src/api/auth", () => ({ getCurrentUser: vi.fn() }));
const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => <AuthProvider>{children}</AuthProvider>;

describe("AuthContext & Session Provider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authApi.getCurrentUser).mockReset().mockResolvedValue(null);
    vi.mocked(onAuthStateChanged).mockReset().mockImplementation((_auth, onChange) => {
      onChange(null);
      return vi.fn();
    });
    vi.mocked(signInWithEmailAndPassword).mockReset();
    vi.mocked(signOut).mockReset();
  });

  const authenticateFirebaseUser = (email: string) => {
    vi.mocked(onAuthStateChanged).mockImplementationOnce((_auth, onChange) => {
      onChange({ email } as never);
      return vi.fn();
    });
  };

  it("resolves to unauthenticated when Firebase has no active session", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe("unauthenticated"));
    expect(result.current.user).toBeNull();
  });

  it("loads the API user profile after Firebase restores a session", async () => {
    const mockUser = { id: "u1", email: "analyst@aagnazar.in", name: "Analyst Commander", role: "analyst" as const, created_at: new Date().toISOString() };
    authenticateFirebaseUser(mockUser.email);
    vi.mocked(authApi.getCurrentUser).mockResolvedValue(mockUser);
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe("authenticated"));
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.hasRole("analyst")).toBe(true);
  });

  it("signs in through Firebase and then syncs the backend profile", async () => {
    let listener: ((user: unknown) => void) | undefined;
    vi.mocked(onAuthStateChanged).mockImplementationOnce((_auth, onChange) => {
      listener = onChange;
      onChange(null);
      return vi.fn();
    });
    const mockUser = { id: "u2", email: "admin@aagnazar.in", name: "Admin Commander", role: "admin" as const, created_at: new Date().toISOString() };
    vi.mocked(authApi.getCurrentUser).mockResolvedValue(mockUser);
    vi.mocked(signInWithEmailAndPassword).mockImplementationOnce(async () => {
      listener?.({ email: mockUser.email });
      return {} as never;
    });
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe("unauthenticated"));
    await act(async () => result.current.login(mockUser.email, "DemoPass123!"));
    await waitFor(() => expect(result.current.status).toBe("authenticated"));
    expect(result.current.user).toEqual(mockUser);
  });

  it("maps Firebase credential errors to a user-safe message", async () => {
    vi.mocked(signInWithEmailAndPassword).mockRejectedValueOnce({ code: "auth/invalid-credential" });
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe("unauthenticated"));
    await act(async () => {
      await expect(result.current.login("bad@aagnazar.in", "wrongpass")).rejects.toThrow("Invalid email or password.");
    });
    expect(result.current.error).toBe("Invalid email or password.");
  });

  it("signs out and clears the local user state", async () => {
    const mockUser = { id: "u3", email: "viewer@aagnazar.in", name: "Viewer User", role: "viewer" as const, created_at: new Date().toISOString() };
    authenticateFirebaseUser(mockUser.email);
    vi.mocked(authApi.getCurrentUser).mockResolvedValue(mockUser);
    vi.mocked(signOut).mockResolvedValueOnce();
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe("authenticated"));
    await act(async () => result.current.logout());
    expect(signOut).toHaveBeenCalledWith({});
    expect(result.current.status).toBe("unauthenticated");
    expect(result.current.user).toBeNull();
  });
});
