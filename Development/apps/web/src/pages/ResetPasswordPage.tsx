import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { Button, Input, Card } from "../components/ui";
import { Flame, Lock, AlertCircle, Eye, EyeOff, CheckCircle } from "lucide-react";
import { fadeInVariants, staggerContainerVariants } from "../design-system/motion";

export interface ResetPasswordPageProps {
  onNavigate: (route: string) => void;
}

export const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({ onNavigate }) => {
  const { resetPassword, clearError } = useAuth();

  const [step, setStep] = useState<1 | 2>(1); // 1: Form, 2: Success
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [oobCode, setOobCode] = useState<string | null>(null);

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    clearError();
    // Parse oobCode from URL (Firebase action link format: ?mode=resetPassword&oobCode=XYZ...)
    const params = new URLSearchParams(window.location.search);
    const code = params.get("oobCode");
    if (code) {
      setOobCode(code);
    } else {
      setFormError("Invalid or missing password reset code. Please request a new link.");
    }
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    clearError();

    if (!oobCode) return setFormError("Missing reset code.");
    if (!newPassword) return setFormError("Please enter a new password.");
    if (newPassword.length < 8) return setFormError("Password must be at least 8 characters.");
    if (newPassword !== confirmPassword) return setFormError("Passwords do not match.");

    setIsSubmitting(true);
    try {
      await resetPassword("", oobCode, newPassword);
      setStep(2);
    } catch (err: any) {
      setFormError(err.message || "Failed to reset password.");
    } finally {
      setIsSubmitting(false);
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
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-surface-2 border border-border-subtle shadow-brand-glow mb-2">
            <img src="/logo.png" alt="AgniDrishti Logo" className="w-8 h-8 object-contain" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-black tracking-tight text-text-primary">
            Create New Password
          </h1>
          <p className="text-xs sm:text-sm font-mono font-medium tracking-[0.2em] text-intelligence-cyan uppercase">
            Account Recovery
          </p>
        </motion.div>

        <motion.div variants={fadeInVariants}>
          <Card className="p-6 sm:p-8 bg-surface/90 backdrop-blur-md border-border-normal shadow-glass">

            {step === 1 && (
              <form onSubmit={handleReset} className="space-y-4">
                {formError && (
                  <div role="alert" className="p-3 rounded-lg bg-status-critical/15 border border-status-critical/30 flex items-start gap-2.5 text-status-critical text-xs animate-in fade-in duration-150">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{formError}</span>
                  </div>
                )}

                <Input
                  label="New Password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min 8 characters"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); setFormError(null); }}
                  leftIcon={<Lock className="w-4 h-4" />}
                  rightIcon={
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-text-muted hover:text-text-primary transition-colors focus:outline-none">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                  required
                />

                <Input
                  label="Confirm New Password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Re-enter password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setFormError(null); }}
                  leftIcon={<Lock className="w-4 h-4" />}
                  required
                />

                <div className="pt-2">
                  <Button type="submit" variant="primary" size="lg" className="w-full font-display font-bold" isLoading={isSubmitting} disabled={!oobCode}>
                    Reset Password
                  </Button>
                </div>
              </form>
            )}

            {step === 2 && (
              <div className="space-y-6 text-center animate-in fade-in duration-300">
                <div className="mx-auto w-16 h-16 bg-status-healthy/20 text-status-healthy rounded-full flex items-center justify-center border border-status-healthy/30 shadow-[0_0_20px_rgba(34,197,94,0.2)]">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-display font-bold text-text-primary">Password Reset Successful</h3>
                  <p className="text-sm font-mono text-text-secondary mt-2">You can now use your new password to sign in.</p>
                </div>
                <Button variant="primary" size="lg" className="w-full" onClick={() => handleNavigate("/login")}>
                  Go to Login
                </Button>
              </div>
            )}

            <div className="mt-6 border-t border-border-subtle pt-4 text-center">
               <button type="button" onClick={() => handleNavigate("/login")} className="text-sm font-mono text-brand-orange hover:text-brand-amber underline transition-colors">
                  Return to Login
               </button>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
};
