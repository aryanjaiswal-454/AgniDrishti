import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { ProtectedRoute, AuthLoadingScreen } from "../src/components/auth/ProtectedRoute";
import { AuthProvider } from "../src/context/AuthContext";
import * as authApi from "../src/api/auth";

vi.mock("../src/api/auth", () => ({
  loginUser: vi.fn(),
  logoutUser: vi.fn(),
  getCurrentUser: vi.fn(),
}));

describe("ProtectedRoute & Auth Guard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should display tactical AuthLoadingScreen while checking initial session", () => {
    render(<AuthLoadingScreen />);
    expect(screen.getByText(/Authenticating Secure Command Session/i)).toBeInTheDocument();
  });

  it("should redirect unauthenticated users to /login", async () => {
    vi.mocked(authApi.getCurrentUser).mockResolvedValueOnce(null);
    const onNavigate = vi.fn();

    render(
      <AuthProvider>
        <ProtectedRoute onNavigate={onNavigate}>
          <div data-testid="protected-content">Secret Content</div>
        </ProtectedRoute>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(onNavigate).toHaveBeenCalledWith("/login");
      expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
    });
  });

  it("should render protected content when authenticated with adequate role", async () => {
    const mockUser = {
      id: "u1",
      email: "analyst@aagnazar.in",
      name: "Analyst User",
      role: "analyst" as const,
      created_at: new Date().toISOString(),
    };
    vi.mocked(authApi.getCurrentUser).mockResolvedValueOnce(mockUser);
    const onNavigate = vi.fn();

    render(
      <AuthProvider>
        <ProtectedRoute onNavigate={onNavigate}>
          <div data-testid="protected-content">Authorized Command Center</div>
        </ProtectedRoute>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("protected-content")).toBeInTheDocument();
      expect(onNavigate).not.toHaveBeenCalled();
    });
  });

  it("should display restricted access message if user role does not match requiredRoles", async () => {
    const mockUser = {
      id: "u1",
      email: "viewer@aagnazar.in",
      name: "Viewer User",
      role: "viewer" as const,
      created_at: new Date().toISOString(),
    };
    vi.mocked(authApi.getCurrentUser).mockResolvedValueOnce(mockUser);
    const onNavigate = vi.fn();

    render(
      <AuthProvider>
        <ProtectedRoute requiredRoles={["admin"]} onNavigate={onNavigate}>
          <div data-testid="admin-settings">Admin Settings</div>
        </ProtectedRoute>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Access Restricted/i)).toBeInTheDocument();
      expect(screen.queryByTestId("admin-settings")).not.toBeInTheDocument();
    });
  });
});
