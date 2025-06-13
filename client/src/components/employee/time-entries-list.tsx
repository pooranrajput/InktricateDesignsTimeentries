import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Edit, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TimeEntriesListProps {
  timeEntries: any[];
  isLoading: boolean;
  onUpdate: () => void;
}

export default function TimeEntriesList({ timeEntries, isLoading, onUpdate }: TimeEntriesListProps) {
  const { toast } = useToast();
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    date: "",
    startTime: "",
    endTime: "",
    project: "",
    notes: "",
  });

  const deleteEntryMutation = useMutation({
    mutationFn: async (entryId: number) => {
      await apiRequest("DELETE", `/api/time-entries/${entryId}`);
    },
    onSuccess: () => {
      onUpdate();
      toast({
        title: "Success",
        description: "Time entry deleted successfully",
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

  const updateEntryMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      await apiRequest("PATCH", `/api/time-entries/${id}`, data);
    },
    onSuccess: () => {
      setEditingEntry(null);
      onUpdate();
      toast({
        title: "Success",
        description: "Time entry updated successfully",
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

  const handleEditEntry = (entry: any) => {
    setEditingEntry(entry);
    setEditForm({
      date: entry.date,
      startTime: entry.startTime,
      endTime: entry.endTime,
      project: entry.project,
      clientName: entry.clientName || "",
      notes: entry.notes || "",
    });
  };

  const handleUpdateEntry = () => {
    updateEntryMutation.mutate({
      id: editingEntry.id,
      ...editForm,
    });
  };

  const handleDeleteEntry = (entryId: number) => {
    if (confirm("Are you sure you want to delete this time entry?")) {
      deleteEntryMutation.mutate(entryId);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTimeRange = (startTime: string, endTime: string) => {
    const start = new Date(`2024-01-01 ${startTime}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    const end = new Date(`2024-01-01 ${endTime}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    return `${start} - ${end}`;
  };

  const getProjectBadgeColor = (project: string) => {
    switch (project) {
      case 'wedding-invites':
        return 'bg-primary-100 text-primary-800';
      case 'place-cards':
        return 'bg-accent-100 text-accent-800';
      case 'wooden-fixtures':
        return 'bg-purple-100 text-purple-800';
      case 'design-consultation':
        return 'bg-green-100 text-green-800';
      case 'production':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getProjectDisplayName = (project: string) => {
    switch (project) {
      case 'wedding-invites':
        return 'Wedding Invitations';
      case 'place-cards':
        return 'Place Cards';
      case 'wooden-fixtures':
        return 'Wooden Fixtures';
      case 'design-consultation':
        return 'Design Consultation';
      case 'production':
        return 'Production Work';
      default:
        return project;
    }
  };

  if (isLoading) {
    return (
      <div>
        <h4 className="text-md font-medium text-slate-900 mb-4">Recent Entries</h4>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-slate-100 rounded-lg p-4 h-24"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h4 className="text-md font-medium text-slate-900 mb-4">Recent Entries</h4>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {timeEntries.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <p>No time entries found.</p>
            <p className="text-sm">Add your first time entry to get started.</p>
          </div>
        ) : (
          timeEntries.map((entry) => (
            <div key={entry.id} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-slate-900">
                    {formatDate(entry.date)}
                  </span>
                  <Badge className={getProjectBadgeColor(entry.project)}>
                    {getProjectDisplayName(entry.project)}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-slate-900">
                    {parseFloat(entry.totalHours).toFixed(1)} hrs
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditEntry(entry)}
                    className="text-slate-400 hover:text-slate-600 h-6 w-6 p-0"
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteEntry(entry.id)}
                    className="text-red-400 hover:text-red-600 h-6 w-6 p-0"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              <div className="text-xs text-slate-500 mb-2">
                {formatTimeRange(entry.startTime, entry.endTime)}
              </div>
              {entry.clientName && (
                <div className="text-sm text-slate-700 mb-1">
                  <span className="font-medium">Client:</span> {entry.clientName}
                </div>
              )}
              {entry.notes && (
                <div className="text-sm text-slate-600">{entry.notes}</div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Edit Entry Dialog */}
      <Dialog open={!!editingEntry} onOpenChange={() => setEditingEntry(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Time Entry</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editDate">Date</Label>
              <Input
                id="editDate"
                type="date"
                value={editForm.date}
                onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editStartTime">Start Time</Label>
                <Input
                  id="editStartTime"
                  type="time"
                  value={editForm.startTime}
                  onChange={(e) => setEditForm({ ...editForm, startTime: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="editEndTime">End Time</Label>
                <Input
                  id="editEndTime"
                  type="time"
                  value={editForm.endTime}
                  onChange={(e) => setEditForm({ ...editForm, endTime: e.target.value })}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="editProject">Project/Task</Label>
              <Select value={editForm.project} onValueChange={(value) => setEditForm({ ...editForm, project: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="wedding-invites">Wedding Invitations</SelectItem>
                  <SelectItem value="place-cards">Place Cards</SelectItem>
                  <SelectItem value="wooden-fixtures">Wooden Fixtures</SelectItem>
                  <SelectItem value="design-consultation">Design Consultation</SelectItem>
                  <SelectItem value="production">Production Work</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="editNotes">Notes</Label>
              <Textarea
                id="editNotes"
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                rows={3}
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setEditingEntry(null)}>
                Cancel
              </Button>
              <Button 
                onClick={handleUpdateEntry}
                disabled={updateEntryMutation.isPending}
              >
                {updateEntryMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
