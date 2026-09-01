import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flame,
  LayoutDashboard,
  Map,
  Building2,
  Bell,
  BarChart3,
  Cpu,
  Database,
  Settings,
  HelpCircle,
  X,
  Layers,
  LogOut,
} from "lucide-react";
import { Badge, IconButton } from "../ui";
import { cn } from "../../design-system/utils";
import { drawerVariants } from "../../design-system/motion";
import { useAuth } from "../../context/AuthContext";
import { UserRole } from "@agnidrishti/shared-types";

export interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentRoute: string;
  onNavigate: (route: string) => void;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  currentRoute,
  onNavigate,
}) => {
  const { user, logout } = useAuth();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const navItems: Array<{
    label: string;
    route: string;
    icon: React.ReactNode;
    badge?: string;
    badgeVariant?: "brand" | "cyan" | "critical" | "warning" | "default";
    requiredRoles?: UserRole[];
  }> = [
    { label: "Command Center", route: "/command-center", icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: "Live Map", route: "/live-map", icon: <Map className="w-4 h-4" />, badge: "GIS" },
    { label: "Thermal Events", route: "/events", icon: <Flame className="w-4 h-4" /> },
    { label: "Facilities", route: "/facilities", icon: <Building2 className="w-4 h-4" /> },
    { label: "Alerts", route: "/alerts", icon: <Bell className="w-4 h-4" /> },
    { label: "Analytics", route: "/analytics", icon: <BarChart3 className="w-4 h-4" /> },
    { label: "AI Intelligence", route: "/ai-intelligence", icon: <Cpu className="w-4 h-4" /> },
    { label: "Data Sources", route: "/data-sources", icon: <Database className="w-4 h-4" />, requiredRoles: ["admin", "analyst"] },
    { label: "Settings", route: "/settings", icon: <Settings className="w-4 h-4" />, requiredRoles: ["admin"] },
    { label: "Help & Docs", route: "/help", icon: <HelpCircle className="w-4 h-4" /> },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <motion.div
            variants={drawerVariants.backdrop}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 bg-void/80 backdrop-blur-sm"
          />

          {/* Slide-out Menu */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Mobile Navigation"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-72 max-w-xs h-full bg-surface-2 border-r border-border-normal p-4 flex flex-col justify-between shadow-2xl z-10"
          >
            {/* Header */}
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-border-subtle mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-brand-orange/15 border border-brand-orange/30 text-brand-orange">
                    <Flame className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-display font-bold text-base text-text-primary block">
                      <span className="text-brand-orange">Agni</span>Drishti
                    </span>
                    {user && (
                      <span className="text-[10px] font-mono text-intelligence-cyan">
                        {user.name} ({user.role.toUpperCase()})
                      </span>
                    )}
                  </div>
                </div>
                <IconButton
                  icon={<X className="w-4 h-4" />}
                  aria-label="Close navigation"
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                />
              </div>

              {/* Navigation Links */}
              <div className="space-y-1 overflow-y-auto max-h-[calc(100vh-220px)]">
                {navItems.map((item) => {
                  const isActive =
                    currentRoute === item.route ||
                    (item.route === "/command-center" && currentRoute === "/");

                  const hasPermission =
                    !item.requiredRoles ||
                    (user && item.requiredRoles.includes(user.role));

                  return (
                    <button
                      key={item.route}
                      onClick={() => {
                        if (hasPermission) {
                          onNavigate(item.route);
                          onClose();
                        }
                      }}
                      disabled={!hasPermission}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors",
                        !hasPermission && "opacity-40 cursor-not-allowed",
                        hasPermission && isActive &&
                          "bg-brand-orange/15 text-text-primary border border-brand-orange/30 font-semibold",
                        hasPermission && !isActive &&
                          "text-text-secondary hover:text-text-primary hover:bg-surface"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span className={isActive ? "text-brand-orange" : "text-text-muted"}>
                          {item.icon}
                        </span>
                        <span>{item.label}</span>
                      </div>
                      {item.badge && hasPermission && (
                        <Badge variant={item.badgeVariant || "default"} size="sm">
                          {item.badge}
                        </Badge>
                      )}
                      {!hasPermission && (
                        <Badge variant="outline" size="sm">
                          Restricted
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Meta & Logout */}
            <div className="pt-4 border-t border-border-subtle space-y-2 text-[11px] font-mono text-text-muted">
              {user && (
                <button
                  onClick={async () => {
                    onClose();
                    await logout();
                    onNavigate("/login");
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-status-critical/10 text-status-critical hover:bg-status-critical/20 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              )}
              <div className="flex items-center justify-between px-1">
                <span>AgniDrishti</span>
                <span className="text-brand-orange">Command Center</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

