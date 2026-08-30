import React, { useState } from "react";
import {
  Flame,
  Search,
  Bell,
  Menu,
  ChevronDown,
  Shield,
  Layers,
  LogOut,
  Sliders,
} from "lucide-react";
import { Button, IconButton, Badge } from "../ui";
import { useAuth } from "../../context/AuthContext";

export interface TopBarProps {
  onOpenMobileMenu: () => void;
  onOpenCommandPalette: () => void;
  onNavigate: (route: string) => void;
  currentRoute: string;
}

export const TopBar: React.FC<TopBarProps> = ({
  onOpenMobileMenu,
  onOpenCommandPalette,
  onNavigate,
}) => {
  const { user, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Compute initials from user name
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "AN";

  const handleLogout = async () => {
    setIsProfileOpen(false);
    await logout();
    onNavigate("/login");
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-surface/90 backdrop-blur-md border-b border-border-subtle px-4 py-2.5 flex items-center justify-between gap-4">
      {/* Left: Mobile Toggle & Brand Logo */}
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger Toggle */}
        <button
          onClick={onOpenMobileMenu}
          aria-label="Open mobile navigation menu"
          className="lg:hidden p-2 rounded-md bg-surface-2 border border-border-subtle text-text-secondary hover:text-text-primary hover:bg-surface-3 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Brand Wordmark */}
        <div
          onClick={() => onNavigate("/command-center")}
          className="flex items-center gap-2.5 cursor-pointer group select-none"
        >
          <div className="p-1.5 rounded-lg bg-brand-orange/15 border border-brand-orange/30 text-brand-orange group-hover:border-brand-orange/60 transition-colors">
            <Flame className="w-5 h-5" />
          </div>
          <div className="hidden sm:flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-display font-black text-lg tracking-tight text-text-primary">
                <span className="text-brand-orange">Agni</span>Drishti
              </span>
            </div>
            <span className="text-[9px] font-mono tracking-widest text-text-muted uppercase">
              Thermal Intelligence
            </span>
          </div>
        </div>
      </div>

      {/* Middle: Global Command Search Trigger */}
      <div className="flex-1 max-w-md mx-2 sm:mx-6">
        <button
          onClick={onOpenCommandPalette}
          aria-label="Search and command palette"
          className="w-full flex items-center justify-between px-3.5 py-1.5 text-xs font-mono rounded-lg bg-surface-2 hover:bg-surface-3 border border-border-normal hover:border-border-active text-text-muted hover:text-text-secondary transition-all duration-150 shadow-sm group"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-text-muted group-hover:text-brand-orange transition-colors" />
            <span className="truncate">Search facilities, thermal events, commands...</span>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-surface border border-border-subtle text-text-muted">
            <kbd>Ctrl</kbd>+<kbd>K</kbd>
          </span>
        </button>
      </div>

      {/* Right: Telemetry Badge, Notifications, Profile */}
      <div className="flex items-center gap-2.5 shrink-0">

        {/* Notifications Button & Dropdown */}
        <div className="relative">
          <IconButton
            icon={
              <div className="relative">
                <Bell className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-status-critical animate-pulse" />
              </div>
            }
            aria-label="Threat notifications"
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsNotificationsOpen(!isNotificationsOpen);
              setIsProfileOpen(false);
            }}
          />

          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl bg-surface-2 border border-border-normal p-4 shadow-xl text-text-primary z-50 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-border-subtle mb-3">
                <span className="text-xs font-mono uppercase font-semibold text-text-primary">
                  Threat Alerts (2)
                </span>
                <Badge variant="critical" size="sm">
                  Active
                </Badge>
              </div>
              <div className="space-y-2.5">
                <div
                  onClick={() => {
                    setIsNotificationsOpen(false);
                    onNavigate("/alerts");
                  }}
                  className="p-2.5 rounded-lg bg-surface border border-status-critical/30 hover:border-status-critical/60 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                    <span className="text-status-critical font-semibold">Industrial Fire Flare</span>
                    <span className="text-text-muted">12m ago</span>
                  </div>
                  <p className="text-xs text-text-secondary">
                    Jamnagar Refinery (Gujarat) detected at 142.6 MW FRP.
                  </p>
                </div>
                <div
                  onClick={() => {
                    setIsNotificationsOpen(false);
                    onNavigate("/alerts");
                  }}
                  className="p-2.5 rounded-lg bg-surface border border-border-subtle hover:border-border-normal cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                    <span className="text-brand-amber font-semibold">Anomalous Spike</span>
                    <span className="text-text-muted">45m ago</span>
                  </div>
                  <p className="text-xs text-text-secondary">
                    Bokaro Steel Complex detected above 90d baseline.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu with Real Authenticated Data */}
        <div className="relative">
          <button
            onClick={() => {
              setIsProfileOpen(!isProfileOpen);
              setIsNotificationsOpen(false);
            }}
            aria-label="User profile menu"
            className="flex items-center gap-2 p-1.5 rounded-lg bg-surface-2 hover:bg-surface-3 border border-border-subtle hover:border-border-normal transition-colors"
          >
            <div className="w-6 h-6 rounded-full bg-brand-orange/20 border border-brand-orange/40 flex items-center justify-center text-brand-orange text-xs font-bold font-mono">
              {initials}
            </div>
            <div className="hidden xl:flex flex-col text-left">
              <span className="text-xs font-medium text-text-primary leading-none">
                {user?.name || "Command User"}
              </span>
              <span className="text-[10px] font-mono text-intelligence-cyan leading-none mt-1">
                {user?.email || "unauthenticated"}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-text-muted" />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-60 rounded-xl bg-surface-2 border border-border-normal p-2 shadow-xl text-text-primary z-50 animate-in fade-in duration-150 divide-y divide-border-subtle">
              <div className="p-2.5">
                <p className="text-xs font-semibold text-text-primary truncate">
                  {user?.name || "Command User"}
                </p>
                <p className="text-[11px] font-mono text-text-muted truncate">
                  {user?.email || "user@agnidrishti.local"}
                </p>
                <div className="mt-2 flex items-center gap-1.5">
                  <Badge variant={user?.role === "admin" ? "brand" : user?.role === "analyst" ? "cyan" : "default"} size="sm">
                    {user?.role ? `${user.role.toUpperCase()} ROLE` : "USER"}
                  </Badge>
                  <Badge variant="success" size="sm">
                    Active
                  </Badge>
                </div>
              </div>
              <div className="py-1">
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    onNavigate("/settings");
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs text-text-secondary hover:text-text-primary hover:bg-surface rounded-md transition-colors"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Preferences</span>
                </button>
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    onNavigate("/help");
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs text-text-secondary hover:text-text-primary hover:bg-surface rounded-md transition-colors"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Security & Roles</span>
                </button>
              </div>
              <div className="pt-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs text-status-critical hover:bg-status-critical/10 rounded-md transition-colors font-medium"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

