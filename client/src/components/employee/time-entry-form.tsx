import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Clock, Zap } from "lucide-react";

const timeEntrySchema = z.object({
  date: z.string().min(1, "Date is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  project: z.string().min(1, "Project is required"),
  notes: z.string().optional(),
});

type TimeEntryFormData = z.infer<typeof timeEntrySchema>;

interface TimeEntryFormProps {
  onSuccess: () => void;
}

export default function TimeEntryForm({ onSuccess }: TimeEntryFormProps) {
  const { toast } = useToast();
  const [calculatedHours, setCalculatedHours] = useState(0);
  const [showQuickEntry, setShowQuickEntry] = useState(true);

  const form = useForm<TimeEntryFormData>({
    resolver: zodResolver(timeEntrySchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      startTime: "",
      endTime: "",
      project: "",
      notes: "",
    },
  });

  const { watch, setValue } = form;
  const startTime = watch("startTime");
  const endTime = watch("endTime");
  const project = watch("project");

  // Calculate hours when times change
  React.useEffect(() => {
    if (startTime && endTime) {
      const start = new Date(`2024-01-01 ${startTime}`);
      const end = new Date(`2024-01-01 ${endTime}`);
      const diffMs = end.getTime() - start.getTime();
      const hours = Math.max(0, diffMs / (1000 * 60 * 60));
      setCalculatedHours(hours);
    } else {
      setCalculatedHours(0);
    }
  }, [startTime, endTime]);

  const createTimeEntryMutation = useMutation({
    mutationFn: async (data: TimeEntryFormData) => {
      await apiRequest("POST", "/api/time-entries", data);
    },
    onSuccess: () => {
      form.reset({
        date: new Date().toISOString().split('T')[0],
        startTime: "",
        endTime: "",
        project: "",
        notes: "",
      });
      setCalculatedHours(0);
      onSuccess();
      toast({
        title: "Success",
        description: "Time entry added successfully",
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

  const onSubmit = (data: TimeEntryFormData) => {
    if (calculatedHours <= 0) {
      toast({
        title: "Invalid Time",
        description: "End time must be after start time",
        variant: "destructive",
      });
      return;
    }
    createTimeEntryMutation.mutate(data);
  };

  // Quick entry presets
  const quickEntryPresets = [
    {
      name: "Full Day",
      icon: Clock,
      startTime: "09:00",
      endTime: "17:00",
      project: "wedding-invites",
      hours: 8,
      color: "bg-blue-50 border-blue-200 hover:bg-blue-100"
    },
    {
      name: "Half Day",
      icon: Clock,
      startTime: "09:00",
      endTime: "13:00",
      project: "wedding-invites",
      hours: 4,
      color: "bg-green-50 border-green-200 hover:bg-green-100"
    },
    {
      name: "Production",
      icon: Zap,
      startTime: "09:00",
      endTime: "17:00",
      project: "production",
      hours: 8,
      color: "bg-orange-50 border-orange-200 hover:bg-orange-100"
    },
    {
      name: "Consultation",
      icon: Clock,
      startTime: "10:00",
      endTime: "12:00",
      project: "design-consultation",
      hours: 2,
      color: "bg-purple-50 border-purple-200 hover:bg-purple-100"
    }
  ];

  const handleQuickEntry = (preset: typeof quickEntryPresets[0]) => {
    form.setValue("startTime", preset.startTime);
    form.setValue("endTime", preset.endTime);
    form.setValue("project", preset.project);
    setShowQuickEntry(false);
    toast({
      title: "Quick Entry Applied",
      description: `${preset.name} (${preset.hours} hours) - Review and submit`,
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-md font-medium text-slate-900">Add Time Entry</h4>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowQuickEntry(!showQuickEntry)}
          className="text-slate-600 hover:text-slate-900"
        >
          <Zap className="w-4 h-4 mr-1" />
          Quick Entry
        </Button>
      </div>

      {/* Quick Entry Shortcuts */}
      {showQuickEntry && (
        <div className="mb-6 p-4 bg-slate-50 rounded-lg border">
          <h5 className="text-sm font-medium text-slate-700 mb-3">One-Tap Shortcuts</h5>
          <div className="grid grid-cols-2 gap-2">
            {quickEntryPresets.map((preset, index) => {
              const IconComponent = preset.icon;
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleQuickEntry(preset)}
                  className={`p-3 rounded-lg border text-left transition-colors ${preset.color}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center">
                        <IconComponent className="w-4 h-4 mr-2 text-slate-600" />
                        <span className="text-sm font-medium text-slate-900">{preset.name}</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">{preset.hours} hours</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-slate-500 mt-2">Tap a shortcut to auto-fill the form, then review and submit</p>
        </div>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            type="date"
            {...form.register("date")}
            className="mt-1"
          />
          {form.formState.errors.date && (
            <p className="text-sm text-red-600 mt-1">{form.formState.errors.date.message}</p>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="startTime">Start Time</Label>
            <Input
              id="startTime"
              type="time"
              {...form.register("startTime")}
              className="mt-1"
            />
            {form.formState.errors.startTime && (
              <p className="text-sm text-red-600 mt-1">{form.formState.errors.startTime.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="endTime">End Time</Label>
            <Input
              id="endTime"
              type="time"
              {...form.register("endTime")}
              className="mt-1"
            />
            {form.formState.errors.endTime && (
              <p className="text-sm text-red-600 mt-1">{form.formState.errors.endTime.message}</p>
            )}
          </div>
        </div>
        
        <div>
          <Label htmlFor="project">Project/Task</Label>
          <Select value={project} onValueChange={(value) => setValue("project", value)}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select project..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="wedding-invites">Wedding Invitations</SelectItem>
              <SelectItem value="place-cards">Place Cards</SelectItem>
              <SelectItem value="wooden-fixtures">Wooden Fixtures</SelectItem>
              <SelectItem value="design-consultation">Design Consultation</SelectItem>
              <SelectItem value="production">Production Work</SelectItem>
            </SelectContent>
          </Select>
          {form.formState.errors.project && (
            <p className="text-sm text-red-600 mt-1">{form.formState.errors.project.message}</p>
          )}
        </div>
        
        <div>
          <Label htmlFor="notes">Notes (Optional)</Label>
          <Textarea
            id="notes"
            {...form.register("notes")}
            className="mt-1"
            rows={3}
            placeholder="Add any notes about this time entry..."
          />
        </div>
        
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <div className="text-sm text-slate-600">
            Total Hours: <span className="font-medium text-slate-900">{calculatedHours.toFixed(2)}</span>
          </div>
          <Button 
            type="submit" 
            disabled={createTimeEntryMutation.isPending}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            {createTimeEntryMutation.isPending ? "Adding..." : "Add Entry"}
          </Button>
        </div>
      </form>
    </div>
  );
}
