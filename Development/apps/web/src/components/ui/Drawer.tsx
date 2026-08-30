import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { drawerVariants } from "../../design-system/motion";
import { IconButton } from "./IconButton";
import { X } from "lucide-react";
import { cn } from "../../design-system/utils";

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  width = "md",
  className,
}) => {
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

  const widthStyles = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-xl",
    xl: "max-w-2xl",
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            variants={drawerVariants.backdrop}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 bg-void/80 backdrop-blur-sm"
          />

          {/* Drawer Panel */}
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <motion.div
              role="dialog"
              aria-modal="true"
              variants={drawerVariants.drawer}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={cn(
                "w-screen bg-surface-2 border-l border-border-normal p-6 shadow-2xl text-text-primary flex flex-col justify-between h-full",
                widthStyles[width],
                className
              )}
            >
              {/* Header */}
              <div className="flex items-start justify-between pb-4 border-b border-border-subtle mb-4">
                <div>
                  {title && (
                    <h3 className="text-lg font-display font-semibold text-text-primary">
                      {title}
                    </h3>
                  )}
                  {description && (
                    <p className="text-xs text-text-secondary mt-1">{description}</p>
                  )}
                </div>
                <IconButton
                  icon={<X className="w-4 h-4" />}
                  aria-label="Close drawer"
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                />
              </div>

              {/* Body */}
              <div className="overflow-y-auto flex-1">{children}</div>

              {/* Footer */}
              {footer && (
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-subtle mt-4">
                  {footer}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

