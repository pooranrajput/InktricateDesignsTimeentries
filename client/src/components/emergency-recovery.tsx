import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Trash2, Save } from "lucide-react";

interface TimeEntryRow {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  description: string;
  taskCategoryId: number;
}

interface EmergencyRecoveryProps {
  taskCategories: Array<{ id: number; name: string; description: string | null }>;
  currentUser: { id: number; first_name: string; last_name: string };
}

export function EmergencyRecovery({ taskCategories, currentUser }: EmergencyRecoveryProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [entries, setEntries] = useState<TimeEntryRow[]>([
    {
      id: "1",
      date: "",
      startTime: "",
      endTime: "",
      description: "",
      taskCategoryId: 1
    }
  ]);

  const addRow = () => {
    const newId = (Math.max(...entries.map(e => parseInt(e.id))) + 1).toString();
    setEntries([...entries, {
      id: newId,
      date: "",
      startTime: "",
      endTime: "",
      description: "",
      taskCategoryId: 1
    }]);
  };

  const removeRow = (id: string) => {
    if (entries.length > 1) {
      setEntries(entries.filter(e => e.id !== id));
    }
  };

  const updateEntry = (id: string, field: keyof TimeEntryRow, value: string | number) => {
    setEntries(entries.map(entry => 
      entry.id === id ? { ...entry, [field]: value } : entry
    ));
  };

  const bulkCreateMutation = useMutation({
    mutationFn: async (timeEntries: any[]) => {
      const results = [];
      for (const entry of timeEntries) {
        const result = await apiRequest(`/api/time-entries`, "POST", entry);
        results.push(result);
      }
      return results;
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: `Created ${entries.length} time entries successfully.`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/time-entries'] });
      // Reset form
      setEntries([{
        id: "1",
        date: "",
        startTime: "",
        endTime: "",
        description: "",
        taskCategoryId: 1
      }]);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create time entries",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = () => {
    const validEntries = entries.filter(entry => 
      entry.date && entry.startTime && entry.endTime
    );

    if (validEntries.length === 0) {
      toast({
        title: "No Valid Entries",
        description: "Please fill in at least one complete time entry",
        variant: "destructive"
      });
      return;
    }

    const formattedEntries = validEntries.map(entry => ({
      date: entry.date,
      start_time: `${entry.date}T${entry.startTime}:00`,
      end_time: `${entry.date}T${entry.endTime}:00`,
      description: entry.description || "Recovery entry",
      task_category_id: entry.taskCategoryId
    }));

    bulkCreateMutation.mutate(formattedEntries);
  };

  const generateTemplate = () => {
    const template = `Date,Start Time,End Time,Description,Task Category
2025-07-01,09:00,17:00,Daily work,General Design
2025-07-02,09:00,17:00,Daily work,General Design
2025-07-03,09:00,17:00,Daily work,General Design`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentUser.first_name}_${currentUser.last_name}_time_recovery_template.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader className="bg-red-50 dark:bg-red-950">
        <CardTitle className="text-red-800 dark:text-red-200 flex items-center gap-2">
          <Save className="h-5 w-5" />
          Emergency Time Entry Recovery - {currentUser.first_name} {currentUser.last_name}
        </CardTitle>
        <CardDescription className="text-red-700 dark:text-red-300">
          Quick bulk entry system to recover your lost time entries. Fill in your work hours from July 1-22, 2025.
        </CardDescription>
        <Button onClick={generateTemplate} variant="outline" size="sm" className="w-fit">
          Download CSV Template
        </Button>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="grid grid-cols-12 gap-2 font-semibold text-sm">
            <div className="col-span-2">Date</div>
            <div className="col-span-2">Start Time</div>
            <div className="col-span-2">End Time</div>
            <div className="col-span-3">Description</div>
            <div className="col-span-2">Task Category</div>
            <div className="col-span-1">Actions</div>
          </div>

          {entries.map((entry) => (
            <div key={entry.id} className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-2">
                <Input
                  type="date"
                  value={entry.date}
                  onChange={(e) => updateEntry(entry.id, "date", e.target.value)}
                  min="2025-07-01"
                  max="2025-07-22"
                />
              </div>
              
              <div className="col-span-2">
                <Input
                  type="time"
                  value={entry.startTime}
                  onChange={(e) => updateEntry(entry.id, "startTime", e.target.value)}
                />
              </div>
              
              <div className="col-span-2">
                <Input
                  type="time"
                  value={entry.endTime}
                  onChange={(e) => updateEntry(entry.id, "endTime", e.target.value)}
                />
              </div>
              
              <div className="col-span-3">
                <Input
                  placeholder="Work description"
                  value={entry.description}
                  onChange={(e) => updateEntry(entry.id, "description", e.target.value)}
                />
              </div>
              
              <div className="col-span-2">
                <Select 
                  value={entry.taskCategoryId.toString()} 
                  onValueChange={(value) => updateEntry(entry.id, "taskCategoryId", parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {taskCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="col-span-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeRow(entry.id)}
                  disabled={entries.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-4 mt-6">
          <Button onClick={addRow} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Row
          </Button>
          
          <Button 
            onClick={handleSubmit} 
            disabled={bulkCreateMutation.isPending}
            className="bg-green-600 hover:bg-green-700"
          >
            <Save className="h-4 w-4 mr-2" />
            {bulkCreateMutation.isPending ? "Saving..." : `Save ${entries.length} Entries`}
          </Button>
        </div>

        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
          <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Quick Recovery Tips:</h4>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>• Check your phone calendar for work appointments/meetings</li>
            <li>• Look at email timestamps for work-related activities</li>
            <li>• Remember typical work patterns (9-5, part-time hours, etc.)</li>
            <li>• Use "Daily work" as description if you can't remember specifics</li>
            <li>• You can add multiple rows and save them all at once</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}