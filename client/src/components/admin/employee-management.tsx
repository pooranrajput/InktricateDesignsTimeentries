import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Eye, Edit, Trash2, Plus, DollarSign } from "lucide-react";
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

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ["/api/employees"],
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

  const handleDeactivateUser = (userId: string, userName: string) => {
    if (confirm(`Are you sure you want to deactivate ${userName}?`)) {
      deactivateUserMutation.mutate(userId);
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
        return 'bg-purple-100 text-purple-800';
      case 'employee':
        return 'bg-primary-100 text-primary-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  if (isLoading) {
    return (
      <Card className="border-0 shadow-sm mb-8">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-slate-200 rounded w-1/4"></div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-slate-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm mb-8">
      <CardHeader className="border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-slate-900">Employee Management</CardTitle>
            <p className="text-slate-600 text-sm">Manage hourly rates and employee details</p>
          </div>
          <div className="text-sm text-slate-600">
            <p className="mb-2">New employees automatically appear here after their first login</p>
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-blue-800 text-xs">
                <strong>To add team members:</strong> Share the application URL with them. 
                They'll automatically be added to your employee list when they sign in for the first time.
              </p>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Hourly Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {employees.map((employee: any) => (
                <tr key={employee.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap">
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
                      <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-600">
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
    </Card>
  );
}
