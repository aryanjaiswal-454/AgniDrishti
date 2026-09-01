import React from "react";
import { motion } from "framer-motion";
import { Card } from "../components/ui";
import { Shield } from "lucide-react";
import { staggerContainerVariants, fadeInVariants } from "../design-system/motion";

export const PrivacyPolicyPage: React.FC<{ onNavigate: (route: string) => void }> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen w-full bg-void bg-tactical-grid flex flex-col items-center p-4 sm:p-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-radial-vignette pointer-events-none" />

      <motion.div initial="hidden" animate="visible" variants={staggerContainerVariants} className="w-full max-w-4xl pt-16 relative z-10 space-y-6">
        <motion.div variants={fadeInVariants} className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-surface-2 rounded-xl text-intelligence-cyan shadow-cyan-glow">
            <Shield className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold text-text-primary">Privacy Policy</h1>
            <p className="text-text-secondary font-mono text-sm mt-1">Effective Date: September 1, 2026</p>
          </div>
        </motion.div>

        <motion.div variants={fadeInVariants}>
          <Card className="p-8 bg-surface-2/80 backdrop-blur-md border border-border-normal space-y-8">
            <section className="space-y-4">
              <h2 className="text-xl font-display font-bold text-text-primary">1. Information We Collect</h2>
              <div className="font-mono text-sm text-text-secondary space-y-2">
                <p>When you use AgniDrishti, we may collect the following types of information:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Account Information:</strong> Name, email address, and authentication credentials (including OAuth tokens from Google).</li>
                  <li><strong>Usage Data:</strong> System interactions, audit logs, and telemetry data for platform monitoring.</li>
                </ul>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-display font-bold text-text-primary">2. How We Use Your Information</h2>
              <div className="font-mono text-sm text-text-secondary space-y-2">
                <p>The information we collect is used strictly for operational purposes:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>To provide, maintain, and secure the AgniDrishti platform.</li>
                  <li>To authenticate operators and authorize access to restricted intelligence systems.</li>
                  <li>To monitor system health and detect unauthorized access attempts.</li>
                </ul>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-display font-bold text-text-primary">3. Google OAuth & Third-Party Services</h2>
              <div className="font-mono text-sm text-text-secondary space-y-2">
                <p>AgniDrishti uses Google OAuth for secure authentication. We only request basic profile information (Name and Email) required to create and verify your operator account. We do not share this data with any third parties.</p>
              </div>
            </section>

            <div className="pt-8 border-t border-border-subtle mt-12 flex justify-between">
              <button
                onClick={() => onNavigate("/")}
                className="text-brand-orange hover:text-brand-amber font-mono text-sm underline px-4 py-2"
              >
                Return to Home
              </button>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
};
