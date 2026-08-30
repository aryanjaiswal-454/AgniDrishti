import React from "react";
import { cn } from "../../design-system/utils";

export interface DividerProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical";
  label?: string;
}

export const Divider: React.FC<DividerProps> = ({
  orientation = "horizontal",
  label,
  className,
  ...props
}) => {
  if (orientation === "vertical") {
    return (
      <div
        className={cn("w-[1px] bg-border-subtle self-stretch h-auto", className)}
        {...props}
      />
    );
  }

  if (label) {
    return (
      <div className={cn("relative flex items-center w-full my-4", className)} {...props}>
        <div className="flex-grow border-t border-border-subtle" />
        <span className="flex-shrink mx-3 text-xs font-mono uppercase text-text-muted">
          {label}
        </span>
        <div className="flex-grow border-t border-border-subtle" />
      </div>
    );
  }

  return (
    <div className={cn("w-full border-t border-border-subtle my-4", className)} {...props} />
  );
};

