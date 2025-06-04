import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Users, CheckCircle } from "lucide-react";

export default function TaskManagement() {
  const { toast } = useToast();
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showAssignTask, setShowAssignTask] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [newTask, setNewTask] = useState({ name: "", description: "", color: "#3B82F6" });

  // Fetch task categories
  const { data: taskCategories = [], isLoading: tasksLoading } = useQuery({
    queryKey: ["/api/tasks"],
    retry: false,
  });

  // Fetch employees for task assignment
  const { data: employees = [] } = useQuery({
    queryKey: ["/api/employees"],
    retry: false,
  });

  // Create task category mutation
  const createTaskMutation = useMutation({
    mutationFn: async (taskData: any) => {
      await apiRequest("POST", "/api/tasks", taskData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      setShowCreateTask(false);
      setNewTask({ name: "", description: "", color: "#3B82F6" });
      toast({
        title: "Success",
        description: "Task category created successfully",
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

  // Assign task to employee mutation
  const assignTaskMutation = useMutation({
    mutationFn: async ({ taskId, employeeIds }: { taskId: number; employeeIds: string[] }) => {
      await apiRequest("POST", "/api/tasks/assign", { taskCategoryId: taskId, employeeIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      setShowAssignTask(false);
      setSelectedTask(null);
      toast({
        title: "Success",
        description: "Tasks assigned successfully",
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

  const handleCreateTask = () => {
    if (!newTask.name.trim()) {
      toast({
        title: "Error",
        description: "Task name is required",
        variant: "destructive",
      });
      return;
    }
    createTaskMutation.mutate(newTask);
  };

  const defaultTasks = [
    { name: "Administrative", description: "General administrative tasks", color: "#3B82F6" },
    { name: "Design", description: "Creative design work", color: "#8B5CF6" },
    { name: "Email Follow-up", description: "Client communication and follow-ups", color: "#10B981" },
    { name: "Marketing", description: "Marketing and promotional activities", color: "#F59E0B" },
  ];

  const initializeDefaultTasks = () => {
    defaultTasks.forEach(task => {
      createTaskMutation.mutate(task);
    });
  };

  if (tasksLoading) {
    return (
      <Card className="border-0 shadow-sm mb-6 sm:mb-8">
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
    <Card className="border-0 shadow-sm mb-6 sm:mb-8">
      <CardHeader className="border-b border-slate-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg sm:text-xl font-semibold text-slate-900">Task Management</CardTitle>
            <p className="text-slate-600 text-sm">Create and assign task categories to employees</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            {taskCategories.length === 0 && (
              <Button 
                onClick={initializeDefaultTasks}
                className="bg-primary hover:bg-primary/90"
                disabled={createTaskMutation.isPending}
              >
                <Plus className="w-4 h-4 mr-2" />
                Setup Default Tasks
              </Button>
            )}
            <Button 
              onClick={() => setShowCreateTask(true)}
              variant="outline"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Task
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6">
        {taskCategories.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No task categories yet</h3>
            <p className="text-slate-600 mb-4">Create task categories to assign specific work types to your employees.</p>
            <Button onClick={() => setShowCreateTask(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Task
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {taskCategories.map((task: any) => (
              <div key={task.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: task.color }}
                    ></div>
                    <h3 className="font-medium text-slate-900">{task.name}</h3>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {task.assignedCount || 0} assigned
                  </Badge>
                </div>
                
                {task.description && (
                  <p className="text-sm text-slate-600 mb-3">{task.description}</p>
                )}
                
                <div className="flex space-x-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      setSelectedTask(task);
                      setShowAssignTask(true);
                    }}
                  >
                    <Users className="w-3 h-3 mr-1" />
                    Assign
                  </Button>
                  <Button size="sm" variant="ghost">
                    <Edit className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Create Task Dialog */}
      <Dialog open={showCreateTask} onOpenChange={setShowCreateTask}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Task Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="taskName">Task Name</Label>
              <Input
                id="taskName"
                value={newTask.name}
                onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                placeholder="e.g., Design, Administrative"
              />
            </div>
            <div>
              <Label htmlFor="taskDescription">Description (Optional)</Label>
              <Input
                id="taskDescription"
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                placeholder="Brief description of this task category"
              />
            </div>
            <div>
              <Label htmlFor="taskColor">Color</Label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  id="taskColor"
                  value={newTask.color}
                  onChange={(e) => setNewTask({ ...newTask, color: e.target.value })}
                  className="w-10 h-10 rounded border border-slate-300"
                />
                <Input
                  value={newTask.color}
                  onChange={(e) => setNewTask({ ...newTask, color: e.target.value })}
                  placeholder="#3B82F6"
                  className="flex-1"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCreateTask(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateTask}
                disabled={createTaskMutation.isPending}
              >
                {createTaskMutation.isPending ? "Creating..." : "Create Task"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Task Dialog */}
      <Dialog open={showAssignTask} onOpenChange={setShowAssignTask}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Task: {selectedTask?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Select employees to assign this task category to:
            </p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {employees.map((employee: any) => (
                <label key={employee.id} className="flex items-center space-x-2 p-2 hover:bg-slate-50 rounded">
                  <input 
                    type="checkbox" 
                    className="rounded border-slate-300"
                    defaultChecked={employee.assignedTasks?.includes(selectedTask?.id)}
                  />
                  <span className="text-sm">{employee.firstName} {employee.lastName} ({employee.email})</span>
                </label>
              ))}
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowAssignTask(false)}>
                Cancel
              </Button>
              <Button disabled={assignTaskMutation.isPending}>
                {assignTaskMutation.isPending ? "Assigning..." : "Assign Tasks"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}