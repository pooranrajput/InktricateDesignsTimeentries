import { useState } from "react";
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
    queryFn: () => fetch(`/api/reports/monthly?year=${selectedYear}&month=${selectedMonth}`).then(res => res.json()),
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
    // This would typically trigger a download
    // For now, we'll just show a toast
    console.log(`Exporting ${format} report for ${getMonthName(selectedMonth)} ${selectedYear}`);
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
      <CardHeader className="border-b border-slate-200 p-4 sm:p-6">
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div>
            <CardTitle className="text-lg sm:text-xl font-semibold text-slate-900">Monthly Payroll Report</CardTitle>
            <p className="text-slate-600 text-sm">Generate and export monthly payroll calculations</p>
          </div>
          <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3">
            <select 
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary w-full sm:w-auto"
              value={`${selectedYear}-${selectedMonth.toString().padStart(2, '0')}`}
              onChange={(e) => {
                const [year, month] = e.target.value.split('-');
                setSelectedYear(parseInt(year));
                setSelectedMonth(parseInt(month));
              }}
            >
              <option value={`${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}`}>
                {getMonthName(currentDate.getMonth() + 1)} {currentDate.getFullYear()}
              </option>
              <option value={`${currentDate.getFullYear()}-${currentDate.getMonth().toString().padStart(2, '0')}`}>
                {getMonthName(currentDate.getMonth())} {currentDate.getFullYear()}
              </option>
            </select>
            <div className="flex space-x-2">
              <Button 
                onClick={() => handleExport('excel')}
                className="bg-accent hover:bg-accent/90 flex-1 sm:flex-none"
                size="sm"
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Export </span>Excel
              </Button>
              <Button 
                onClick={() => handleExport('pdf')}
                className="bg-red-500 hover:bg-red-600 flex-1 sm:flex-none"
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
        <div className="bg-slate-50 rounded-lg p-4 sm:p-6 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <div className="text-center">
              <p className="text-sm font-medium text-slate-600">Total Hours</p>
              <p className="text-3xl font-bold text-slate-900">
                {reportData?.totalHours?.toFixed(1) || '0.0'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-slate-600">Total Payroll</p>
              <p className="text-3xl font-bold text-green-600">
                ${reportData?.totalPayroll?.toFixed(2) || '0.00'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-slate-600">Average Hours/Employee</p>
              <p className="text-3xl font-bold text-slate-900">
                {reportData?.employeeReports?.length ? 
                  (reportData.totalHours / reportData.employeeReports.length).toFixed(0) : '0'}
              </p>
            </div>
          </div>
        </div>
        
        {/* Employee Report - Mobile Cards */}
        <div className="block sm:hidden space-y-4 mb-6">
          {reportData?.employeeReports?.map((report: any) => (
            <div key={report.user.id} className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                    <span className="text-black text-sm font-medium">
                      {getInitials(report.user.firstName, report.user.lastName, report.user.email)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 text-sm">{getDisplayName(report.user)}</p>
                    <p className="text-xs text-slate-500">{report.user.email}</p>
                  </div>
                </div>
                <Badge className={report.totalHours > 0 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                  {report.totalHours > 0 ? 'Ready' : 'Pending'}
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center pt-3 border-t border-gray-100">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Hours</p>
                  <p className="font-semibold text-slate-900">{report.totalHours.toFixed(1)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Rate</p>
                  <p className="font-semibold text-slate-900">${parseFloat(report.user.hourlyRate || '0').toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Gross Pay</p>
                  <p className="font-semibold text-green-600">${report.grossPay.toFixed(2)}</p>
                </div>
              </div>
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
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Total Hours</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Hourly Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Gross Pay</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {reportData?.employeeReports?.map((report: any) => (
                <tr key={report.user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center mr-3">
                        <span className="text-primary-600 text-sm font-medium">
                          {getInitials(report.user.firstName, report.user.lastName, report.user.email)}
                        </span>
                      </div>
                      <div className="text-sm font-medium text-slate-900">
                        {getDisplayName(report.user)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                    {report.totalHours.toFixed(1)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                    ${parseFloat(report.user.hourlyRate || '0').toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
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
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
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
