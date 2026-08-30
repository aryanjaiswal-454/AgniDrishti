import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { Socket } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../query/queryKeys";
import { useAuth } from "../context/AuthContext";
import { createSocketClient } from "./socket";
import { REALTIME_EVENTS, AlertCreatedPayload, ConnectionStatus } from "./events";
import { AlertToastContainer } from "./AlertToastContainer";

export interface RealtimeContextType {
  socket: Socket | null;
  status: ConnectionStatus;
  toasts: AlertCreatedPayload[];
  lastAlert: AlertCreatedPayload | null;
  dismissToast: (id: string) => void;
  clearAllToasts: () => void;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export interface RealtimeProviderProps {
  children: React.ReactNode;
  onNavigate?: (route: string) => void;
}

export const RealtimeProvider: React.FC<RealtimeProviderProps> = ({
  children,
  onNavigate = () => {},
}) => {
  const { status: authStatus } = useAuth();
  const queryClient = useQueryClient();

  const [socket, setSocket] = useState<Socket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("disconnected");
  const [toasts, setToasts] = useState<AlertCreatedPayload[]>([]);
  const [lastAlert, setLastAlert] = useState<AlertCreatedPayload | null>(null);

  // In-memory set to prevent duplicate toasts for the same alert ID
  const seenAlertIds = useRef<Set<string>>(new Set());

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  useEffect(() => {
    // Only connect when user is actively authenticated
    if (authStatus !== "authenticated") {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setConnectionStatus("disconnected");
      }
      return;
    }

    const newSocket = createSocketClient();
    setSocket(newSocket);
    setConnectionStatus("connecting");

    newSocket.on("connect", () => {
      setConnectionStatus("connected");
    });

    newSocket.on("disconnect", (reason) => {
      if (reason === "io server disconnect") {
        setConnectionStatus("disconnected");
      } else {
        setConnectionStatus("degraded");
      }
    });

    newSocket.on("connect_error", () => {
      setConnectionStatus("degraded");
    });

    newSocket.on("reconnect", () => {
      setConnectionStatus("connected");
    });

    // Real-time alert listener
    newSocket.on(REALTIME_EVENTS.ALERT_CREATED, (alert: AlertCreatedPayload) => {
      // 1. Guard against non-high severity
      if (alert.severity !== "high") return;

      // 2. Guard against duplicate alert notifications
      if (seenAlertIds.current.has(alert.id)) return;
      seenAlertIds.current.add(alert.id);

      // Keep seen set bounded
      if (seenAlertIds.current.size > 200) {
        const firstKey = seenAlertIds.current.values().next().value;
        if (firstKey) seenAlertIds.current.delete(firstKey);
      }

      setLastAlert(alert);

      // Add to toasts (capped at max 3 visible toasts)
      setToasts((prev) => [alert, ...prev.slice(0, 2)]);

      // 3. Targeted TanStack Query cache invalidation (NO full cache wipe)
      queryClient.invalidateQueries({ queryKey: queryKeys.alerts.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.summary() });
      if (alert.classified_event_id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.events.detail(alert.classified_event_id) });
      }
    });

    newSocket.connect();

    return () => {
      newSocket.off(REALTIME_EVENTS.ALERT_CREATED);
      newSocket.disconnect();
      setSocket(null);
      setConnectionStatus("disconnected");
    };
  }, [authStatus, queryClient]);

  return (
    <RealtimeContext.Provider
      value={{
        socket,
        status: connectionStatus,
        toasts,
        lastAlert,
        dismissToast,
        clearAllToasts,
      }}
    >
      {children}
      {/* Floating Alert Toast Container */}
      <AlertToastContainer
        toasts={toasts}
        onDismiss={dismissToast}
        onNavigate={onNavigate}
      />
    </RealtimeContext.Provider>
  );
};

export function useRealtime(): RealtimeContextType {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error("useRealtime must be used within a RealtimeProvider");
  }
  return context;
}

