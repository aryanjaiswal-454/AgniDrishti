import React, { useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { UserRole } from "@agnidrishti/shared-types";
import { Loader2, ShieldAlert } from "lucide-react";
import { Badge, Button, Card } from "../ui";

export interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
  onNavigate: (route: string) => void;
}

export const AuthLoadingScreen: React.FC = () => {
  return (
    <div className="min-h-screen w-full bg-void bg-tactical-grid flex flex-col items-center justify-center p-6 text-center select-none">
      <div className="relative mb-6">
        <div className="w-16 h-16 rounded-2xl bg-surface-2 border border-border-subtle flex items-center justify-center shadow-brand-glow">
          <img src="/logo.png" alt="AgniDrishti Logo" className="w-8 h-8 object-contain" />
        </div>
        <div className="absolute -bottom-2 -right-2 p-1.5 rounded-full bg-surface-3 border border-border-normal text-intelligence-cyan">
          <Loader2 className="w-4 h-4 animate-spin" />
        </div>
      </div>

      <div className="space-y-2 max-w-sm">
        <h2 className="text-xl font-display font-bold text-text-primary tracking-tight">
          AgniDrishti Thermal Intelligence
        </h2>
        <p className="text-xs font-mono uppercase tracking-widest text-text-muted">
          Authenticating Secure Command Session...
        </p>
      </div>
    </div>
  );
};

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles,
  onNavigate,
}) => {
  const { user, status, hasRole } = useAuth();

  useEffect(() => {
    if (status === "unauthenticated") {
      onNavigate("/login");
    }
  }, [status, onNavigate]);

  if (status === "loading") {
    return <AuthLoadingScreen />;
  }

  if (status === "unauthenticated" || !user) {
    return <AuthLoadingScreen />;
  }

  // Check RBAC permissions if required
  if (requiredRoles && requiredRoles.length > 0 && !hasRole(requiredRoles)) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <Card className="max-w-md p-6 text-center border-status-critical/30 bg-status-critical/5 space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-status-critical/15 text-status-critical border border-status-critical/30 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-display font-semibold text-text-primary">
              Access Restricted
            </h3>
            <p className="text-xs text-text-secondary">
              Your account role (<span className="font-mono text-brand-amber font-semibold uppercase">{user.role}</span>) does not have authorization to access this view.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Badge variant="critical">Required: {requiredRoles.join(" / ")}</Badge>
          </div>
          <div className="pt-2">
            <Button variant="secondary" size="sm" onClick={() => onNavigate("/command-center")}>
              Return to Command Center
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};

