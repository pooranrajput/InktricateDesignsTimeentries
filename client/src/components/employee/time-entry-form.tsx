import { useState } from "react";
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
import { Plus } from "lucide-react";

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

  return (
    <div>
      <h4 className="text-md font-medium text-slate-900 mb-4">Add Time Entry</h4>
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
          <Select onValueChange={(value) => setValue("project", value)}>
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
