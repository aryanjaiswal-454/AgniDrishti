import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { Button, Input, Card } from "../components/ui";
import { Flame, Lock, Mail, Eye, EyeOff, AlertCircle, Shield } from "lucide-react";
import { fadeInVariants, staggerContainerVariants } from "../design-system/motion";

export interface LoginPageProps {
  onNavigate: (route: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { login, googleLogin, clearError, status } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);
  const [isSubmittingGoogle, setIsSubmittingGoogle] = useState(false);

  // Clear any lingering auth context errors when this page mounts
  useEffect(() => {
    clearError();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!email || !email.trim()) return setFormError("Please enter your email.");
    if (!password) return setFormError("Please enter your password.");

    setIsSubmittingEmail(true);
    try {
      await login(email.trim(), password);
      // Navigate immediately after Firebase accepts the credential. ProtectedRoute
      // keeps the command center behind its auth loading state until the backend
      // profile has finished synchronizing.
      onNavigate("/command-center");
    } catch (err: any) {
      setFormError(err.message || "Invalid credentials.");
    } finally {
      setIsSubmittingEmail(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsSubmittingGoogle(true);
    setFormError(null);
    try {
      await googleLogin();
      // signInWithPopup resolves before the auth observer finishes fetching the
      // backend profile. Navigating here avoids leaving a successful Google
      // sign-in stranded on /login; ProtectedRoute safely waits for that sync.
      onNavigate("/command-center");
    } catch (err: any) {
      setFormError(err.message || "Google authentication failed.");
    } finally {
      setIsSubmittingGoogle(false);
    }
  };

  const handleNavigate = (route: string) => {
    setFormError(null);
    clearError();
    onNavigate(route);
  };

  return (
    <div className="min-h-screen w-full bg-void bg-tactical-grid flex flex-col items-center justify-center p-4 sm:p-8 relative overflow-hidden select-none">
      <div className="absolute inset-0 bg-radial-vignette pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-brand-orange/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-intelligence-cyan/5 blur-[100px] rounded-full pointer-events-none" />

      <motion.div initial="hidden" animate="visible" variants={staggerContainerVariants} className="w-full max-w-md relative z-10 space-y-6">
        <motion.div variants={fadeInVariants} className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-surface-2 border border-border-subtle shadow-brand-glow mb-2">
            <img src="/logo.png" alt="AgniDrishti Logo" className="w-8 h-8 object-contain" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-black tracking-tight text-text-primary">
            <span className="text-brand-orange">Agni</span>Drishti
          </h1>
          <p className="text-xs sm:text-sm font-mono font-medium tracking-[0.2em] text-intelligence-cyan uppercase">
            AI-Powered Thermal Intelligence
          </p>
        </motion.div>

        <motion.div variants={fadeInVariants}>
          <Card className="p-6 sm:p-8 bg-surface/90 backdrop-blur-md border-border-normal shadow-glass">
            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && (
                <div role="alert" className="p-3 rounded-lg bg-status-critical/15 border border-status-critical/30 flex items-start gap-2.5 text-status-critical text-xs animate-in fade-in duration-150">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setFormError(null); }}
                leftIcon={<Mail className="w-4 h-4" />}
                required
              />

              <div className="space-y-1.5">
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor="password" className="text-[10px] font-mono tracking-wider text-text-muted uppercase">Password</label>
                  <button type="button" onClick={() => handleNavigate("/forgot-password")} className="text-[10px] text-brand-orange hover:text-brand-amber font-mono underline outline-none">
                    Forgot Password?
                  </button>
                </div>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setFormError(null); }}
                  leftIcon={<Lock className="w-4 h-4" />}
                  rightIcon={
                    <button type="button" tabIndex={-1} aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword(!showPassword)} className="text-text-muted hover:text-text-primary transition-colors focus:outline-none">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                  required
                />
              </div>

              <div className="pt-2">
                <Button type="submit" variant="primary" size="lg" className="w-full font-display font-bold tracking-wide" leftIcon={<Shield className="w-4 h-4" />} isLoading={isSubmittingEmail || status === "loading"}>
                  Login
                </Button>
              </div>
            </form>

            <div className="mt-6 flex flex-col items-center space-y-4">
              <div className="flex items-center w-full">
                <div className="flex-1 h-px bg-border-subtle" />
                <span className="px-3 text-xs font-mono text-text-muted uppercase">OR</span>
                <div className="flex-1 h-px bg-border-subtle" />
              </div>

              <div className="w-full flex justify-center">
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full"
                  onClick={handleGoogleLogin}
                  isLoading={isSubmittingGoogle || status === "loading"}
                >
                  Sign in with Google
                </Button>
              </div>

              <div className="pt-2 text-center text-sm text-text-muted font-mono mt-2">
                Don't have an account?{" "}
                <button type="button" onClick={() => handleNavigate("/signup")} className="text-brand-orange hover:text-brand-amber underline transition-colors">
                  Sign up here
                </button>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Footer Meta */}
        <motion.div variants={fadeInVariants} className="text-center space-y-2">
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-2 border border-border-subtle text-[11px] font-mono text-text-muted">
            <Shield className="w-3.5 h-3.5 text-brand-orange" />
            <span>AgniDrishti Platform</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};
