import { useEffect, useState } from "react";
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
import { Users, Clock, DollarSign, Calendar, ListTodo, FileText, Link2 } from "lucide-react";

type AdminTab = "employees" | "payroll" | "tasks" | "reports" | "integrations";

const tabs: { id: AdminTab; label: string; icon: React.ElementType }[] = [
  { id: "employees", label: "Employees", icon: Users },
  { id: "payroll", label: "Payroll", icon: DollarSign },
  { id: "tasks", label: "Tasks", icon: ListTodo },
  { id: "reports", label: "Reports", icon: FileText },
  { id: "integrations", label: "Integrations", icon: Link2 },
];

export default function AdminDashboard() {
  const { toast } = useToast();
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>("employees");

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

  const { data: stats, isLoading: statsLoading } = useQuery<any>({
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

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Stats Cards - compact row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
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
            title="Days Remaining"
            value={statsLoading ? "..." : stats?.daysRemaining?.toString() || "0"}
            icon={Calendar}
            iconColor="text-foreground"
            iconBg="bg-muted"
          />
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-border mb-6">
          <nav className="flex space-x-1 overflow-x-auto" aria-label="Admin sections">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    isActive
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === "employees" && <EmployeeManagement />}
          {activeTab === "payroll" && <PayrollManagement />}
          {activeTab === "tasks" && <TaskManagement />}
          {activeTab === "reports" && <MonthlyReport />}
          {activeTab === "integrations" && (
            <div className="space-y-6">
              <QuickBooksIntegration />
              <BackupControls />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
