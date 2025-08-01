import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileSpreadsheet, FileText, Download } from "lucide-react";

export default function MonthlyReport() {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);

  const { data: reportData, isLoading } = useQuery({
    queryKey: ["/api/reports/monthly", { year: selectedYear, month: selectedMonth }],
    queryFn: async () => {
      console.log(`🔍 Fetching monthly report for ${selectedYear}-${selectedMonth}`);
      const response = await fetch(`/api/reports/monthly?year=${selectedYear}&month=${selectedMonth}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        console.error(`❌ Monthly report fetch failed: ${response.status} ${response.statusText}`);
        if (response.status === 401) {
          window.location.href = '/login';
          return null;
        }
        throw new Error(`Failed to fetch monthly report: ${response.status}`);
      }
      const data = await response.json();
      console.log(`📊 Monthly report data received:`, data);
      return data;
    },
    retry: false,
  });

  const getInitials = (firstName?: string | null, lastName?: string | null, email?: string | null) => {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || email?.charAt(0).toUpperCase() || 'U';
  };

  const getDisplayName = (user: any) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.email || 'Unknown';
  };

  const getMonthName = (month: number) => {
    return new Date(2024, month - 1).toLocaleString('default', { month: 'long' });
  };

  const handleExport = (format: 'excel' | 'pdf') => {
    if (!reportData || !reportData.employeeReports?.length) {
      console.log('No data available for export');
      return;
    }

    const filename = `payroll-report-${selectedYear}-${selectedMonth.toString().padStart(2, '0')}`;
    
    if (format === 'excel') {
      exportToCSV(reportData, filename);
    } else {
      exportToPDF(reportData, filename, selectedMonth, selectedYear);
    }
  };

  const exportToCSV = (data: any, filename: string) => {
    const headers = ['Employee Name', 'Email', 'Total Hours', 'Hourly Rate', 'Gross Pay', 'Status'];
    const csvContent = [
      headers.join(','),
      ...data.employeeReports.map((report: any) => [
        `"${getDisplayName(report.user)}"`,
        `"${report.user.email}"`,
        report.totalHours.toFixed(1),
        `$${parseFloat(report.user.hourlyRate || '0').toFixed(2)}`,
        `$${report.grossPay.toFixed(2)}`,
        report.totalHours > 0 ? 'Ready' : 'Pending'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.csv`;
    link.click();
  };

  const exportToPDF = (data: any, filename: string, month: number, year: number) => {
    const content = `
INKTRICATE DESIGNS
Monthly Payroll Report - ${getMonthName(month)} ${year}

Summary:
Total Hours: ${data.totalHours?.toFixed(1) || '0.0'}
Total Payroll: $${data.totalPayroll?.toFixed(2) || '0.00'}
Employees: ${data.employeeReports?.length || 0}

Employee Details:
${data.employeeReports?.map((report: any) => 
  `${getDisplayName(report.user)} (${report.user.email})
   Hours: ${report.totalHours.toFixed(1)} | Rate: $${parseFloat(report.user.hourlyRate || '0').toFixed(2)}/hr | Pay: $${report.grossPay.toFixed(2)}
   Status: ${report.totalHours > 0 ? 'Ready' : 'Pending'}
`).join('\n') || 'No employee data'}

Generated on: ${new Date().toLocaleDateString()}
    `.trim();

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.txt`;
    link.click();
  };

  if (isLoading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-slate-200 rounded w-1/3"></div>
            <div className="h-32 bg-slate-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="border-b border-border p-4 sm:p-6">
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div>
            <CardTitle className="text-lg sm:text-xl font-semibold text-foreground">Monthly Payroll Report</CardTitle>
            <p className="text-muted-foreground text-sm">Generate and export monthly payroll calculations</p>
          </div>
          <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3">
            <select 
              className="border border-border bg-background text-foreground rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary w-full sm:w-auto"
              value={`${selectedYear}-${selectedMonth.toString().padStart(2, '0')}`}
              onChange={(e) => {
                const [year, month] = e.target.value.split('-');
                setSelectedYear(parseInt(year));
                setSelectedMonth(parseInt(month));
              }}
            >
              {/* Show all months with timesheet data (July-December 2025) */}
              <option value="2025-07">July 2025</option>
              <option value="2025-08">August 2025</option>
              <option value="2025-09">September 2025</option>
              <option value="2025-10">October 2025</option>
              <option value="2025-11">November 2025</option>
              <option value="2025-12">December 2025</option>
              {/* Current month if different */}
              {currentDate.getFullYear() === 2025 && currentDate.getMonth() + 1 < 7 && (
                <option value={`${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}`}>
                  {getMonthName(currentDate.getMonth() + 1)} {currentDate.getFullYear()}
                </option>
              )}
            </select>
            <div className="flex space-x-2">
              <Button 
                onClick={() => handleExport('excel')}
                className="bg-foreground text-background hover:bg-foreground/90 flex-1 sm:flex-none"
                size="sm"
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Export </span>Excel
              </Button>
              <Button 
                onClick={() => handleExport('pdf')}
                className="bg-muted text-foreground hover:bg-muted/90 flex-1 sm:flex-none"
                size="sm"
              >
                <FileText className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Export </span>PDF
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 sm:p-6">
        {/* Summary Stats */}
        <div className="bg-muted rounded-lg p-4 sm:p-6 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">Total Hours</p>
              <p className="text-3xl font-bold text-foreground">
                {reportData?.totalHours?.toFixed(1) || '0.0'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">Total Payroll</p>
              <p className="text-3xl font-bold text-foreground">
                ${reportData?.totalPayroll?.toFixed(2) || '0.00'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">Average Hours/Employee</p>
              <p className="text-3xl font-bold text-foreground">
                {reportData?.employeeReports?.length ? 
                  (reportData.totalHours / reportData.employeeReports.length).toFixed(0) : '0'}
              </p>
            </div>
          </div>
        </div>
        
        {/* Employee Report - Mobile Cards */}
        <div className="block sm:hidden space-y-4 mb-6">
          {reportData?.employeeReports?.map((report: any) => (
            <div key={report.user.id} className="bg-background border border-border rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mr-3">
                    <span className="text-foreground text-sm font-medium">
                      {getInitials(report.user.firstName, report.user.lastName, report.user.email)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">{getDisplayName(report.user)}</p>
                    <p className="text-xs text-muted-foreground">{report.user.email}</p>
                  </div>
                </div>
                <Badge className={report.totalHours > 0 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                  {report.totalHours > 0 ? 'Ready' : 'Pending'}
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center pt-3 border-t border-border">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Hours</p>
                  <p className="font-semibold text-foreground">{report.totalHours.toFixed(1)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Base Rate</p>
                  <p className="font-semibold text-foreground">${parseFloat(report.user.hourlyRate || '0').toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Gross Pay</p>
                  <p className="font-semibold text-green-600">${report.grossPay.toFixed(2)}</p>
                </div>
              </div>
              
              {/* Task-specific rate breakdown */}
              {report.taskBreakdown && report.taskBreakdown.length > 0 && (
                <div className="mt-4 pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-2">Task Rate Breakdown:</p>
                  <div className="space-y-1">
                    {report.taskBreakdown.map((task: any, index: number) => (
                      <div key={index} className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground capitalize">{task.taskName}</span>
                        <span className="text-foreground">
                          {task.hours.toFixed(1)}h @ ${task.rate.toFixed(2)} = ${task.pay.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )) || (
            <div className="text-center py-8 text-slate-500">
              No payroll data available for {getMonthName(selectedMonth)} {selectedYear}
            </div>
          )}
        </div>

        {/* Employee Report Table - Desktop */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Hours</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Hourly Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Gross Pay</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-background divide-y divide-border">
              {reportData?.employeeReports?.map((report: any) => (
                <tr key={report.user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center mr-3">
                        <span className="text-foreground text-sm font-medium">
                          {getInitials(report.user.firstName, report.user.lastName, report.user.email)}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-foreground">
                          {getDisplayName(report.user)}
                        </div>
                        {/* Task-specific rate breakdown inline */}
                        {report.taskBreakdown && report.taskBreakdown.length > 0 && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {report.taskBreakdown.map((task: any, index: number) => (
                              <div key={index}>
                                {task.taskName}: {task.hours.toFixed(1)}h @ ${task.rate.toFixed(2)} = ${task.pay.toFixed(2)}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    {report.totalHours.toFixed(1)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    Base: ${parseFloat(report.user.hourlyRate || '0').toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                    ${report.grossPay.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge className={report.totalHours > 0 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                      {report.totalHours > 0 ? 'Ready' : 'Pending'}
                    </Badge>
                  </td>
                </tr>
              )) || (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    No payroll data available for {getMonthName(selectedMonth)} {selectedYear}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
