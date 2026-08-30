import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { modalVariants } from "../../design-system/motion";
import {
  Search,
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
  Layers,
  ArrowRight,
} from "lucide-react";
import { cn } from "../../design-system/utils";

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRoute: (route: string) => void;
}

interface CommandItem {
  id: string;
  title: string;
  category: "Navigation" | "Intelligence" | "System";
  icon: React.ReactNode;
  route: string;
  shortcut?: string;
}

const COMMANDS: CommandItem[] = [
  { id: "cmd-center", title: "Command Center Dashboard", category: "Navigation", icon: <LayoutDashboard className="w-4 h-4" />, route: "/command-center" },
  { id: "live-map", title: "Geospatial Live Map Overlay", category: "Navigation", icon: <Map className="w-4 h-4" />, route: "/live-map" },
  { id: "events", title: "Thermal Events & Anomalies", category: "Navigation", icon: <Flame className="w-4 h-4" />, route: "/events" },
  { id: "facilities", title: "Industrial Facilities Registry", category: "Navigation", icon: <Building2 className="w-4 h-4" />, route: "/facilities" },
  { id: "alerts", title: "Real-Time Threat Alerts", category: "Navigation", icon: <Bell className="w-4 h-4" />, route: "/alerts" },
  { id: "analytics", title: "Thermal Analytics & FRP Trends", category: "Navigation", icon: <BarChart3 className="w-4 h-4" />, route: "/analytics" },
  { id: "ai-intel", title: "AI Classifier Intelligence", category: "Intelligence", icon: <Cpu className="w-4 h-4" />, route: "/ai-intelligence" },
  { id: "data-sources", title: "FIRMS & OSM Data Pipelines", category: "Intelligence", icon: <Database className="w-4 h-4" />, route: "/data-sources" },
  { id: "settings", title: "System Settings & Configuration", category: "System", icon: <Settings className="w-4 h-4" />, route: "/settings" },
  { id: "help", title: "Documentation & Operations Help", category: "System", icon: <HelpCircle className="w-4 h-4" />, route: "/help" },
  { id: "design-sys", title: "Design System Showcase", category: "System", icon: <Layers className="w-4 h-4" />, route: "/design-system" },
];

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectRoute,
}) => {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filteredCommands = COMMANDS.filter((cmd) =>
    cmd.title.toLowerCase().includes(query.toLowerCase()) ||
    cmd.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filteredCommands.length || 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % (filteredCommands.length || 1));
      } else if (e.key === "Enter" && filteredCommands.length > 0) {
        e.preventDefault();
        const selected = filteredCommands[selectedIndex];
        if (selected) {
          onSelectRoute(selected.route);
          onClose();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose, onSelectRoute]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
        {/* Backdrop */}
        <motion.div
          variants={modalVariants.backdrop}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={onClose}
          className="fixed inset-0 bg-void/80 backdrop-blur-sm"
        />

        {/* Command Search Window */}
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Command Palette"
          variants={modalVariants.dialog}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="relative w-full max-w-xl rounded-xl bg-surface border border-border-normal p-0 shadow-glass text-text-primary z-10 overflow-hidden"
        >
          {/* Search Input Bar */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border-subtle bg-surface-2">
            <Search className="w-5 h-5 text-text-muted shrink-0" />
            <input
              autoFocus
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              placeholder="Type a command or search destination..."
              className="w-full bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none font-mono"
            />
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface border border-border-subtle text-text-muted">
              ESC
            </span>
          </div>

          {/* Results List */}
          <div className="max-h-80 overflow-y-auto p-2 divide-y divide-border-subtle/40">
            {filteredCommands.length === 0 ? (
              <div className="p-8 text-center text-xs font-mono text-text-muted">
                No commands matching &quot;{query}&quot;
              </div>
            ) : (
              filteredCommands.map((cmd, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <button
                    key={cmd.id}
                    onClick={() => {
                      onSelectRoute(cmd.route);
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left text-xs transition-colors duration-150",
                      isSelected
                        ? "bg-brand-orange/15 text-text-primary border border-brand-orange/30"
                        : "text-text-secondary hover:bg-surface-2 hover:text-text-primary"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className={cn(isSelected ? "text-brand-orange" : "text-text-muted")}>
                        {cmd.icon}
                      </span>
                      <div>
                        <span className="font-medium block text-text-primary">{cmd.title}</span>
                        <span className="text-[10px] font-mono text-text-muted uppercase">
                          {cmd.category}
                        </span>
                      </div>
                    </div>
                    {isSelected && <ArrowRight className="w-3.5 h-3.5 text-brand-orange" />}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer Guide */}
          <div className="px-4 py-2 bg-surface-3/50 border-t border-border-subtle flex items-center justify-between text-[11px] font-mono text-text-muted">
            <div className="flex items-center gap-3">
              <span>↑↓ to navigate</span>
              <span>↵ to select</span>
            </div>
            <span className="text-brand-amber">AgniDrishti Command System</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

