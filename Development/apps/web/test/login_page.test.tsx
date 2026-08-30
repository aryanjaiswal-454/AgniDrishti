import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { LoginPage } from "../src/pages/LoginPage";
import { AuthProvider } from "../src/context/AuthContext";
import * as authApi from "../src/api/auth";

vi.mock("../src/api/auth", () => ({
  loginUser: vi.fn(),
  logoutUser: vi.fn(),
  getCurrentUser: vi.fn().mockResolvedValue(null),
}));

describe("LoginPage Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render AgniDrishti brand identity and input elements", async () => {
    const onNavigate = vi.fn();
    render(
      <AuthProvider>
        <LoginPage onNavigate={onNavigate} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Agni")).toBeInTheDocument();
      expect(screen.getByText("Drishti")).toBeInTheDocument();
      expect(screen.getByText(/AI-Powered Thermal Intelligence/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/COMMAND IDENTIFIER/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/ACCESS KEY/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /ENTER COMMAND CENTER/i })).toBeInTheDocument();
    });
  });

  it("should toggle show/hide password visibility", async () => {
    const onNavigate = vi.fn();
    render(
      <AuthProvider>
        <LoginPage onNavigate={onNavigate} />
      </AuthProvider>
    );

    const passwordInput = screen.getByLabelText(/ACCESS KEY/i);
    expect(passwordInput).toHaveAttribute("type", "password");

    const toggleButton = screen.getByRole("button", { name: /Show password/i });
    fireEvent.click(toggleButton);

    expect(passwordInput).toHaveAttribute("type", "text");
  });

  it("should populate credentials when demo quick-fill chip is clicked", async () => {
    const onNavigate = vi.fn();
    render(
      <AuthProvider>
        <LoginPage onNavigate={onNavigate} />
      </AuthProvider>
    );

    const adminChip = screen.getByRole("button", { name: /Admin/i });
    fireEvent.click(adminChip);

    expect(screen.getByLabelText(/COMMAND IDENTIFIER/i)).toHaveValue("admin@aagnazar.in");
    expect(screen.getByLabelText(/ACCESS KEY/i)).toHaveValue("AdminPassword123!");
  });

  it("should submit login credentials and redirect to /command-center on success", async () => {
    const mockUser = {
      id: "u1",
      email: "analyst@aagnazar.in",
      name: "Analyst Commander",
      role: "analyst" as const,
      created_at: new Date().toISOString(),
    };
    vi.mocked(authApi.loginUser).mockResolvedValueOnce(mockUser);

    const onNavigate = vi.fn();
    render(
      <AuthProvider>
        <LoginPage onNavigate={onNavigate} />
      </AuthProvider>
    );

    const submitBtn = screen.getByRole("button", { name: /ENTER COMMAND CENTER/i });
    await waitFor(() => expect(submitBtn).not.toBeDisabled());

    fireEvent.change(screen.getByLabelText(/COMMAND IDENTIFIER/i), {
      target: { value: "analyst@aagnazar.in" },
    });
    fireEvent.change(screen.getByLabelText(/ACCESS KEY/i), {
      target: { value: "AnalystPassword123!" },
    });

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(authApi.loginUser).toHaveBeenCalledWith({
        email: "analyst@aagnazar.in",
        password: "AnalystPassword123!",
      });
      expect(onNavigate).toHaveBeenCalledWith("/command-center");
    });
  });

  it("should display error banner when invalid credentials are provided", async () => {
    vi.mocked(authApi.loginUser).mockRejectedValueOnce(new Error("Invalid email or password."));

    const onNavigate = vi.fn();
    render(
      <AuthProvider>
        <LoginPage onNavigate={onNavigate} />
      </AuthProvider>
    );

    const submitBtn = screen.getByRole("button", { name: /ENTER COMMAND CENTER/i });
    await waitFor(() => expect(submitBtn).not.toBeDisabled());

    fireEvent.change(screen.getByLabelText(/COMMAND IDENTIFIER/i), {
      target: { value: "wrong@aagnazar.in" },
    });
    fireEvent.change(screen.getByLabelText(/ACCESS KEY/i), {
      target: { value: "wrongpass" },
    });

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Invalid email or password.");
      expect(onNavigate).not.toHaveBeenCalled();
    });
  });
});
