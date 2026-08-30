import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AlertsPage } from "../src/pages/alerts";
import * as alertsApi from "../src/api/alerts";
import * as authContext from "../src/hooks/useCurrentUser";
import { AlertWithDetails } from "../src/api/alerts";

vi.mock("../src/api/alerts", () => ({
  getAlerts: vi.fn(),
  getAlertById: vi.fn(),
  updateAlertStatus: vi.fn(),
}));

vi.mock("../src/hooks/useCurrentUser", () => ({
  useCurrentUser: vi.fn(),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return { Wrapper, queryClient };
}

const mockAlertsList: AlertWithDetails[] = [
  {
    id: "a0000000-0000-0000-0000-000000000001",
    classified_event_id: "e0000000-0000-0000-0000-000000000001",
    severity: "high",
    status: "new",
    sent_at: "2026-08-28T19:45:00Z",
    acknowledged_by: null,
    acknowledged_by_name: undefined,
    event: {
      id: "e0000000-0000-0000-0000-000000000001",
      primary_class: "industrial",
      sub_class: "industrial_fire",
      confidence_score: 0.96,
      is_anomalous: true,
      facility_name: "Bokaro Steel Plant",
      latitude: 23.6712,
      longitude: 86.1534,
      frp: 185.0,
    },
  },
  {
    id: "a0000000-0000-0000-0000-000000000002",
    classified_event_id: "e0000000-0000-0000-0000-000000000002",
    severity: "medium",
    status: "acknowledged",
    sent_at: "2026-08-28T18:30:00Z",
    acknowledged_by: "u1",
    acknowledged_by_name: "Duty Analyst",
    event: {
      id: "e0000000-0000-0000-0000-000000000002",
      primary_class: "industrial",
      sub_class: "gas_flare",
      confidence_score: 0.94,
      is_anomalous: false,
      facility_name: "Jamnagar Refinery Complex",
      latitude: 22.3562,
      longitude: 69.8525,
      frp: 88.2,
    },
  },
];

describe("AlertsPage & Alert Triage Board (D4.5C)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authContext.useCurrentUser).mockReturnValue({
      user: {
        id: "u1",
        email: "analyst@aagnazar.in",
        name: "Duty Analyst",
        role: "analyst",
        created_at: "2026-08-28T00:00:00Z",
      },
      isAuthenticated: true,
      role: "analyst",
    });
  });

  it("should render alert list with KPI counters, priority badges and lifecycle status", async () => {
    vi.mocked(alertsApi.getAlerts).mockResolvedValue({
      success: true,
      data: mockAlertsList,
      pagination: { total: 2, limit: 25, offset: 0, hasMore: false },
    } as any);

    const onNavigate = vi.fn();
    const { Wrapper } = createWrapper();

    render(
      <Wrapper>
        <AlertsPage onNavigate={onNavigate} />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("ALERT TRIAGE")).toBeInTheDocument();
      expect(screen.getByText("2 Alerts In Triage")).toBeInTheDocument();
      expect(screen.getAllByText(/ALT-A0000000/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/HIGH PRIORITY/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/MEDIUM PRIORITY/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/NEW/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/ACKNOWLEDGED/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText("Bokaro Steel Plant").length).toBeGreaterThan(0);
    });
  });

  it("should open AlertDetailDrawer when an alert row is clicked", async () => {
    vi.mocked(alertsApi.getAlerts).mockResolvedValue({
      success: true,
      data: mockAlertsList,
      pagination: { total: 2, limit: 25, offset: 0, hasMore: false },
    } as any);

    const onNavigate = vi.fn();
    const { Wrapper } = createWrapper();

    render(
      <Wrapper>
        <AlertsPage onNavigate={onNavigate} />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getAllByText(/ALT-A0000000/i).length).toBeGreaterThan(0);
    });

    const alertRow = screen.getAllByText(/ALT-A0000000/i)[0];
    fireEvent.click(alertRow);

    await waitFor(() => {
      expect(screen.getByText("Operational Triage Actions")).toBeInTheDocument();
      expect(screen.getByText("Acknowledge Alert")).toBeInTheDocument();
      expect(screen.getByText("Resolve Incident")).toBeInTheDocument();
      expect(screen.getByText("Mark False Positive")).toBeInTheDocument();
      expect(screen.getByText("Full Event Investigation")).toBeInTheDocument();
    });
  });

  it("should navigate to /events/:id from drawer full event investigation link", async () => {
    vi.mocked(alertsApi.getAlerts).mockResolvedValue({
      success: true,
      data: mockAlertsList,
      pagination: { total: 2, limit: 25, offset: 0, hasMore: false },
    } as any);

    const onNavigate = vi.fn();
    const { Wrapper } = createWrapper();

    render(
      <Wrapper>
        <AlertsPage onNavigate={onNavigate} />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getAllByText(/ALT-A0000000/i).length).toBeGreaterThan(0);
    });

    const triageBtn = screen.getAllByText("Triage →")[0];
    fireEvent.click(triageBtn);

    await waitFor(() => {
      expect(screen.getByText("Full Event Investigation")).toBeInTheDocument();
    });

    const investBtn = screen.getByText("Full Event Investigation");
    fireEvent.click(investBtn);

    expect(onNavigate).toHaveBeenCalledWith("/events/e0000000-0000-0000-0000-000000000001");
  });

  it("should allow Analyst to acknowledge an alert and trigger mutation", async () => {
    vi.mocked(alertsApi.getAlerts).mockResolvedValue({
      success: true,
      data: mockAlertsList,
      pagination: { total: 2, limit: 25, offset: 0, hasMore: false },
    } as any);
    vi.mocked(alertsApi.updateAlertStatus).mockResolvedValue({
      success: true,
      data: {
        ...mockAlertsList[0],
        status: "acknowledged",
        acknowledged_by: "u1",
      },
    });

    const onNavigate = vi.fn();
    const { Wrapper } = createWrapper();

    render(
      <Wrapper>
        <AlertsPage onNavigate={onNavigate} />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getAllByText(/ALT-A0000000/i).length).toBeGreaterThan(0);
    });

    const triageBtn = screen.getAllByText("Triage →")[0];
    fireEvent.click(triageBtn);

    await waitFor(() => {
      expect(screen.getByText("Acknowledge Alert")).toBeInTheDocument();
    });

    const ackBtn = screen.getByText("Acknowledge Alert");
    fireEvent.click(ackBtn);

    await waitFor(() => {
      expect(alertsApi.updateAlertStatus).toHaveBeenCalledWith(
        mockAlertsList[0].id,
        "acknowledged"
      );
    });
  });

  it("should open confirmation modal and resolve alert when confirmed", async () => {
    vi.mocked(alertsApi.getAlerts).mockResolvedValue({
      success: true,
      data: mockAlertsList,
      pagination: { total: 2, limit: 25, offset: 0, hasMore: false },
    } as any);
    vi.mocked(alertsApi.updateAlertStatus).mockResolvedValue({
      success: true,
      data: {
        ...mockAlertsList[0],
        status: "resolved",
      },
    });

    const onNavigate = vi.fn();
    const { Wrapper } = createWrapper();

    render(
      <Wrapper>
        <AlertsPage onNavigate={onNavigate} />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getAllByText(/ALT-A0000000/i).length).toBeGreaterThan(0);
    });

    const triageBtn = screen.getAllByText("Triage →")[0];
    fireEvent.click(triageBtn);

    await waitFor(() => {
      expect(screen.getByText("Resolve Incident")).toBeInTheDocument();
    });

    const resolveBtn = screen.getByText("Resolve Incident");
    fireEvent.click(resolveBtn);

    await waitFor(() => {
      expect(screen.getByText("Resolve Thermal Alert?")).toBeInTheDocument();
      expect(screen.getByText("Confirm Resolve")).toBeInTheDocument();
    });

    const confirmBtn = screen.getByText("Confirm Resolve");
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(alertsApi.updateAlertStatus).toHaveBeenCalledWith(
        mockAlertsList[0].id,
        "resolved"
      );
    });
  });

  it("should render read-only banner for Viewer role in drawer", async () => {
    vi.mocked(authContext.useCurrentUser).mockReturnValue({
      user: {
        id: "u3",
        email: "viewer@aagnazar.in",
        name: "Observer",
        role: "viewer",
        created_at: "2026-08-28T00:00:00Z",
      },
      isAuthenticated: true,
      role: "viewer",
    });

    vi.mocked(alertsApi.getAlerts).mockResolvedValue({
      success: true,
      data: mockAlertsList,
      pagination: { total: 2, limit: 25, offset: 0, hasMore: false },
    } as any);

    const onNavigate = vi.fn();
    const { Wrapper } = createWrapper();

    render(
      <Wrapper>
        <AlertsPage onNavigate={onNavigate} />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getAllByText(/ALT-A0000000/i).length).toBeGreaterThan(0);
    });

    const triageBtn = screen.getAllByText("Triage →")[0];
    fireEvent.click(triageBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/Alert triage mutations and lifecycle actions are restricted to Analyst and Admin roles/i)
      ).toBeInTheDocument();
      expect(screen.queryByText("Acknowledge Alert")).not.toBeInTheDocument();
    });
  });

  it("should render empty state when no alerts match filters", async () => {
    vi.mocked(alertsApi.getAlerts).mockResolvedValue({
      success: true,
      data: [],
      pagination: { total: 0, limit: 25, offset: 0, hasMore: false },
    } as any);

    const onNavigate = vi.fn();
    const { Wrapper } = createWrapper();

    render(
      <Wrapper>
        <AlertsPage onNavigate={onNavigate} />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("NO ACTIVE ALERTS")).toBeInTheDocument();
    });
  });
});
