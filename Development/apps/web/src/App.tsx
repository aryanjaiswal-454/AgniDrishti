import { useState, useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./query";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { RealtimeProvider } from "./realtime";
import { AppShell } from "./components/shell";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { LandingPage } from "./pages/landing/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { DesignSystemShowcase } from "./pages/DesignSystemShowcase";
import { FacilitiesPage, FacilityDetailPage } from "./pages/facilities";
import { ThermalEventsPage, ThermalEventDetailPage } from "./pages/events";
import { AlertsPage } from "./pages/alerts";
import { CommandCenterPage } from "./pages/command-center";
import { LiveMapPage } from "./pages/live-map";
import {
  AnalyticsPage,
  AiIntelligencePage,
  DataSourcesPage,
  SettingsPage,
  HelpPage,
} from "./pages/placeholders";

/**
 * Main application router inner component (accesses AuthContext & Realtime).
 */
function AppContent() {
  const { status } = useAuth();

  const getInitialRoute = (): string => {
    const hash = window.location.hash.replace("#", "");
    if (hash && hash.startsWith("/")) return hash;
    const path = window.location.pathname;
    if (path && path !== "/") return path;
    return "/";
  };

  const [currentRoute, setCurrentRoute] = useState<string>(getInitialRoute);

  useEffect(() => {
    const handleLocationChange = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash && hash.startsWith("/")) {
        setCurrentRoute(hash);
      } else if (window.location.pathname !== "/") {
        setCurrentRoute(window.location.pathname);
      } else {
        setCurrentRoute("/");
      }
    };

    window.addEventListener("popstate", handleLocationChange);
    window.addEventListener("hashchange", handleLocationChange);
    return () => {
      window.removeEventListener("popstate", handleLocationChange);
      window.removeEventListener("hashchange", handleLocationChange);
    };
  }, []);

  const navigateTo = (route: string) => {
    setCurrentRoute(route);
    window.history.pushState({}, "", `#${route}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // If already authenticated and visiting /login, redirect to /command-center
  useEffect(() => {
    if (status === "authenticated" && currentRoute === "/login") {
      navigateTo("/command-center");
    }
  }, [status, currentRoute]);

  // 1. Standalone Public Landing Experience
  if (currentRoute === "/" || currentRoute === "/landing") {
    return <LandingPage onNavigate={navigateTo} />;
  }

  // 2. Standalone Public Login Route
  if (currentRoute === "/login") {
    return <LoginPage onNavigate={navigateTo} />;
  }

  // 3. Standalone Public Design System Showcase
  if (currentRoute === "/design-system") {
    return (
      <AppShell currentRoute={currentRoute} onNavigate={navigateTo}>
        <DesignSystemShowcase />
      </AppShell>
    );
  }

  // 4. Protected Application Routes
  const renderProtectedView = () => {
    if (currentRoute.startsWith("/facilities/")) {
      const facilityId = currentRoute.replace("/facilities/", "").split("?")[0];
      return <FacilityDetailPage facilityId={facilityId} onNavigate={navigateTo} />;
    }

    if (currentRoute.startsWith("/events/")) {
      const eventId = currentRoute.replace("/events/", "").split("?")[0];
      return <ThermalEventDetailPage eventId={eventId} onNavigate={navigateTo} />;
    }

    switch (currentRoute) {
      case "/command-center":
        return <CommandCenterPage onNavigate={navigateTo} />;
      case "/live-map":
        return <LiveMapPage onNavigate={navigateTo} />;
      case "/events":
        return <ThermalEventsPage onNavigate={navigateTo} />;
      case "/facilities":
        return <FacilitiesPage onNavigate={navigateTo} />;
      case "/alerts":
        return <AlertsPage onNavigate={navigateTo} />;
      case "/analytics":
        return <AnalyticsPage onNavigate={navigateTo} />;
      case "/ai-intelligence":
        return <AiIntelligencePage onNavigate={navigateTo} />;
      case "/data-sources":
        return (
          <ProtectedRoute requiredRoles={["admin", "analyst"]} onNavigate={navigateTo}>
            <DataSourcesPage onNavigate={navigateTo} />
          </ProtectedRoute>
        );
      case "/settings":
        return (
          <ProtectedRoute requiredRoles={["admin"]} onNavigate={navigateTo}>
            <SettingsPage onNavigate={navigateTo} />
          </ProtectedRoute>
        );
      case "/help":
        return <HelpPage onNavigate={navigateTo} />;
      default:
        return <CommandCenterPage onNavigate={navigateTo} />;
    }
  };

  return (
    <RealtimeProvider onNavigate={navigateTo}>
      <ProtectedRoute onNavigate={navigateTo}>
        <AppShell currentRoute={currentRoute} onNavigate={navigateTo}>
          {renderProtectedView()}
        </AppShell>
      </ProtectedRoute>
    </RealtimeProvider>
  );
}

/**
 * AgniDrishti — Root Application with QueryClientProvider and AuthProvider
 */
export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

