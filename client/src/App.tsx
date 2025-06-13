import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import AdminDashboard from "@/pages/admin-dashboard";
import EmployeeDashboard from "@/pages/employee-dashboard";

function Router() {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();

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

  // If user needs to reset password, redirect to auth page
  if (user.mustResetPassword && location !== "/auth") {
    return <AuthPage />;
  }

  // Authenticated routing based on role
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <Route path="/">
        {user.role === "admin" ? <AdminDashboard /> : <EmployeeDashboard />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
