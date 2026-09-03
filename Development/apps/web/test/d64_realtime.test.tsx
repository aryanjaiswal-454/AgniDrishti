import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RealtimeProvider, useRealtime } from "../src/realtime/RealtimeContext";
import { AlertToast } from "../src/realtime/AlertToast";
import { AlertToastContainer } from "../src/realtime/AlertToastContainer";
import {
  AlertCreatedPayload,
  FacilitiesSyncedPayload,
  REALTIME_EVENTS,
} from "../src/realtime/events";
import * as socketModule from "../src/realtime/socket";
import * as authContext from "../src/context/AuthContext";

const mockFacilitiesSynced: FacilitiesSyncedPayload = {
  features_fetched: 24,
  facilities_upserted: 20,
  invalid_features: 1,
  duration_ms: 8500,
  synced_at: "2026-09-03T10:00:00.000Z",
};

const mockHighAlert: AlertCreatedPayload = {
  id: "alt-0000-0000-0001",
  classified_event_id: "evt-0000-0000-0001",
  severity: "high",
  status: "new",
  sent_at: "2026-08-29T15:30:00.000Z",
  event: {
    id: "evt-0000-0000-0001",
    primary_class: "industrial",
    sub_class: "industrial_fire",
    confidence_score: 0.96,
    is_anomalous: true,
    facility_name: "Bokaro Steel Plant",
    latitude: 23.67,
    longitude: 86.15,
    frp: 185.0,
  },
};

