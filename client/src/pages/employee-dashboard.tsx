import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import NavigationHeader from "@/components/navigation-header";
import TimeEntryForm from "@/components/employee/time-entry-form";
import TimeEntriesList from "@/components/employee/time-entries-list";
import Footer from "@/components/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Calendar, TrendingUp } from "lucide-react";

export default function EmployeeDashboard() {
  const { toast } = useToast();
  const { user, isLoading } = useAuth();
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  useEffect(() => {
    if (!isLoading && !user) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Please log in again...",
        variant: "destructive",
      });
      setTimeout(() => { window.location.href = "/auth"; }, 500);
    }
  }, [user, isLoading, toast]);

  const { data: timeEntries = [], isLoading: entriesLoading, refetch } = useQuery({
    queryKey: ["/api/time-entries", selectedYear, selectedMonth],
    queryFn: async () => {
      const start = new Date(selectedYear, selectedMonth - 1, 1);
      const end = new Date(selectedYear, selectedMonth, 0);
      const params = new URLSearchParams({
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0]
      });
      const response = await fetch(`/api/time-entries?${params}`);
      if (!response.ok) throw new Error('Failed to fetch time entries');
      return response.json();
    },
    retry: false,
  });

  const { data: paySummary } = useQuery({
    queryKey: ["/api/my-pay-summary", selectedYear, selectedMonth],
    queryFn: async () => {
      const response = await fetch(`/api/my-pay-summary?year=${selectedYear}&month=${selectedMonth}`);
      if (!response.ok) throw new Error('Failed to fetch pay summary');
      return response.json();
    },
    retry: false,
  });

  const timeEntriesArray = Array.isArray(timeEntries) ? timeEntries : [];
  const monthlyHours = paySummary?.totalHours ?? timeEntriesArray.reduce((sum: number, entry: any) =>
    sum + parseFloat(entry.totalHours || '0'), 0
  );
  const estimatedPay = paySummary?.estimatedPay ?? 0;
  const taskBreakdown = paySummary?.taskBreakdown ?? [];
  const workingDays = new Set(timeEntriesArray.map((entry: any) => entry.date)).size;

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <div>
            <h2 className="text-xl font-bold text-foreground">Time Tracking</h2>
            <p className="text-sm text-muted-foreground">Hi {user.firstName || 'there'}, log your hours below</p>
          </div>
          <select
            className="w-full sm:w-auto border border-border bg-input text-foreground rounded-lg px-3 py-2 text-sm"
            value={`${selectedYear}-${selectedMonth.toString().padStart(2, '0')}`}
            onChange={(e) => {
              const [year, month] = e.target.value.split('-');
              setSelectedYear(parseInt(year));
              setSelectedMonth(parseInt(month));
            }}
          >
            {(() => {
              const options = [];
              const now = new Date();
              for (let i = -3; i <= 24; i++) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const val = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
                const label = d.toLocaleString('default', { month: 'long', year: 'numeric' });
                options.push(<option key={val} value={val}>{label}</option>);
              }
              return options;
            })()}
          </select>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-muted rounded-lg">
                <Clock className="w-4 h-4 text-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Hours</p>
                <p className="text-lg font-bold text-foreground">
                  {entriesLoading ? "..." : monthlyHours.toFixed(1)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-muted rounded-lg">
                <TrendingUp className="w-4 h-4 text-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Est. Pay</p>
                <p className="text-lg font-bold text-foreground">
                  {entriesLoading ? "..." : `$${estimatedPay.toFixed(2)}`}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-muted rounded-lg">
                <Calendar className="w-4 h-4 text-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Days</p>
                <p className="text-lg font-bold text-foreground">
                  {entriesLoading ? "..." : workingDays}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Task breakdown - shows where the pay comes from */}
        {taskBreakdown.length > 0 && (
          <Card className="border-0 shadow-sm mb-5">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">Pay Breakdown</p>
              <div className="space-y-1">
                {taskBreakdown.map((task: any, i: number) => (
                  <div key={i} className="flex justify-between items-center text-sm">
                    <span className="text-foreground capitalize">{task.taskName}</span>
                    <span className="text-muted-foreground">
                      {task.hours.toFixed(1)}h x ${task.rate.toFixed(2)} = <span className="text-foreground font-medium">${task.pay.toFixed(2)}</span>
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Time entry form + list */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <TimeEntryForm onSuccess={refetch} />
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <TimeEntriesList
                timeEntries={timeEntriesArray}
                isLoading={entriesLoading}
                onUpdate={refetch}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
}
