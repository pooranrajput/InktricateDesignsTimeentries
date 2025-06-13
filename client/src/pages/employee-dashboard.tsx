import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import NavigationHeader from "@/components/navigation-header";
import TimeEntryForm from "@/components/employee/time-entry-form";
import TimeEntriesList from "@/components/employee/time-entries-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Calendar, TrendingUp } from "lucide-react";

export default function EmployeeDashboard() {
  const { toast } = useToast();
  const { user, isLoading } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

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

  // Calculate date range for current month
  const startDate = new Date(selectedYear, selectedMonth - 1, 1);
  const endDate = new Date(selectedYear, selectedMonth, 0);
  
  const { data: timeEntries = [], isLoading: entriesLoading, refetch } = useQuery({
    queryKey: ["/api/time-entries", { 
      startDate: startDate.toISOString().split('T')[0], 
      endDate: endDate.toISOString().split('T')[0] 
    }],
    retry: false,
  });

  // Calculate monthly stats with proper task-specific rates
  const timeEntriesArray = Array.isArray(timeEntries) ? timeEntries : [];
  const monthlyHours = timeEntriesArray.reduce((sum: number, entry: any) => 
    sum + parseFloat(entry.totalHours || '0'), 0
  );
  
  // Calculate pay considering task-specific rates
  const estimatedPay = timeEntriesArray.reduce((sum: number, entry: any) => {
    const hours = parseFloat(entry.totalHours || '0');
    let rate = parseFloat(user?.hourlyRate || '0'); // Default rate
    
    // Check if this is Production work (special $15/hour rate)
    if (entry.project?.toLowerCase() === 'production') {
      rate = 15;
    }
    
    return sum + (hours * rate);
  }, 0);
  const workingDays = timeEntriesArray.length;

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
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Time Tracking</h2>
              <p className="text-muted-foreground">Record your daily work hours</p>
            </div>
            
            <div className="flex items-center space-x-3">
              <select 
                className="border border-border bg-input text-foreground rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                value={`${selectedYear}-${selectedMonth.toString().padStart(2, '0')}`}
                onChange={(e) => {
                  const [year, month] = e.target.value.split('-');
                  setSelectedYear(parseInt(year));
                  setSelectedMonth(parseInt(month));
                }}
              >
                <option value={`${new Date().getFullYear()}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}`}>
                  Current Month
                </option>
                <option value={`${new Date().getFullYear()}-${new Date().getMonth().toString().padStart(2, '0')}`}>
                  Previous Month
                </option>
              </select>
            </div>
          </div>

          {/* Monthly Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <Clock className="w-5 h-5 text-primary-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-slate-600">Total Hours</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {entriesLoading ? "..." : monthlyHours.toFixed(1)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-slate-600">Estimated Pay</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {entriesLoading ? "..." : `$${estimatedPay.toFixed(2)}`}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-accent-100 rounded-lg">
                    <Calendar className="w-5 h-5 text-accent-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-slate-600">Working Days</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {entriesLoading ? "..." : workingDays}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Time Entry Section */}
        <Card className="border-0 shadow-sm mb-8">
          <CardHeader className="border-b border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-slate-900">Time Entry</CardTitle>
                <p className="text-slate-600 text-sm">Log your daily work hours</p>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <TimeEntryForm onSuccess={refetch} />
              <TimeEntriesList 
                timeEntries={timeEntriesArray} 
                isLoading={entriesLoading}
                onUpdate={refetch}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
