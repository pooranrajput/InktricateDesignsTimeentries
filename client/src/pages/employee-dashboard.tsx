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
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  
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

  // Reset to current month when component mounts or when month changes naturally
  useEffect(() => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    // Auto-update to current month if we're viewing a past month and it's a new month
    if (selectedYear < currentYear || (selectedYear === currentYear && selectedMonth < currentMonth)) {
      setSelectedMonth(currentMonth);
      setSelectedYear(currentYear);
    }
  }, [selectedMonth, selectedYear]);

  // Calculate date range for current month
  const startDate = new Date(selectedYear, selectedMonth - 1, 1);
  const endDate = new Date(selectedYear, selectedMonth, 0);
  
  const { data: timeEntries = [], isLoading: entriesLoading, refetch } = useQuery({
    queryKey: ["/api/time-entries", selectedYear, selectedMonth],
    queryFn: async () => {
      const currentStartDate = new Date(selectedYear, selectedMonth - 1, 1);
      const currentEndDate = new Date(selectedYear, selectedMonth, 0);
      const params = new URLSearchParams({
        startDate: currentStartDate.toISOString().split('T')[0],
        endDate: currentEndDate.toISOString().split('T')[0]
      });
      const response = await fetch(`/api/time-entries?${params}`);
      if (!response.ok) throw new Error('Failed to fetch time entries');
      return response.json();
    },
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
    const userRate = user?.hourlyRate;
    let rate = parseFloat(typeof userRate === 'string' ? userRate : (userRate?.toString() || '0')); // Default rate
    
    // Check if this is Production work (special $15/hour rate)
    if (entry.project?.toLowerCase() === 'production') {
      rate = 15;
    }
    
    return sum + (hours * rate);
  }, 0);
  const workingDays = timeEntriesArray.length;

  // Debug logging
  console.log('Current state:', { 
    selectedYear, 
    selectedMonth, 
    timeEntries: timeEntries?.length,
    monthlyHours,
    estimatedPay,
    workingDays 
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
                  console.log('Dropdown changed to:', e.target.value);
                  const [year, month] = e.target.value.split('-');
                  console.log('Setting year:', year, 'month:', month);
                  setSelectedYear(parseInt(year));
                  setSelectedMonth(parseInt(month));
                }}
              >
                <option value="2025-07">Current Month (July)</option>
                <option value="2025-06">Previous Month (June)</option>
              </select>
            </div>
          </div>

          {/* Monthly Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-muted rounded-lg">
                    <Clock className="w-5 h-5 text-foreground" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Total Hours</p>
                    <p className="text-2xl font-bold text-foreground">
                      {entriesLoading ? "..." : monthlyHours.toFixed(1)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-muted rounded-lg">
                    <TrendingUp className="w-5 h-5 text-foreground" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Estimated Pay</p>
                    <p className="text-2xl font-bold text-foreground">
                      {entriesLoading ? "..." : `$${estimatedPay.toFixed(2)}`}
                    </p>
                    {user?.username === 'rhea' && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Production: $15/hr • Other: ${user.hourlyRate}/hr
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-muted rounded-lg">
                    <Calendar className="w-5 h-5 text-foreground" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Working Days</p>
                    <p className="text-2xl font-bold text-foreground">
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
          <CardHeader className="border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-foreground">Time Entry</CardTitle>
                <p className="text-muted-foreground text-sm">Log your daily work hours</p>
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
