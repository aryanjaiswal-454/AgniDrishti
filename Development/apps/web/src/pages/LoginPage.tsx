import React, { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { Button, Input, Card, Badge } from "../components/ui";
import { Flame, Lock, Mail, Eye, EyeOff, AlertCircle, Sparkles, Shield } from "lucide-react";
import { fadeInVariants, staggerContainerVariants } from "../design-system/motion";

export interface LoginPageProps {
  onNavigate: (route: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { login, error, clearError, status } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    clearError();

    if (!email || !email.trim()) {
      setFormError("Please enter your command access email.");
      return;
    }
    if (!password) {
      setFormError("Please enter your command access password.");
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email.trim(), password);
      onNavigate("/command-center");
    } catch (err: any) {
      setFormError(err.message || "Invalid authentication credentials.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickFill = (roleEmail: string, rolePass: string) => {
    setEmail(roleEmail);
    setPassword(rolePass);
    setFormError(null);
    clearError();
  };

  return (
    <div className="min-h-screen w-full bg-void bg-tactical-grid flex flex-col items-center justify-center p-4 sm:p-8 relative overflow-hidden select-none">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 bg-radial-vignette pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-brand-orange/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-intelligence-cyan/5 blur-[100px] rounded-full pointer-events-none" />

      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainerVariants}
        className="w-full max-w-md relative z-10 space-y-6"
      >
        {/* Brand Header */}
        <motion.div variants={fadeInVariants} className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-surface-2 border border-brand-orange/40 text-brand-orange shadow-brand-glow mb-2">
            <Flame className="w-8 h-8" />
          </div>

          <h1 className="text-3xl sm:text-4xl font-display font-black tracking-tight text-text-primary">
            <span className="text-brand-orange">Agni</span>Drishti
          </h1>

          <p className="text-xs sm:text-sm font-mono font-medium tracking-[0.2em] text-intelligence-cyan uppercase">
            AI-Powered Thermal Intelligence
          </p>

          <p className="text-[11px] font-mono tracking-[0.3em] text-text-muted uppercase">
            Detect &middot; Classify &middot; Monitor
          </p>
        </motion.div>

        {/* Login Card */}
        <motion.div variants={fadeInVariants}>
          <Card className="p-6 sm:p-8 bg-surface/90 backdrop-blur-md border-border-normal shadow-glass">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error Banner */}
              {(formError || error) && (
                <div
                  role="alert"
                  className="p-3 rounded-lg bg-status-critical/15 border border-status-critical/30 flex items-start gap-2.5 text-status-critical text-xs animate-in fade-in duration-150"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{formError || error}</span>
                </div>
              )}

              {/* Email Input */}
              <Input
                label="COMMAND IDENTIFIER (EMAIL)"
                type="email"
                placeholder="analyst@agnidrishti.local"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setFormError(null);
                }}
                leftIcon={<Mail className="w-4 h-4" />}
                required
              />

              {/* Password Input with Show/Hide */}
              <div className="space-y-1.5">
                <Input
                  label="ACCESS KEY (PASSWORD)"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setFormError(null);
                  }}
                  leftIcon={<Lock className="w-4 h-4" />}
                  rightIcon={
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-text-muted hover:text-text-primary transition-colors focus:outline-none"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                  required
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full font-display font-bold tracking-wide"
                  leftIcon={<Shield className="w-4 h-4" />}
                  isLoading={isSubmitting || status === "loading"}
                >
                  ENTER COMMAND CENTER
                </Button>
              </div>
            </form>

            {/* Demo Quick-Fill Credentials */}
            <div className="mt-6 pt-5 border-t border-border-subtle space-y-3">
              <div className="flex items-center justify-between text-[10px] font-mono text-text-muted uppercase">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-brand-amber" />
                  Demo Access Credentials
                </span>
                <span>Select Role</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickFill("admin@agnidrishti.local", "AdminPassword123!")}
                  className="p-2 rounded-md bg-surface-2 hover:bg-surface-3 border border-border-subtle hover:border-brand-orange/40 text-[11px] font-mono text-left transition-colors"
                >
                  <span className="block text-brand-amber font-semibold">Admin</span>
                  <span className="block text-[9px] text-text-muted truncate">admin@...</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill("analyst@agnidrishti.local", "AnalystPassword123!")}
                  className="p-2 rounded-md bg-surface-2 hover:bg-surface-3 border border-border-subtle hover:border-intelligence-cyan/40 text-[11px] font-mono text-left transition-colors"
                >
                  <span className="block text-intelligence-cyan font-semibold">Analyst</span>
                  <span className="block text-[9px] text-text-muted truncate">analyst@...</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill("viewer@agnidrishti.local", "ViewerPassword123!")}
                  className="p-2 rounded-md bg-surface-2 hover:bg-surface-3 border border-border-subtle hover:border-border-normal text-[11px] font-mono text-left transition-colors"
                >
                  <span className="block text-text-secondary font-semibold">Viewer</span>
                  <span className="block text-[9px] text-text-muted truncate">viewer@...</span>
                </button>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Footer Meta */}
        <motion.div variants={fadeInVariants} className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-2 border border-border-subtle text-[11px] font-mono text-text-muted">
            <Shield className="w-3.5 h-3.5 text-brand-orange" />
            <span>SIH26162 • Smart India Hackathon 2026</span>
          </div>
          <div>
            <button
              type="button"
              onClick={() => onNavigate("/design-system")}
              className="text-xs font-mono text-text-muted hover:text-brand-amber underline transition-colors"
            >
              Inspect Design System (/design-system)
            </button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

