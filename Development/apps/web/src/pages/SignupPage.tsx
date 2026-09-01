import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { Button, Input, Card } from "../components/ui";
import { Flame, Lock, Mail, Eye, EyeOff, AlertCircle, Shield, User as UserIcon } from "lucide-react";
import { fadeInVariants, staggerContainerVariants } from "../design-system/motion";

export interface SignupPageProps {
  onNavigate: (route: string) => void;
}

export const SignupPage: React.FC<SignupPageProps> = ({ onNavigate }) => {
  const { signup, googleLogin, clearError, status } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmittingSignup, setIsSubmittingSignup] = useState(false);
  const [isSubmittingGoogle, setIsSubmittingGoogle] = useState(false);

  // Clear any lingering auth context errors when this page mounts
  useEffect(() => {
    clearError();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) return setFormError("Please enter your name.");
    if (!email.trim()) return setFormError("Please enter your email.");
    if (!password) return setFormError("Please enter a password.");
    if (password.length < 8) return setFormError("Password must be at least 8 characters long.");
    if (password !== confirmPassword) return setFormError("Passwords do not match.");

    setIsSubmittingSignup(true);
    try {
      await signup(name.trim(), email.trim(), password);
      // App.tsx handles redirection after status becomes authenticated
    } catch (err: any) {
      setFormError(err.message || "Signup failed. Please try again.");
    } finally {
      setIsSubmittingSignup(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsSubmittingGoogle(true);
    setFormError(null);
    try {
      await googleLogin();
      // App.tsx handles redirection after status becomes authenticated
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

      <motion.div initial="hidden" animate="visible" variants={staggerContainerVariants} className="w-full max-w-md relative z-10 space-y-6">
        <motion.div variants={fadeInVariants} className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-surface-2 border border-brand-orange/40 text-brand-orange shadow-brand-glow mb-2">
            <Flame className="w-8 h-8" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-black tracking-tight text-text-primary">
            Create Account
          </h1>
          <p className="text-xs sm:text-sm font-mono font-medium tracking-[0.2em] text-intelligence-cyan uppercase">
            Join AgniDrishti
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
                label="Full Name"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => { setName(e.target.value); setFormError(null); }}
                leftIcon={<UserIcon className="w-4 h-4" />}
                required
              />

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

              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                placeholder="Min 8 characters"
                autoComplete="new-password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setFormError(null); }}
                leftIcon={<Lock className="w-4 h-4" />}
                rightIcon={
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-text-muted hover:text-text-primary transition-colors focus:outline-none">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
                required
              />

              <Input
                label="Confirm Password"
                type={showPassword ? "text" : "password"}
                placeholder="Re-enter password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setFormError(null); }}
                leftIcon={<Lock className="w-4 h-4" />}
                required
              />

              <div className="pt-2">
                <Button type="submit" variant="primary" size="lg" className="w-full font-display font-bold tracking-wide" leftIcon={<Shield className="w-4 h-4" />} isLoading={isSubmittingSignup || status === "loading"}>
                  Sign Up
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
                  Sign up with Google
                </Button>
              </div>

              <div className="pt-2 text-center text-sm text-text-muted font-mono mt-2">
                Already have an account?{" "}
                <button type="button" onClick={() => handleNavigate("/login")} className="text-brand-orange hover:text-brand-amber underline transition-colors">
                  Login here
                </button>
              </div>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
};
