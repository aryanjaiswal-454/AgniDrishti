import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { Socket } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../query/queryKeys";
import { useAuth } from "../context/AuthContext";
import { createSocketClient } from "./socket";
import {
  REALTIME_EVENTS,
  AlertCreatedPayload,
  ConnectionStatus,
  FacilitiesSyncedPayload,
} from "./events";
import { AlertToastContainer } from "./AlertToastContainer";
import { auth } from "../lib/firebase";

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
    let isMounted = true;
    let localSocket: Socket | null = null;
    let fallbackTimeout: ReturnType<typeof setTimeout>;

    const initSocket = async () => {
      // Only connect when user is actively authenticated
      if (authStatus !== "authenticated") {
        if (socket) {
          socket.disconnect();
          setSocket(null);
          setConnectionStatus("disconnected");
        }
        return;
      }

      setConnectionStatus("connecting");

      let token: string | undefined;
      try {
        if (auth.currentUser) {
          token = await auth.currentUser.getIdToken();
        }
      } catch (err) {
        console.error("Failed to get Firebase token for socket:", err);
      }

      if (!isMounted) return;

      const newSocket = createSocketClient(token);
      localSocket = newSocket;
      setSocket(newSocket);

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
        // Guard against duplicate alert notifications
        if (seenAlertIds.current.has(alert.id)) return;
        seenAlertIds.current.add(alert.id);

        // Keep seen set bounded
        if (seenAlertIds.current.size > 200) {
          const firstKey = seenAlertIds.current.values().next().value;
          if (firstKey) seenAlertIds.current.delete(firstKey);
        }

        // Query data must stay current for all alert severities so GIS markers update.
        queryClient.invalidateQueries({ queryKey: queryKeys.alerts.lists() });
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.summary() });
        queryClient.invalidateQueries({ queryKey: queryKeys.events.lists() });
        if (alert.classified_event_id) {
          queryClient.invalidateQueries({ queryKey: queryKeys.events.detail(alert.classified_event_id) });
        }

        // Toasts are reserved for urgent alerts; lower severities still refresh map data above.
        if (alert.severity === "high") {
          setLastAlert(alert);
          setToasts((prev) => [alert, ...prev.slice(0, 2)]);
        }
      });

      newSocket.on(REALTIME_EVENTS.FACILITIES_SYNCED, (_payload: FacilitiesSyncedPayload) => {
        // Every active facility query (including filter-specific map queries) refetches.
        queryClient.invalidateQueries({ queryKey: queryKeys.facilities.lists() });
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.summary() });
        queryClient.invalidateQueries({ queryKey: queryKeys.ingestion.status() });
      });

      newSocket.connect();
    };

    initSocket();

    return () => {
      isMounted = false;
      if (localSocket) {
        localSocket.off(REALTIME_EVENTS.ALERT_CREATED);
        localSocket.off(REALTIME_EVENTS.FACILITIES_SYNCED);
        localSocket.disconnect();
      }
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

