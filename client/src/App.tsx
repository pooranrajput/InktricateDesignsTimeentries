import { useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ViewToggleProvider, useViewToggle } from "@/hooks/use-view-toggle";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import AdminDashboard from "@/pages/admin-dashboard";
import EmployeeDashboard from "@/pages/employee-dashboard";
import UserProfile from "@/pages/user-profile";
import { EmergencyRecoveryPage } from "@/pages/emergency-recovery";

function Router() {
  const { user, isLoading } = useAuth();
  const { viewAsEmployee } = useViewToggle();
  const [location] = useLocation();

  // Clean application - no external integrations

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, show auth page
  if (!user) {
    return (
      <Switch>
        <Route path="/auth" component={AuthPage} />
        <Route path="*">
          <AuthPage />
        </Route>
      </Switch>
    );
  }

  // If user needs to reset password, show auth page
  if (user.mustResetPassword) {
    return <AuthPage />;
  }

  // Authenticated routing based on role and view toggle
  const isAdmin = user.role === "admin";
  const shouldShowEmployeeView = !isAdmin || (isAdmin && viewAsEmployee);
  
  return (
    <Switch>
      <Route path="/auth">
        {/* If already authenticated and no password reset needed, redirect to dashboard */}
        {shouldShowEmployeeView ? <EmployeeDashboard /> : <AdminDashboard />}
      </Route>
      <Route path="/profile" component={UserProfile} />
      <Route path="/emergency-recovery" component={EmergencyRecoveryPage} />
      <Route path="/time-tracking" component={EmployeeDashboard} />
      <Route path="/admin">
        {isAdmin ? <AdminDashboard /> : <EmployeeDashboard />}
      </Route>
      <Route path="/">
        {shouldShowEmployeeView ? <EmployeeDashboard /> : <AdminDashboard />}
      </Route>
      <Route path="*" component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ViewToggleProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ViewToggleProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
