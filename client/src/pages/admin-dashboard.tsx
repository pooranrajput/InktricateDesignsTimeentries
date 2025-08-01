import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useAuth } from "@/hooks/use-auth";
import NavigationHeader from "@/components/navigation-header";
import StatsCard from "@/components/ui/stats-card";
import EmployeeManagement from "@/components/admin/employee-management";
import MonthlyReport from "@/components/admin/monthly-report";
import TaskManagement from "@/components/admin/task-management";
import PayrollManagement from "@/components/admin/payroll-management";

import { BackupControls } from "@/components/admin/backup-controls";
import Footer from "@/components/footer";
import { Users, Clock, DollarSign, Calendar } from "lucide-react";

export default function AdminDashboard() {
  const { toast } = useToast();
  const { user, isLoading } = useAuth();

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Please log in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/auth";
      }, 500);
      return;
    }
  }, [user, isLoading, toast]);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/stats/dashboard"],
    retry: false,
  });

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader />
      
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">Admin Dashboard</h2>
              <p className="text-sm sm:text-base text-muted-foreground">Manage your team and track monthly hours</p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
            <StatsCard
              title="Total Employees"
              value={statsLoading ? "..." : stats?.totalEmployees?.toString() || "0"}
              icon={Users}
              iconColor="text-foreground"
              iconBg="bg-muted"
            />
            
            <StatsCard
              title="Hours This Month"
              value={statsLoading ? "..." : stats?.monthlyHours?.toLocaleString() || "0"}
              icon={Clock}
              iconColor="text-foreground"
              iconBg="bg-muted"
            />
            
            <StatsCard
              title="Monthly Payroll"
              value={statsLoading ? "..." : `$${stats?.monthlyPayroll?.toLocaleString() || "0"}`}
              icon={DollarSign}
              iconColor="text-foreground"
              iconBg="bg-muted"
            />
            
            <StatsCard
              title="Days Remaining"
              value={statsLoading ? "..." : stats?.daysRemaining?.toString() || "0"}
              icon={Calendar}
              iconColor="text-foreground"
              iconBg="bg-muted"
            />
          </div>
        </div>

        {/* Data Protection & Backup Controls */}
        <BackupControls />

        {/* Task Management */}
        <TaskManagement />

        {/* Employee Management */}
        <EmployeeManagement />

        {/* Payroll Management */}
        <PayrollManagement />



        {/* Monthly Report */}
        <MonthlyReport />
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  );
}
