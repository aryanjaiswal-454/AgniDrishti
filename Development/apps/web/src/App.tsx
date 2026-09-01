import { useState, useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./query";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { RealtimeProvider } from "./realtime";
import { AppShell } from "./components/shell";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { LandingPage } from "./pages/landing/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { PrivacyPolicyPage } from "./pages/PrivacyPolicyPage";
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

  useEffect(() => {
    const isAuthRoute = currentRoute === "/login" || currentRoute === "/signup" || currentRoute === "/forgot-password" || currentRoute.startsWith("/reset-password");
    console.log('[App] Auth redirect check:', { status, currentRoute, isAuthRoute });
    if (status === "authenticated" && isAuthRoute) {
      console.log('[App] Redirecting to command center...');
      // Use a small delay to ensure state updates are complete
      setTimeout(() => {
        navigateTo("/command-center");
      }, 100);
    }
  }, [status, currentRoute]);

  if (currentRoute === "/" || currentRoute === "/landing") return <LandingPage onNavigate={navigateTo} />;
  if (currentRoute === "/login") return <LoginPage onNavigate={navigateTo} />;
  if (currentRoute === "/signup") return <SignupPage onNavigate={navigateTo} />;
  if (currentRoute === "/forgot-password") return <ForgotPasswordPage onNavigate={navigateTo} />;
  if (currentRoute.startsWith("/reset-password")) return <ResetPasswordPage onNavigate={navigateTo} />;
  if (currentRoute === "/privacy") return <PrivacyPolicyPage onNavigate={navigateTo} />;
  if (currentRoute === "/design-system") {
    return (
      <AppShell currentRoute={currentRoute} onNavigate={navigateTo}>
        <DesignSystemShowcase />
      </AppShell>
    );
  }

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
      case "/command-center": return <CommandCenterPage onNavigate={navigateTo} />;
      case "/live-map": return <LiveMapPage onNavigate={navigateTo} />;
      case "/events": return <ThermalEventsPage onNavigate={navigateTo} />;
      case "/facilities": return <FacilitiesPage onNavigate={navigateTo} />;
      case "/alerts": return <AlertsPage onNavigate={navigateTo} />;
      case "/analytics": return <AnalyticsPage onNavigate={navigateTo} />;
      case "/ai-intelligence": return <AiIntelligencePage onNavigate={navigateTo} />;
      case "/data-sources":
        return <ProtectedRoute requiredRoles={["admin", "analyst"]} onNavigate={navigateTo}><DataSourcesPage onNavigate={navigateTo} /></ProtectedRoute>;
      case "/settings":
        return <ProtectedRoute requiredRoles={["admin"]} onNavigate={navigateTo}><SettingsPage onNavigate={navigateTo} /></ProtectedRoute>;
      case "/help": return <HelpPage onNavigate={navigateTo} />;
      default: return <CommandCenterPage onNavigate={navigateTo} />;
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
