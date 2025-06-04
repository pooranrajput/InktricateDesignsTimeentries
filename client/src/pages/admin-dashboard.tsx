import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useAuth } from "@/hooks/useAuth";
import NavigationHeader from "@/components/navigation-header";
import StatsCard from "@/components/ui/stats-card";
import EmployeeManagement from "@/components/admin/employee-management";
import MonthlyReport from "@/components/admin/monthly-report";
import { Users, Clock, DollarSign, Calendar } from "lucide-react";

export default function AdminDashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/stats/dashboard"],
    retry: false,
  });

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <NavigationHeader />
      
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Admin Dashboard</h2>
              <p className="text-sm sm:text-base text-slate-600">Manage your team and track monthly hours</p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
            <StatsCard
              title="Total Employees"
              value={statsLoading ? "..." : stats?.totalEmployees?.toString() || "0"}
              icon={Users}
              iconColor="text-primary-600"
              iconBg="bg-primary-100"
            />
            
            <StatsCard
              title="Hours This Month"
              value={statsLoading ? "..." : stats?.monthlyHours?.toLocaleString() || "0"}
              icon={Clock}
              iconColor="text-accent-600"
              iconBg="bg-accent-100"
            />
            
            <StatsCard
              title="Monthly Payroll"
              value={statsLoading ? "..." : `$${stats?.monthlyPayroll?.toLocaleString() || "0"}`}
              icon={DollarSign}
              iconColor="text-green-600"
              iconBg="bg-green-100"
            />
            
            <StatsCard
              title="Days Remaining"
              value={statsLoading ? "..." : stats?.daysRemaining?.toString() || "0"}
              icon={Calendar}
              iconColor="text-purple-600"
              iconBg="bg-purple-100"
            />
          </div>
        </div>

        {/* Employee Management */}
        <EmployeeManagement />

        {/* Monthly Report */}
        <MonthlyReport />
      </div>
    </div>
  );
}
