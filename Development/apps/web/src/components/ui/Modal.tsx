import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { modalVariants } from "../../design-system/motion";
import { IconButton } from "./IconButton";
import { X } from "lucide-react";
import { cn } from "../../design-system/utils";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
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

  const sizeStyles = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            variants={modalVariants.backdrop}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 bg-void/80 backdrop-blur-sm"
          />

          {/* Dialog Window */}
          <motion.div
            role="dialog"
            aria-modal="true"
            variants={modalVariants.dialog}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={cn(
              "relative w-full overflow-hidden rounded-xl bg-surface border border-border-normal p-6 shadow-glass text-text-primary z-10 flex flex-col max-h-[90vh]",
              sizeStyles[size],
              className
            )}
          >
            {/* Header */}
            {(title || description) && (
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
                  aria-label="Close dialog"
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                />
              </div>
            )}

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
      )}
    </AnimatePresence>
  );
};

