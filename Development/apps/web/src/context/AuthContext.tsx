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
  onAuthStateChanged,
  confirmPasswordReset,
  updateProfile
} from "firebase/auth";

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

  useEffect(() => {
    let isMounted = true;

    // Listen to Firebase Auth state changes
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        if (firebaseUser) {
          try {
            console.log('Firebase user authenticated:', firebaseUser.email);
            const currentUser = await getCurrentUser();
            if (isMounted) {
              if (currentUser) {
                console.log('Backend user profile fetched:', currentUser.email, currentUser);
                setUser(currentUser);
                setStatus("authenticated");
                console.log('[AuthContext] Status set to authenticated');
              } else {
                console.warn('No backend user profile found');
                setUser(null);
                setStatus("unauthenticated");
              }
            }
          } catch (err: any) {
            console.error('Error fetching backend user:', err);
            console.error('Error details:', { message: err.message, status: err.status, code: err.code });
            if (isMounted) {
              setUser(null);
              setStatus("unauthenticated");

              // If backend returns 401/403, it means the user is deleted or unauthorized
              // Force logout from Firebase to clear the invalid session
              if (err.status === 401 || err.status === 403) {
                console.log('Backend auth error - logging out from Firebase');
                try {
                  await firebaseSignOut(auth);
                } catch (logoutErr) {
                  console.error('Error during forced logout:', logoutErr);
                }
              }
            }
          }
        } else {
          console.log('No Firebase user authenticated');
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
  }, []);

  const login = async (email: string, pass: string) => {
    setError(null);
    try {
      console.log('Starting email/password login...');
      await signInWithEmailAndPassword(auth, email, pass);
      console.log('Login successful');
      // State updates automatically via onAuthStateChanged
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
      throw new Error(msg);
    }
  };

  const signup = async (name: string, email: string, pass: string) => {
    setError(null);
    try {
      console.log('Starting signup...');
      const res = await createUserWithEmailAndPassword(auth, email, pass);
      if (res.user) {
        await updateProfile(res.user, { displayName: name });
      }
      console.log('Signup successful');
      // State updates automatically via onAuthStateChanged and will sync to backend now
      // and backend will read decoded.name
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
      throw new Error(msg);
    }
  };

  const googleLogin = async () => {
    setError(null);
    try {
      console.log('Starting Google sign-in...');
      const result = await signInWithPopup(auth, googleProvider);
      console.log('Google sign-in successful:', result.user.email);
      // State updates automatically via onAuthStateChanged
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
