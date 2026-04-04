import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import NavigationHeader from "@/components/navigation-header";
import StatsCard from "@/components/ui/stats-card";
import EmployeeManagement from "@/components/admin/employee-management";
import MonthlyReport from "@/components/admin/monthly-report";
import TaskManagement from "@/components/admin/task-management";
import PayrollManagement from "@/components/admin/payroll-management";
import QuickBooksIntegration from "@/components/admin/quickbooks-integration";
import { BackupControls } from "@/components/admin/backup-controls";
import Footer from "@/components/footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Clock, DollarSign, Calendar, CreditCard, UserCog, Settings, ListChecks } from "lucide-react";

export default function AdminDashboard() {
  const { toast } = useToast();
  const { user, isLoading } = useAuth();

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
        {/* Header + Stats */}
        <div className="mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">Admin Dashboard</h2>
          <p className="text-sm text-muted-foreground mb-4">Manage your team and track monthly hours</p>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatsCard
              title="Employees"
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
              title="Days Left"
              value={statsLoading ? "..." : stats?.daysRemaining?.toString() || "0"}
              icon={Calendar}
              iconColor="text-foreground"
              iconBg="bg-muted"
            />
          </div>
        </div>

        {/* Tabbed Content */}
        <Tabs defaultValue="payroll" className="space-y-4">
          <TabsList className="w-full justify-start overflow-x-auto flex-nowrap">
            <TabsTrigger value="payroll" className="flex items-center gap-1.5">
              <CreditCard className="w-4 h-4" />
              <span className="hidden sm:inline">Payroll</span>
            </TabsTrigger>
            <TabsTrigger value="employees" className="flex items-center gap-1.5">
              <UserCog className="w-4 h-4" />
              <span className="hidden sm:inline">Employees</span>
            </TabsTrigger>
            <TabsTrigger value="tasks" className="flex items-center gap-1.5">
              <ListChecks className="w-4 h-4" />
              <span className="hidden sm:inline">Tasks</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-1.5">
              <DollarSign className="w-4 h-4" />
              <span className="hidden sm:inline">Reports</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-1.5">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="payroll">
            <PayrollManagement />
          </TabsContent>

          <TabsContent value="employees">
            <EmployeeManagement />
          </TabsContent>

          <TabsContent value="tasks">
            <TaskManagement />
          </TabsContent>

          <TabsContent value="reports">
            <MonthlyReport />
          </TabsContent>

          <TabsContent value="settings">
            <div className="space-y-6">
              <QuickBooksIntegration />
              <BackupControls />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
}
