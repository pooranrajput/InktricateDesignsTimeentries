import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle, DollarSign, Clock, Calendar, Eye, AlertCircle } from "lucide-react";

export default function PayrollManagement() {
  const { toast } = useToast();
  const [viewingPayroll, setViewingPayroll] = useState<any>(null);
  const [confirmingPayment, setConfirmingPayment] = useState<any>(null);

  // Get current month/year for payroll period
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  // Fetch monthly payroll data
  const { data: payrollData = [], isLoading } = useQuery({
    queryKey: ["/api/payroll", currentYear, currentMonth],
    retry: false,
  });

  // Mark employee as paid mutation
  const markAsPaidMutation = useMutation({
    mutationFn: async (payrollId: number) => {
      await apiRequest("PATCH", `/api/payroll/${payrollId}/paid`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payroll"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reports/monthly"] });
      setConfirmingPayment(null);
      toast({
        title: "Payment Processed",
        description: "Employee has been marked as paid and notified via email",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Generate payroll records mutation
  const generatePayrollMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/payroll/generate", { year: currentYear, month: currentMonth });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payroll"] });
      toast({
        title: "Payroll Generated",
        description: "Monthly payroll records have been created",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getMonthName = (month: number) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                   'July', 'August', 'September', 'October', 'November', 'December'];
    return months[month - 1];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const handleConfirmPayment = () => {
    if (confirmingPayment) {
      markAsPaidMutation.mutate(confirmingPayment.id);
    }
  };

  if (isLoading) {
    return (
      <Card className="border-0 shadow-sm mb-6 sm:mb-8">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-slate-200 rounded w-1/4"></div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-slate-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm mb-6 sm:mb-8">
      <CardHeader className="border-b border-slate-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg sm:text-xl font-semibold text-slate-900">
              Payroll Management - {getMonthName(currentMonth)} {currentYear}
            </CardTitle>
            <p className="text-slate-600 text-sm">Review and process employee payments</p>
          </div>
          {payrollData.length === 0 && (
            <Button 
              onClick={() => generatePayrollMutation.mutate()}
              disabled={generatePayrollMutation.isPending}
              className="bg-primary hover:bg-primary/90"
            >
              <Calendar className="w-4 h-4 mr-2" />
              {generatePayrollMutation.isPending ? "Generating..." : "Generate Payroll"}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6">
        {payrollData.length === 0 ? (
          <div className="text-center py-12">
            <DollarSign className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No payroll records yet</h3>
            <p className="text-slate-600 mb-4">
              Generate payroll records for {getMonthName(currentMonth)} {currentYear} to start processing payments.
            </p>
            <Button 
              onClick={() => generatePayrollMutation.mutate()}
              disabled={generatePayrollMutation.isPending}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Generate Payroll
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {payrollData.map((record: any) => (
              <div key={record.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-primary-600 font-medium text-sm">
                        {record.user?.firstName?.charAt(0) || record.user?.email?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-900">
                        {record.user?.firstName && record.user?.lastName 
                          ? `${record.user.firstName} ${record.user.lastName}`
                          : record.user?.email || 'Unknown Employee'
                        }
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-slate-600">
                        <span className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {record.totalHours} hours
                        </span>
                        <span className="flex items-center">
                          <DollarSign className="w-3 h-3 mr-1" />
                          ${parseFloat(record.grossPay).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Badge className={getStatusColor(record.status)}>
                      {record.status === 'paid' ? 'Paid' : 'Pending'}
                    </Badge>
                    
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setViewingPayroll(record)}
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      View
                    </Button>
                    
                    {record.status === 'pending' && (
                      <Button 
                        size="sm"
                        onClick={() => setConfirmingPayment(record)}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Mark Paid
                      </Button>
                    )}
                  </div>
                </div>
                
                {record.paidAt && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <p className="text-xs text-slate-500">
                      Paid on {new Date(record.paidAt).toLocaleDateString()} 
                      {record.paidByUser && ` by ${record.paidByUser.firstName} ${record.paidByUser.lastName}`}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* View Payroll Details Dialog */}
      <Dialog open={!!viewingPayroll} onOpenChange={() => setViewingPayroll(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Payroll Details - {viewingPayroll?.user?.firstName} {viewingPayroll?.user?.lastName}
            </DialogTitle>
          </DialogHeader>
          {viewingPayroll && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-900">Period</p>
                  <p className="text-sm text-slate-600">
                    {getMonthName(viewingPayroll.month)} {viewingPayroll.year}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Total Hours</p>
                  <p className="text-sm text-slate-600">{viewingPayroll.totalHours} hours</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Gross Pay</p>
                  <p className="text-sm text-slate-600">${parseFloat(viewingPayroll.grossPay).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Status</p>
                  <Badge className={getStatusColor(viewingPayroll.status)}>
                    {viewingPayroll.status === 'paid' ? 'Paid' : 'Pending'}
                  </Badge>
                </div>
              </div>
              
              {viewingPayroll.status === 'pending' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-800">Payment Pending</h4>
                      <p className="text-sm text-yellow-700">
                        Click "Mark Paid" after processing payment through your banking portal.
                        This will send an email notification to the employee.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setViewingPayroll(null)}>
                  Close
                </Button>
                {viewingPayroll.status === 'pending' && (
                  <Button 
                    onClick={() => {
                      setViewingPayroll(null);
                      setConfirmingPayment(viewingPayroll);
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark as Paid
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm Payment Dialog */}
      <Dialog open={!!confirmingPayment} onOpenChange={() => setConfirmingPayment(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Are you sure you want to mark{" "}
              <span className="font-medium">
                {confirmingPayment?.user?.firstName} {confirmingPayment?.user?.lastName}
              </span>{" "}
              as paid for {getMonthName(confirmingPayment?.month)} {confirmingPayment?.year}?
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-800">Payment Amount</h4>
                  <p className="text-sm text-blue-700">
                    ${parseFloat(confirmingPayment?.grossPay || 0).toFixed(2)} for {confirmingPayment?.totalHours} hours
                  </p>
                </div>
              </div>
            </div>
            
            <p className="text-xs text-slate-500">
              This will send an email notification to the employee confirming their payment.
            </p>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setConfirmingPayment(null)}>
                Cancel
              </Button>
              <Button 
                onClick={handleConfirmPayment}
                disabled={markAsPaidMutation.isPending}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {markAsPaidMutation.isPending ? "Processing..." : "Confirm Payment"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}