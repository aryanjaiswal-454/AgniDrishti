import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { LoginPage } from "../src/pages/LoginPage";
import { AuthProvider } from "../src/context/AuthContext";
import * as authApi from "../src/api/auth";

vi.mock("../src/api/auth", () => ({ getCurrentUser: vi.fn().mockResolvedValue(null) }));

describe("LoginPage Component", () => {
  beforeEach(() => vi.clearAllMocks());

  const renderPage = () => {
    const onNavigate = vi.fn();
    render(<AuthProvider><LoginPage onNavigate={onNavigate} /></AuthProvider>);
    return onNavigate;
  };

  it("renders the Firebase email/password sign-in form", async () => {
    renderPage();
    await waitFor(() => expect(screen.getByRole("button", { name: "Login" })).not.toBeDisabled());
    expect(screen.getByText("Agni")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "password");
    expect(screen.getByRole("button", { name: "Sign in with Google" })).toBeInTheDocument();
  });

  it("toggles password visibility accessibly", () => {
    renderPage();
    const passwordInput = screen.getByLabelText("Password");
    fireEvent.click(screen.getByRole("button", { name: "Show password" }));
    expect(passwordInput).toHaveAttribute("type", "text");
    expect(screen.getByRole("button", { name: "Hide password" })).toBeInTheDocument();
  });

  it("submits credentials to Firebase and lets app-level auth routing handle navigation", async () => {
    vi.mocked(signInWithEmailAndPassword).mockResolvedValueOnce({} as never);
    const onNavigate = renderPage();
    await waitFor(() => expect(screen.getByRole("button", { name: "Login" })).not.toBeDisabled());
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "analyst@aagnazar.in" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "AnalystPassword123!" } });
    fireEvent.click(screen.getByRole("button", { name: "Login" }));
    await waitFor(() => expect(signInWithEmailAndPassword).toHaveBeenCalledWith({}, "analyst@aagnazar.in", "AnalystPassword123!"));
    expect(onNavigate).not.toHaveBeenCalled();
    expect(authApi.getCurrentUser).not.toHaveBeenCalled();
  });

  it("shows Firebase credential errors", async () => {
    vi.mocked(signInWithEmailAndPassword).mockRejectedValueOnce({ code: "auth/invalid-credential" });
    renderPage();
    await waitFor(() => expect(screen.getByRole("button", { name: "Login" })).not.toBeDisabled());
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "wrong@aagnazar.in" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "wrongpass" } });
    fireEvent.click(screen.getByRole("button", { name: "Login" }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Invalid email or password."));
  });
});
