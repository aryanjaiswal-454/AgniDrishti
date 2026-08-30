import React from "react";
import { AnimatePresence } from "framer-motion";
import { AlertCreatedPayload } from "./events";
import { AlertToast } from "./AlertToast";

export interface AlertToastContainerProps {
  toasts: AlertCreatedPayload[];
  onDismiss: (id: string) => void;
  onNavigate: (route: string) => void;
}

export const AlertToastContainer: React.FC<AlertToastContainerProps> = ({
  toasts,
  onDismiss,
  onNavigate,
}) => {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 w-full max-w-sm sm:max-w-md pointer-events-none"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <div key={`toast-${toast.id}`} className="pointer-events-auto w-full">
            <AlertToast
              alert={toast}
              onDismiss={onDismiss}
              onNavigate={onNavigate}
            />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
};

