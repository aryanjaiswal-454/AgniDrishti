import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { Button, Input, Card } from "../components/ui";
import { Flame, Mail, AlertCircle, Key, CheckCircle } from "lucide-react";
import { fadeInVariants, staggerContainerVariants } from "../design-system/motion";

export interface ForgotPasswordPageProps {
  onNavigate: (route: string) => void;
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ onNavigate }) => {
  const { forgotPassword, clearError } = useAuth();

  const [step, setStep] = useState<1 | 2>(1); // 1: Email, 2: Success
  const [email, setEmail] = useState("");

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Clear any lingering auth context errors when this page mounts
  useEffect(() => {
    clearError();
  }, []);

  const handleRequestLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!email.trim()) return setFormError("Please enter your registered email.");

    setIsSubmitting(true);
    try {
      await forgotPassword(email.trim());
      setStep(2);
    } catch (err: any) {
      setFormError(err.message || "Failed to process request.");
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
            Reset Password
          </h1>
          <p className="text-xs sm:text-sm font-mono font-medium tracking-[0.2em] text-intelligence-cyan uppercase">
            Account Recovery
          </p>
        </motion.div>

        <motion.div variants={fadeInVariants}>
          <Card className="p-6 sm:p-8 bg-surface/90 backdrop-blur-md border-border-normal shadow-glass">

            {step === 1 && (
              <form onSubmit={handleRequestLink} className="space-y-4">
                <p className="text-text-secondary text-sm font-mono mb-4 text-center">
                  Enter your email address to receive a password reset link.
                </p>

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
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setFormError(null); }}
                  leftIcon={<Mail className="w-4 h-4" />}
                  required
                />

                <div className="pt-2">
                  <Button type="submit" variant="primary" size="lg" className="w-full font-display font-bold" leftIcon={<Key className="w-4 h-4" />} isLoading={isSubmitting}>
                    Send Reset Link
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
                  <h3 className="text-xl font-display font-bold text-text-primary">Reset Link Sent</h3>
                  <p className="text-sm font-mono text-text-secondary mt-2">Check your email for instructions to reset your password.</p>
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
