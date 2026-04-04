import React from "react";
import { Switch, Route, Redirect } from "wouter";
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

function Router() {
  const { user, isLoading } = useAuth();
  const { viewAsEmployee } = useViewToggle();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <Switch>
        <Route path="/auth" component={AuthPage} />
        <Route path="*"><AuthPage /></Route>
      </Switch>
    );
  }

  if (user.mustResetPassword) {
    return <AuthPage />;
  }

  const isAdmin = user.role === "admin";
  const shouldShowEmployeeView = !isAdmin || (isAdmin && viewAsEmployee);
  const Dashboard = shouldShowEmployeeView ? EmployeeDashboard : AdminDashboard;

  return (
    <Switch>
      <Route path="/auth"><Redirect to="/" /></Route>
      <Route path="/profile" component={UserProfile} />
      <Route path="/time-tracking" component={EmployeeDashboard} />
      <Route path="/admin">
        {isAdmin ? <AdminDashboard /> : <EmployeeDashboard />}
      </Route>
      <Route path="/" component={Dashboard} />
      <Route component={NotFound} />
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
