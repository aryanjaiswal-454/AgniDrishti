import React from "react";
import { cn } from "../../design-system/utils";

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  variant?: "pill" | "underline";
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  variant = "pill",
  className,
}) => {
  return (
    <div
      role="tablist"
      className={cn(
        "flex items-center gap-1",
        variant === "pill" && "bg-surface-2 p-1 rounded-lg border border-border-subtle",
        variant === "underline" && "border-b border-border-subtle gap-4",
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;

        if (variant === "underline") {
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.id)}
              className={cn(
                "relative pb-2.5 pt-1 text-sm font-medium transition-colors duration-150 inline-flex items-center gap-2",
                isActive
                  ? "text-brand-orange font-semibold border-b-2 border-brand-orange"
                  : "text-text-secondary hover:text-text-primary"
              )}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-surface-3 text-text-muted font-mono">
                  {tab.count}
                </span>
              )}
            </button>
          );
        }

        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={cn(
              "px-3.5 py-1.5 text-xs font-medium rounded-md transition-all duration-150 inline-flex items-center gap-2 select-none",
              isActive
                ? "bg-surface-3 text-text-primary shadow-sm border border-border-normal"
                : "text-text-secondary hover:text-text-primary hover:bg-surface/50"
            )}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-surface text-text-muted font-mono">
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

