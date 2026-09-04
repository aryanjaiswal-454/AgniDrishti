import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { UserRole } from "@agnidrishti/shared-types";
import {
  UserProfile,
  getCurrentUser,
} from "../api/auth";
import { auth, googleProvider } from "../lib/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  onIdTokenChanged,
  confirmPasswordReset,
  updateProfile,
  type User as FirebaseUser,
} from "firebase/auth";

const PROFILE_SYNC_ATTEMPTS = 3;
const PROFILE_SYNC_RETRY_MS = 350;

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

export interface AuthContextValue {
  user: UserProfile | null;
  status: "loading" | "authenticated" | "unauthenticated";
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  googleLogin: () => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (email: string, otp: string, newPassword: string) => Promise<void>;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [status, setStatus] = useState<"loading" | "authenticated" | "unauthenticated">("loading");
  const [error, setError] = useState<string | null>(null);

  /**
   * Resolve the Firebase token first, then use that exact token to establish
   * the backend profile. This prevents the Google-popup race where navigation
   * could occur before auth.currentUser was available to the API client.
   */
  const synchronizeProfile = useCallback(async (firebaseUser: FirebaseUser) => {
    setStatus("loading");

    let lastError: unknown;
    for (let attempt = 0; attempt < PROFILE_SYNC_ATTEMPTS; attempt += 1) {
      try {
        const idToken = await firebaseUser.getIdToken();
        const currentUser = await getCurrentUser(idToken);
        if (currentUser) {
          setUser(currentUser);
          setStatus("authenticated");
          return currentUser;
        }
        lastError = new Error("Your authenticated user profile was not returned by the API.");
      } catch (err) {
        lastError = err;
      }

      if (attempt < PROFILE_SYNC_ATTEMPTS - 1) {
        await wait(PROFILE_SYNC_RETRY_MS * (attempt + 1));
      }
    }

    setUser(null);
    setStatus("unauthenticated");
    throw lastError instanceof Error
      ? lastError
      : new Error("Unable to establish the authenticated session.");
  }, []);

  useEffect(() => {
    let isMounted = true;

    // onIdTokenChanged fires only once Firebase has a usable ID token, unlike
    // the old observer path which could race the first API request after a
    // Google popup completed.
    const unsubscribe = onIdTokenChanged(
      auth,
      async (firebaseUser) => {
        if (firebaseUser) {
          try {
            await synchronizeProfile(firebaseUser);
          } catch (err: any) {
            console.error("Unable to synchronize the authenticated user profile:", err);
            if (isMounted) {
              setUser(null);
              setStatus("unauthenticated");
            }
          }
        } else {
          if (isMounted) {
            setUser(null);
            setStatus("unauthenticated");
          }
        }
      },
      (err) => {
        console.error("Firebase Auth State Error:", err);
        if (isMounted) {
          setUser(null);
          setStatus("unauthenticated");
        }
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [synchronizeProfile]);

  const login = async (email: string, pass: string) => {
    setError(null);
    setStatus("loading");
    try {
      const credential = await signInWithEmailAndPassword(auth, email, pass);
      await credential.user.getIdToken(true);
      await synchronizeProfile(credential.user);
    } catch (err: any) {
      console.error('Login error:', err);
      let msg = "Failed to log in";

      // Provide more specific error messages
      if (err.code === 'auth/invalid-email') {
        msg = "Invalid email address format.";
      } else if (err.code === 'auth/user-disabled') {
        msg = "This account has been disabled.";
      } else if (err.code === 'auth/user-not-found') {
        msg = "No account found with this email.";
      } else if (err.code === 'auth/wrong-password') {
        msg = "Incorrect password.";
      } else if (err.code === 'auth/invalid-credential') {
        msg = "Invalid email or password.";
      } else if (err.code === 'auth/too-many-requests') {
        msg = "Too many failed attempts. Please try again later.";
      } else if (err.message) {
        msg = err.message;
      }

      setError(msg);
      setStatus("unauthenticated");
      throw new Error(msg);
    }
  };

  const signup = async (name: string, email: string, pass: string) => {
    setError(null);
    setStatus("loading");
    try {
      const res = await createUserWithEmailAndPassword(auth, email, pass);
      if (res.user) {
        await updateProfile(res.user, { displayName: name });
        await res.user.getIdToken(true);
        await synchronizeProfile(res.user);
      }
    } catch (err: any) {
      console.error('Signup error:', err);
      let msg = "Failed to sign up";

      // Provide more specific error messages
      if (err.code === 'auth/email-already-in-use') {
        msg = "An account with this email already exists.";
      } else if (err.code === 'auth/invalid-email') {
        msg = "Invalid email address format.";
      } else if (err.code === 'auth/operation-not-allowed') {
        msg = "Email/password accounts are not enabled.";
      } else if (err.code === 'auth/weak-password') {
        msg = "Password is too weak. Use at least 6 characters.";
      } else if (err.message) {
        msg = err.message;
      }

      setError(msg);
      setStatus("unauthenticated");
      throw new Error(msg);
    }
  };

  const googleLogin = async () => {
    setError(null);
    setStatus("loading");
    try {
      const result = await signInWithPopup(auth, googleProvider);
      // Force a fresh token once after the popup, then wait until /auth/me has
      // confirmed the profile. Callers now resolve only when navigation is safe.
      await result.user.getIdToken(true);
      await synchronizeProfile(result.user);
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      let msg = "Google Authentication failed";

      // Provide more specific error messages
      if (err.code === 'auth/popup-closed-by-user') {
        msg = "Sign-in cancelled. Please try again.";
      } else if (err.code === 'auth/popup-blocked') {
        msg = "Pop-up blocked by browser. Please allow pop-ups for this site.";
      } else if (err.code === 'auth/cancelled-popup-request') {
        msg = "Another sign-in is already in progress.";
      } else if (err.code === 'auth/unauthorized-domain') {
        msg = "This domain is not authorized for Google sign-in. Please contact support.";
      } else if (err.message) {
        msg = err.message;
      }

      setError(msg);
      setStatus("unauthenticated");
      throw new Error(msg);
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (err: any) {
      console.error("Logout error", err);
    } finally {
      setUser(null);
      setStatus("unauthenticated");
    }
  };

  const handleForgotPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err: any) {
      throw new Error(err.message || "Error sending password reset email");
    }
  }

  const handleResetPassword = async (_email: string, otp: string, newPassword: string) => {
    // In Firebase context, 'otp' is actually the action code link
    try {
      await confirmPasswordReset(auth, otp, newPassword);
    } catch (err: any) {
      throw new Error(err.message || "Error resetting password");
    }
  }

  const hasRole = useCallback(
    (roles: UserRole | UserRole[]) => {
      if (!user) return false;
      const roleRoles = Array.isArray(roles) ? roles : [roles];
      return roleRoles.includes(user.role);
    },
    [user]
  );

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        status,
        error,
        login,
        signup,
        googleLogin,
        logout,
        hasRole,
        clearError,
        forgotPassword: handleForgotPassword,
        resetPassword: handleResetPassword
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
