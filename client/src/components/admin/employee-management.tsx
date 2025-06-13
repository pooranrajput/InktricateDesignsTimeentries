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

  const { data: employeeTimeEntries = [] } = useQuery({
    queryKey: ["/api/time-entries", viewingEmployee],
    queryFn: () => viewingEmployee ? fetch(`/api/time-entries/${viewingEmployee}`).then(res => res.json()) : [],
    enabled: !!viewingEmployee,
    retry: false,
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
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Employee</th>
                  <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Role</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Rate</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {employees.map((employee: any) => (
                  <tr key={employee.id} className="hover:bg-slate-50">
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center mr-3">
                        <span className="text-primary-600 text-sm font-medium">
                          {getInitials(employee.firstName, employee.lastName, employee.email)}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-900">
                          {getDisplayName(employee)}
                        </div>
                        <div className="text-sm text-slate-500">{employee.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge className={`${getRoleBadgeColor(employee.role)} capitalize`}>
                      {employee.role}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                    <div className="flex items-center space-x-2">
                      <span>${parseFloat(employee.hourlyRate || '0').toFixed(2)}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditRate(employee.id, employee.hourlyRate || '0')}
                        className="text-slate-400 hover:text-primary h-6 w-6 p-0"
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleViewEmployee(employee.id)}
                        className="text-primary hover:text-primary/80"
                        title="View Employee Details"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleEditRole(employee.id, employee.role)}
                        className="text-slate-400 hover:text-slate-600"
                        title="Edit Role"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDeactivateUser(employee.id, getDisplayName(employee))}
                        className="text-red-400 hover:text-red-600"
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
            <DialogTitle>Employee Time Entries</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {employeeTimeEntries.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Project</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Hours</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {employeeTimeEntries.map((entry: any) => (
                      <tr key={entry.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                          {new Date(entry.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                          {entry.project}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                          {entry.startTime} - {entry.endTime}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                          {entry.totalHours}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-900">
                          {entry.notes || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-slate-500">No time entries found for this employee.</p>
            )}
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setViewingEmployee(null)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
