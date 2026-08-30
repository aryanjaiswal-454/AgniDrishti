import React from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Map,
  Flame,
  Building2,
  Bell,
  BarChart3,
  Cpu,
  Database,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Layers,
} from "lucide-react";
import { Tooltip, Badge } from "../ui";
import { cn } from "../../design-system/utils";
import { useAuth } from "../../context/AuthContext";
import { UserRole } from "@agnidrishti/shared-types";

export interface NavItem {
  id: string;
  label: string;
  route: string;
  icon: React.ReactNode;
  badge?: string;
  badgeVariant?: "brand" | "cyan" | "critical" | "warning" | "default";
  requiredRoles?: UserRole[];
}

export interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  currentRoute: string;
  onNavigate: (route: string) => void;
}

const PRIMARY_NAV_ITEMS: NavItem[] = [
  { id: "command-center", label: "Command Center", route: "/command-center", icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: "live-map", label: "Live Map", route: "/live-map", icon: <Map className="w-4 h-4" />, badge: "GIS", badgeVariant: "cyan" },
  { id: "events", label: "Thermal Events", route: "/events", icon: <Flame className="w-4 h-4" /> },
  { id: "facilities", label: "Facilities", route: "/facilities", icon: <Building2 className="w-4 h-4" /> },
  { id: "alerts", label: "Alerts", route: "/alerts", icon: <Bell className="w-4 h-4" /> },
  { id: "analytics", label: "Analytics", route: "/analytics", icon: <BarChart3 className="w-4 h-4" /> },
];

const INTEL_NAV_ITEMS: NavItem[] = [
  { id: "ai-intelligence", label: "AI Intelligence", route: "/ai-intelligence", icon: <Cpu className="w-4 h-4" /> },
  { id: "data-sources", label: "Data Sources", route: "/data-sources", icon: <Database className="w-4 h-4" />, requiredRoles: ["admin", "analyst"] },
];

const SYSTEM_NAV_ITEMS: NavItem[] = [
  { id: "settings", label: "Settings", route: "/settings", icon: <Settings className="w-4 h-4" />, requiredRoles: ["admin"] },
  { id: "help", label: "Help & Docs", route: "/help", icon: <HelpCircle className="w-4 h-4" /> },
];

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  currentRoute,
  onNavigate,
}) => {
  const { user } = useAuth();

  const renderNavGroup = (items: NavItem[], groupTitle?: string) => (
    <div className="space-y-1">
      {groupTitle && !isCollapsed && (
        <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest text-text-muted">
          {groupTitle}
        </div>
      )}
      {items.map((item) => {
        const isActive =
          currentRoute === item.route ||
          (item.route === "/command-center" && currentRoute === "/");

        const hasPermission =
          !item.requiredRoles ||
          (user && item.requiredRoles.includes(user.role));

        const content = (
          <button
            key={item.id}
            onClick={() => {
              if (hasPermission) {
                onNavigate(item.route);
              }
            }}
            disabled={!hasPermission}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 relative select-none",
              !hasPermission && "opacity-40 cursor-not-allowed hover:bg-transparent",
              hasPermission && isActive &&
                "bg-brand-orange/15 text-text-primary border border-brand-orange/30 font-semibold shadow-sm",
              hasPermission && !isActive &&
                "text-text-secondary hover:text-text-primary hover:bg-surface-2"
            )}
          >
            {/* Active Accent Bar */}
            {hasPermission && isActive && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r bg-brand-orange" />
            )}

            {/* Icon */}
            <span
              className={cn(
                "shrink-0",
                isActive ? "text-brand-orange" : "text-text-muted"
              )}
            >
              {item.icon}
            </span>

            {/* Label (when expanded) */}
            {!isCollapsed && (
              <span className="truncate flex-1 text-left">{item.label}</span>
            )}

            {/* Badge (when expanded) */}
            {!isCollapsed && item.badge && hasPermission && (
              <Badge variant={item.badgeVariant || "default"} size="sm">
                {item.badge}
              </Badge>
            )}

            {!isCollapsed && !hasPermission && (
              <Badge variant="outline" size="sm">
                Restricted
              </Badge>
            )}
          </button>
        );

        if (isCollapsed) {
          const tooltipContent = !hasPermission
            ? `${item.label} (Requires ${item.requiredRoles?.join("/")})`
            : item.label;

          return (
            <Tooltip key={item.id} content={tooltipContent} position="right">
              {content}
            </Tooltip>
          );
        }

        return content;
      })}
    </div>
  );

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 72 : 240 }}
      transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
      className="hidden lg:flex flex-col justify-between bg-surface border-r border-border-subtle shrink-0 select-none z-20 h-full"
    >
      {/* Top Nav Items */}
      <div className="p-3 space-y-5 overflow-y-auto">
        {renderNavGroup(PRIMARY_NAV_ITEMS, "Navigation")}
        <div className="border-t border-border-subtle my-2" />
        {renderNavGroup(INTEL_NAV_ITEMS, "Intelligence")}
        <div className="border-t border-border-subtle my-2" />
        {renderNavGroup(SYSTEM_NAV_ITEMS, "System")}
      </div>

      {/* Bottom User Info & Collapse Toggle */}
      <div className="p-3 border-t border-border-subtle space-y-2">
        {!isCollapsed && user && (
          <div className="p-2 rounded-md bg-surface-2 border border-border-subtle flex items-center justify-between text-[11px] font-mono">
            <span className="text-text-muted">Role:</span>
            <span className="text-brand-orange font-semibold uppercase">{user.role}</span>
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="w-full flex items-center justify-center p-2 rounded-lg bg-surface-2 hover:bg-surface-3 border border-border-subtle text-text-muted hover:text-text-primary transition-colors text-xs font-mono"
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <div className="flex items-center gap-2">
              <ChevronLeft className="w-4 h-4" />
              <span>Collapse Sidebar</span>
            </div>
          )}
        </button>
      </div>
    </motion.aside>
  );
};

