import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Eye, Edit, Trash2, Plus, DollarSign, Key } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function EmployeeManagement() {
  const { toast } = useToast();
  const [editingRate, setEditingRate] = useState<{ userId: string; currentRate: string } | null>(null);
  const [newRate, setNewRate] = useState("");
  const [editingRole, setEditingRole] = useState<{ userId: string; currentRole: string } | null>(null);
  const [newRole, setNewRole] = useState("");
  const [viewingEmployee, setViewingEmployee] = useState<string | null>(null);
  const [timesheetMonth, setTimesheetMonth] = useState(new Date().getMonth() + 1);
  const [timesheetYear, setTimesheetYear] = useState(new Date().getFullYear());
  const [resetPasswordUserId, setResetPasswordUserId] = useState<string | null>(null);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    username: "",
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    homeAddress: "",
    inktricateStartDate: "",
    role: "employee",
    hourlyRate: "25"
  });

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ["/api/employees"],
    retry: false,
  });

  // Calculate date range for timesheet viewing
  const timesheetStartDate = new Date(timesheetYear, timesheetMonth - 1, 1);
  const timesheetEndDate = new Date(timesheetYear, timesheetMonth, 0);
  
  // Debug logging
  console.log('Timesheet params:', { timesheetYear, timesheetMonth });
  console.log('Date range:', timesheetStartDate.toISOString().split('T')[0], 'to', timesheetEndDate.toISOString().split('T')[0]);

  const { data: employeeTimeEntries = [] } = useQuery({
    queryKey: ["/api/time-entries", viewingEmployee, timesheetMonth, timesheetYear],
    queryFn: () => {
      if (!viewingEmployee) return [];
      const url = `/api/time-entries/${viewingEmployee}?startDate=${timesheetStartDate.toISOString().split('T')[0]}&endDate=${timesheetEndDate.toISOString().split('T')[0]}`;
      console.log('Fetching timesheet:', url);
      console.log('Date range:', timesheetStartDate.toISOString().split('T')[0], 'to', timesheetEndDate.toISOString().split('T')[0]);
      return fetch(url).then(res => {
        console.log('Response status:', res.status);
        return res.json();
      }).then(data => {
        console.log('Received entries:', data.length, 'entries');
        data.forEach((entry: any) => {
          console.log('Entry:', entry.date, entry.project, entry.totalHours + 'h', 'Display:', new Date(entry.date + 'T00:00:00').toLocaleDateString());
        });
        return data;
      });
    },
    enabled: !!viewingEmployee,
    retry: false,
    refetchOnMount: true,
    refetchOnWindowFocus: false
  });

  const updateRateMutation = useMutation({
    mutationFn: async ({ userId, hourlyRate }: { userId: string; hourlyRate: string }) => {
      await apiRequest("PATCH", `/api/employees/${userId}/rate`, { hourlyRate });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/dashboard"] });
      setEditingRate(null);
      setNewRate("");
      toast({
        title: "Success",
        description: "Hourly rate updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      await apiRequest("PATCH", `/api/employees/${userId}/role`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      setEditingRole(null);
      setNewRole("");
      toast({
        title: "Success",
        description: "Role updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deactivateUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest("DELETE", `/api/employees/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/dashboard"] });
      toast({
        title: "Success",
        description: "Employee deactivated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await apiRequest("POST", `/api/employees/${userId}/reset-password`);
      return await res.json();
    },
    onSuccess: (data) => {
      setResetPasswordUserId(null);
      toast({
        title: "Password Reset",
        description: `Password reset to: ${data.newPassword}. User must change on first login.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addEmployeeMutation = useMutation({
    mutationFn: async (employeeData: typeof newEmployee) => {
      const res = await apiRequest("POST", "/api/employees", employeeData);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/dashboard"] });
      setShowAddEmployee(false);
      setNewEmployee({
        username: "",
        email: "",
        firstName: "",
        lastName: "",
        phone: "",
        homeAddress: "",
        inktricateStartDate: "",
        role: "employee",
        hourlyRate: "25"
      });
      toast({
        title: "Employee Added",
        description: `Employee created with password: ${data.password}. They must change it on first login.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEditRate = (userId: string, currentRate: string) => {
    setEditingRate({ userId, currentRate });
    setNewRate(currentRate);
  };

  const handleSaveRate = () => {
    if (editingRate && newRate) {
      updateRateMutation.mutate({ 
        userId: editingRate.userId, 
        hourlyRate: newRate 
      });
    }
  };

  const handleEditRole = (userId: string, currentRole: string) => {
    setEditingRole({ userId, currentRole });
    setNewRole(currentRole);
  };

  const handleSaveRole = () => {
    if (editingRole && newRole) {
      updateRoleMutation.mutate({ 
        userId: editingRole.userId, 
        role: newRole 
      });
    }
  };

  const handleViewEmployee = (userId: string) => {
    // Force cache invalidation when opening timesheet
    queryClient.invalidateQueries({ queryKey: ["/api/time-entries"] });
    setViewingEmployee(userId);
  };

  const handleDeactivateUser = (userId: string, userName: string) => {
    if (confirm(`Are you sure you want to deactivate ${userName}?`)) {
      deactivateUserMutation.mutate(userId);
    }
  };

  const handleResetPassword = (userId: string, userName: string) => {
    if (confirm(`Reset password for ${userName}? They will need to change it on first login.`)) {
      resetPasswordMutation.mutate(userId);
    }
  };

  const handleAddEmployee = () => {
    if (newEmployee.username && newEmployee.email && newEmployee.firstName && newEmployee.lastName) {
      addEmployeeMutation.mutate(newEmployee);
    }
  };

  const getInitials = (firstName?: string | null, lastName?: string | null, email?: string | null) => {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || email?.charAt(0).toUpperCase() || 'U';
  };

  const getDisplayName = (employee: any) => {
    if (employee.firstName && employee.lastName) {
      return `${employee.firstName} ${employee.lastName}`;
    }
    return employee.email || 'Unknown';
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-foreground text-background';
      case 'employee':
        return 'bg-muted text-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (isLoading) {
    return (
      <Card className="border-0 shadow-sm mb-8">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm mb-6 sm:mb-8">
      <CardHeader className="border-b border-border p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <CardTitle className="text-lg sm:text-xl font-semibold text-foreground">Employee Management</CardTitle>
            <p className="text-muted-foreground text-sm">Manage employees, rates, and passwords</p>
          </div>
          <Button 
            onClick={() => setShowAddEmployee(true)}
            className="w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Employee
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="min-w-full inline-block align-middle">
            <table className="min-w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Employee</th>
                  <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Role</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Rate</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {(employees as any[]).map((employee: any) => (
                  <tr key={employee.id} className="hover:bg-muted/50">
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center mr-3">
                        <span className="text-primary text-sm font-medium">
                          {getInitials(employee.firstName, employee.lastName, employee.email)}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-foreground">
                          {getDisplayName(employee)}
                        </div>
                        <div className="text-sm text-muted-foreground">{employee.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge className={`${getRoleBadgeColor(employee.role)} capitalize`}>
                      {employee.role}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    <div className="flex items-center space-x-2">
                      <span>${parseFloat(employee.hourlyRate || '0').toFixed(2)}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditRate(employee.id, employee.hourlyRate || '0')}
                        className="text-muted-foreground hover:text-primary h-6 w-6 p-0"
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleViewEmployee(employee.id)}
                        className="text-primary hover:text-primary/80 border-primary/20 hover:border-primary/40"
                        title="View Timesheet"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        <span className="hidden sm:inline">View</span>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleEditRole(employee.id, employee.role)}
                        className="text-muted-foreground hover:text-foreground"
                        title="Edit Role"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleResetPassword(employee.id, getDisplayName(employee))}
                        className="text-blue-500 hover:text-blue-600"
                        title="Reset Password"
                      >
                        <Key className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDeactivateUser(employee.id, getDisplayName(employee))}
                        className="text-red-500 hover:text-red-600"
                        title="Deactivate Employee"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>

      {/* Edit Rate Dialog */}
      <Dialog open={!!editingRate} onOpenChange={() => setEditingRate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Hourly Rate</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
              <Input
                id="hourlyRate"
                type="number"
                step="0.01"
                value={newRate}
                onChange={(e) => setNewRate(e.target.value)}
                placeholder="Enter hourly rate"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setEditingRate(null)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSaveRate}
                disabled={updateRateMutation.isPending}
              >
                {updateRateMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={!!editingRole} onOpenChange={() => setEditingRole(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Employee Role</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="role">Role</Label>
              <select 
                id="role"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="employee">Employee</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setEditingRole(null)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSaveRole}
                disabled={updateRoleMutation.isPending}
              >
                {updateRoleMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Employee Dialog */}
      <Dialog open={!!viewingEmployee} onOpenChange={() => setViewingEmployee(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              Time Entries - {viewingEmployee ? getDisplayName((employees as any[]).find((emp: any) => emp.id === viewingEmployee)) : 'Employee'}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Showing work performed in {new Date(0, timesheetMonth - 1).toLocaleString('default', { month: 'long' })} {timesheetYear} only
            </p>
          </DialogHeader>
          <div className="space-y-4">
            {/* Month/Year Filter */}
            <div className="flex gap-4 items-center bg-muted/50 p-3 rounded-lg">
              <div>
                <Label htmlFor="timesheetMonth">Work Month</Label>
                <select
                  id="timesheetMonth"
                  value={timesheetMonth}
                  onChange={(e) => {
                    setTimesheetMonth(Number(e.target.value));
                    // Force fresh data when month changes
                    queryClient.invalidateQueries({ queryKey: ["/api/time-entries"] });
                  }}
                  className="ml-2 px-3 py-1 border border-border rounded-md bg-background text-foreground"
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {new Date(0, i).toLocaleString('default', { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="timesheetYear">Year</Label>
                <select
                  id="timesheetYear"
                  value={timesheetYear}
                  onChange={(e) => {
                    setTimesheetYear(Number(e.target.value));
                    // Force fresh data when year changes
                    queryClient.invalidateQueries({ queryKey: ["/api/time-entries"] });
                  }}
                  className="ml-2 px-3 py-1 border border-border rounded-md bg-background text-foreground"
                >
                  {Array.from({ length: 5 }, (_, i) => {
                    const year = new Date().getFullYear() - 2 + i;
                    return (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
            {employeeTimeEntries.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Project</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Hours</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="bg-card divide-y divide-border">
                    {employeeTimeEntries.map((entry: any) => (
                      <tr key={entry.id} className="hover:bg-muted/50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                          {new Date(entry.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                          {entry.project}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                          {entry.startTime} - {entry.endTime}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                          {entry.totalHours}
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground">
                          {entry.notes || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No time entries found for this employee in the selected month.</p>
            )}
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setViewingEmployee(null)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Employee Dialog */}
      <Dialog open={showAddEmployee} onOpenChange={setShowAddEmployee}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Employee</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={newEmployee.firstName}
                  onChange={(e) => setNewEmployee({...newEmployee, firstName: e.target.value})}
                  placeholder="First name"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={newEmployee.lastName}
                  onChange={(e) => setNewEmployee({...newEmployee, lastName: e.target.value})}
                  placeholder="Last name"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="username">Username *</Label>
              <Input
                id="username"
                value={newEmployee.username}
                onChange={(e) => setNewEmployee({...newEmployee, username: e.target.value})}
                placeholder="Username"
              />
            </div>
            
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={newEmployee.email}
                onChange={(e) => setNewEmployee({...newEmployee, email: e.target.value})}
                placeholder="Email address"
              />
            </div>
            
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={newEmployee.phone}
                onChange={(e) => setNewEmployee({...newEmployee, phone: e.target.value})}
                placeholder="Phone number"
              />
            </div>
            
            <div>
              <Label htmlFor="homeAddress">Home Address</Label>
              <Input
                id="homeAddress"
                value={newEmployee.homeAddress}
                onChange={(e) => setNewEmployee({...newEmployee, homeAddress: e.target.value})}
                placeholder="Home address"
              />
            </div>
            
            <div>
              <Label htmlFor="startDate">Inktricate Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={newEmployee.inktricateStartDate}
                onChange={(e) => setNewEmployee({...newEmployee, inktricateStartDate: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
              <Input
                id="hourlyRate"
                type="number"
                step="0.01"
                value={newEmployee.hourlyRate}
                onChange={(e) => setNewEmployee({...newEmployee, hourlyRate: e.target.value})}
                placeholder="25.00"
              />
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setShowAddEmployee(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddEmployee}
                disabled={!newEmployee.username || !newEmployee.email || !newEmployee.firstName || !newEmployee.lastName}
              >
                Add Employee
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Employee Timesheet Dialog */}
      <Dialog open={!!viewingEmployee} onOpenChange={() => setViewingEmployee(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>
              Employee Timesheet - {viewingEmployee ? getDisplayName((employees as any[]).find((emp: any) => emp.id === viewingEmployee)) : ''}
            </DialogTitle>
          </DialogHeader>
          
          {/* Month/Year Selector */}
          <div className="flex items-center space-x-3 pb-4 border-b">
            <Label htmlFor="timesheet-month" className="text-sm font-medium">View Month:</Label>
            <select 
              id="timesheet-month"
              className="border border-border bg-input text-foreground rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
              value={`${timesheetYear}-${timesheetMonth.toString().padStart(2, '0')}`}
              onChange={(e) => {
                const [year, month] = e.target.value.split('-');
                setTimesheetYear(parseInt(year));
                setTimesheetMonth(parseInt(month));
              }}
            >
              <option value={`${new Date().getFullYear()}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}`}>
                Current Month ({new Date().toLocaleString('default', { month: 'long', year: 'numeric' })})
              </option>
              <option value={`${new Date().getMonth() === 0 ? new Date().getFullYear() - 1 : new Date().getFullYear()}-${(new Date().getMonth() === 0 ? 12 : new Date().getMonth()).toString().padStart(2, '0')}`}>
                Previous Month ({new Date(new Date().getFullYear(), new Date().getMonth() - 1).toLocaleString('default', { month: 'long', year: 'numeric' })})
              </option>
              {/* Add more month options */}
              <option value="2025-06">June 2025</option>
              <option value="2025-05">May 2025</option>
              <option value="2025-04">April 2025</option>
              <option value="2025-03">March 2025</option>
              <option value="2025-02">February 2025</option>
              <option value="2025-01">January 2025</option>
            </select>
          </div>
          <div className="space-y-4 overflow-y-auto max-h-[60vh]">
            {employeeTimeEntries.length > 0 ? (
              <div className="space-y-3">
                {employeeTimeEntries.map((entry: any) => (
                  <div key={entry.id} className="border border-border rounded-lg p-4 bg-muted/30">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center space-x-4">
                        <span className="font-medium text-foreground">
                          {new Date(entry.date + 'T00:00:00').toLocaleDateString()}
                        </span>
                        <Badge variant="outline" className="capitalize">
                          {entry.project}
                        </Badge>
                        {entry.clientName && (
                          <Badge variant="secondary">
                            Client: {entry.clientName}
                          </Badge>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">
                          {entry.startTime} - {entry.endTime}
                        </div>
                        <div className="font-medium text-foreground">
                          {entry.totalHours}h
                        </div>
                      </div>
                    </div>
                    {entry.notes && (
                      <div className="mt-2 p-2 bg-background rounded border">
                        <div className="text-xs text-muted-foreground mb-1">Notes:</div>
                        <div className="text-sm text-foreground">{entry.notes}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No time entries found for this employee.
              </div>
            )}
          </div>
          <div className="flex justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => setViewingEmployee(null)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
