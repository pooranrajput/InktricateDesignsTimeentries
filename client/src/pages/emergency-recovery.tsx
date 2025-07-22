import { useQuery } from "@tanstack/react-query";
import { EmergencyRecovery } from "@/components/emergency-recovery";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Users, Clock, Calendar } from "lucide-react";

export function EmergencyRecoveryPage() {
  const { data: user, isLoading: userLoading } = useQuery({ queryKey: ['/api/user'] });
  const { data: taskCategories, isLoading: categoriesLoading } = useQuery({ queryKey: ['/api/task-categories'] });

  // Debug what we're getting
  console.log('Emergency Recovery Debug:', { user, taskCategories, userLoading, categoriesLoading });

  if (userLoading || categoriesLoading) {
    return <div className="p-6">Loading user and categories...</div>;
  }

  if (!user) {
    return <div className="p-6">User not found. Please log in again.</div>;
  }

  if (!taskCategories || !Array.isArray(taskCategories)) {
    return <div className="p-6">Task categories not available. Please refresh the page.</div>;
  }
  
  // Handle user properties safely
  const safeUser = {
    id: user?.id || 0,
    first_name: user?.firstName || user?.first_name || 'User',
    last_name: user?.lastName || user?.last_name || ''
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Emergency Alert Banner */}
      <Card className="border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
        <CardHeader>
          <CardTitle className="text-red-800 dark:text-red-200 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Data Recovery Emergency - Action Required
          </CardTitle>
          <CardDescription className="text-red-700 dark:text-red-300">
            Critical system issue: Employee time entries from July 1-22, 2025 were lost during database migration. 
            All employees must re-enter their work hours immediately to maintain payroll accuracy.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <Calendar className="h-4 w-4" />
              <span>Period: July 1-22, 2025</span>
            </div>
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <Clock className="h-4 w-4" />
              <span>Lost: 22 days of time data</span>
            </div>
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <Users className="h-4 w-4" />
              <span>Affects: All employees</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recovery Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Recovery Instructions</CardTitle>
          <CardDescription>
            Follow these steps to recover your lost time entries as quickly as possible
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">What You Need:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Your work schedule/calendar for July 1-22</li>
                <li>• Email timestamps for work activities</li>
                <li>• Meeting appointments or client schedules</li>
                <li>• Any personal notes about work hours</li>
                <li>• Typical daily work patterns</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Recovery Process:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Use the bulk entry form below</li>
                <li>• Enter one row per work day</li>
                <li>• Approximate hours if exact times unknown</li>
                <li>• Use "Daily work" for descriptions if needed</li>
                <li>• Save all entries at once</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Entry System */}
      <EmergencyRecovery 
        taskCategories={taskCategories} 
        currentUser={safeUser}
      />

      {/* Contact Information */}
      <Card className="bg-blue-50 dark:bg-blue-950">
        <CardContent className="pt-6">
          <div className="text-center text-sm text-blue-800 dark:text-blue-200">
            <p className="font-semibold mb-1">Need Help?</p>
            <p>Contact admin immediately if you have questions about recovering your time entries.</p>
            <p className="mt-2 text-xs text-blue-600 dark:text-blue-400">
              Priority: Complete your data entry TODAY to ensure accurate payroll processing
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}