describe("Socket.io Client & Real-Time Alert Updates (D6.4)", () => {
  let queryClient: QueryClient;
  let mockSocket: any;
  let eventListeners: Record<string, ((...args: any[]) => void)[]>;

  beforeEach(() => {
    vi.clearAllMocks();
    eventListeners = {};

    mockSocket = {
      on: vi.fn((event: string, callback: (...args: any[]) => void) => {
        if (!eventListeners[event]) eventListeners[event] = [];
        eventListeners[event].push(callback);
      }),
      off: vi.fn((event: string) => {
        delete eventListeners[event];
      }),
      connect: vi.fn(() => {
        // Trigger connect event listener
        if (eventListeners["connect"]) {
          eventListeners["connect"].forEach((cb) => cb());
        }
      }),
      disconnect: vi.fn(() => {
        if (eventListeners["disconnect"]) {
          eventListeners["disconnect"].forEach((cb) => cb("io client disconnect"));
        }
      }),
    };

    vi.spyOn(socketModule, "createSocketClient").mockReturnValue(mockSocket);

    // Mock authenticated user state
    vi.spyOn(authContext, "useAuth").mockReturnValue({
      user: { id: "u-1", name: "Analyst", email: "analyst@aagnazar.in", role: "analyst", created_at: "" },
      status: "authenticated",
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });

    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function createWrapper() {
    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <RealtimeProvider onNavigate={vi.fn()}>{children}</RealtimeProvider>
      </QueryClientProvider>
    );
  }

  describe("AlertToast Component", () => {
    it("should render high-priority alert details and telemetry faithfully", () => {
      const onDismiss = vi.fn();
      const onNavigate = vi.fn();

      render(
        <AlertToast
          alert={mockHighAlert}
          onDismiss={onDismiss}
          onNavigate={onNavigate}
          autoDismissMs={0}
        />
      );

      expect(screen.getByText("High Priority Threat Alert")).toBeInTheDocument();
      expect(screen.getByText("INDUSTRIAL FIRE")).toBeInTheDocument();
      expect(screen.getByText("Bokaro Steel Plant")).toBeInTheDocument();
      expect(screen.getByText("185 MW")).toBeInTheDocument();
      expect(screen.getByText("96% CONF")).toBeInTheDocument();
      expect(screen.getByText("VIEW INVESTIGATION")).toBeInTheDocument();
    });

    it("should trigger navigation to event investigation when action button is clicked", () => {
      const onDismiss = vi.fn();
      const onNavigate = vi.fn();

      render(
        <AlertToast
          alert={mockHighAlert}
          onDismiss={onDismiss}
          onNavigate={onNavigate}
          autoDismissMs={0}
        />
      );

      const viewBtn = screen.getByText("VIEW INVESTIGATION");
      fireEvent.click(viewBtn);

      expect(onDismiss).toHaveBeenCalledWith(mockHighAlert.id);
      expect(onNavigate).toHaveBeenCalledWith(`/events/${mockHighAlert.classified_event_id}`);
    });

    it("should trigger manual dismissal when close button is clicked", () => {
      const onDismiss = vi.fn();
      const onNavigate = vi.fn();

      render(
        <AlertToast
          alert={mockHighAlert}
          onDismiss={onDismiss}
          onNavigate={onNavigate}
          autoDismissMs={0}
        />
      );

      const dismissBtn = screen.getByLabelText("Dismiss alert notification");
      fireEvent.click(dismissBtn);

      expect(onDismiss).toHaveBeenCalledWith(mockHighAlert.id);
    });

    it("should auto-dismiss after the specified timeout", () => {
      vi.useFakeTimers();
      const onDismiss = vi.fn();
      const onNavigate = vi.fn();

      render(
        <AlertToast
          alert={mockHighAlert}
          onDismiss={onDismiss}
          onNavigate={onNavigate}
          autoDismissMs={5000}
        />
      );

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(onDismiss).toHaveBeenCalledWith(mockHighAlert.id);
      vi.useRealTimers();
    });
  });

  describe("AlertToastContainer", () => {
    it("should render multiple toasts with accessible aria-live region", () => {
      const onDismiss = vi.fn();
      const onNavigate = vi.fn();

      const alerts: AlertCreatedPayload[] = [
        mockHighAlert,
        {
          ...mockHighAlert,
          id: "alt-0002",
          event: { ...mockHighAlert.event, facility_name: "Bina Refinery Flare" },
        },
      ];

      render(
        <AlertToastContainer
          toasts={alerts}
          onDismiss={onDismiss}
          onNavigate={onNavigate}
        />
      );

      expect(screen.getByText("Bokaro Steel Plant")).toBeInTheDocument();
      expect(screen.getByText("Bina Refinery Flare")).toBeInTheDocument();
    });

    it("should render nothing when toast list is empty", () => {
      const { container } = render(
        <AlertToastContainer
          toasts={[]}
          onDismiss={vi.fn()}
          onNavigate={vi.fn()}
        />
      );
      expect(container.firstChild).toBeNull();
    });
  });

  describe("RealtimeProvider & Query Invalidation", () => {
    const TestConsumer = () => {
      const { status, toasts, lastAlert } = useRealtime();
      return (
        <div>
          <span data-testid="realtime-status">{status}</span>
          <span data-testid="toasts-count">{toasts.length}</span>
          <span data-testid="last-alert-id">{lastAlert?.id || "none"}</span>
        </div>
      );
    };

    it("should establish socket connection and report connected status", async () => {
      render(<TestConsumer />, { wrapper: createWrapper() });

      expect(mockSocket.connect).toHaveBeenCalled();
      expect(screen.getByTestId("realtime-status")).toHaveTextContent("connected");
    });

    it("should handle agni:alert:created event, invalidate query caches, and display toast", async () => {
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      render(<TestConsumer />, { wrapper: createWrapper() });

      // Simulate incoming high-severity alert from Socket.io
      act(() => {
        if (eventListeners[REALTIME_EVENTS.ALERT_CREATED]) {
          eventListeners[REALTIME_EVENTS.ALERT_CREATED].forEach((cb) => cb(mockHighAlert));
        }
      });

      // Assert toast is rendered
      expect(screen.getByTestId("toasts-count")).toHaveTextContent("1");
      expect(screen.getByTestId("last-alert-id")).toHaveTextContent(mockHighAlert.id);
      expect(screen.getByText("Bokaro Steel Plant")).toBeInTheDocument();

      // Assert targeted query caches were invalidated
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ["alerts", "list"],
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ["dashboard", "summary"],
      });
    });

    it("should invalidate facility, dashboard, and ingestion queries after a facility sync", async () => {
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
      render(<TestConsumer />, { wrapper: createWrapper() });

      act(() => {
        eventListeners[REALTIME_EVENTS.FACILITIES_SYNCED]?.forEach((callback) => callback(mockFacilitiesSynced));
      });

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["facilities", "list"] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["dashboard", "summary"] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["ingestion", "status"] });
    });

    it("should ignore duplicate alert emissions (idempotency guard)", async () => {
      render(<TestConsumer />, { wrapper: createWrapper() });

      // First emission
      act(() => {
        if (eventListeners[REALTIME_EVENTS.ALERT_CREATED]) {
          eventListeners[REALTIME_EVENTS.ALERT_CREATED].forEach((cb) => cb(mockHighAlert));
        }
      });

      expect(screen.getByTestId("toasts-count")).toHaveTextContent("1");

      // Duplicate emission with exact same ID
      act(() => {
        if (eventListeners[REALTIME_EVENTS.ALERT_CREATED]) {
          eventListeners[REALTIME_EVENTS.ALERT_CREATED].forEach((cb) => cb(mockHighAlert));
        }
      });

      // Toast count should remain 1
      expect(screen.getByTestId("toasts-count")).toHaveTextContent("1");
    });

    it("should suppress non-high severity alerts from triggering toasts", async () => {
      render(<TestConsumer />, { wrapper: createWrapper() });

      const mediumAlert: AlertCreatedPayload = {
        ...mockHighAlert,
        id: "alt-medium-1",
        severity: "medium",
      };

      act(() => {
        if (eventListeners[REALTIME_EVENTS.ALERT_CREATED]) {
          eventListeners[REALTIME_EVENTS.ALERT_CREATED].forEach((cb) => cb(mediumAlert));
        }
      });

      expect(screen.getByTestId("toasts-count")).toHaveTextContent("0");
    });

    it("should update status to degraded on connection error", async () => {
      render(<TestConsumer />, { wrapper: createWrapper() });

      act(() => {
        if (eventListeners["connect_error"]) {
          eventListeners["connect_error"].forEach((cb) => cb(new Error("Connection timeout")));
        }
      });

      expect(screen.getByTestId("realtime-status")).toHaveTextContent("degraded");
    });
  });
});
