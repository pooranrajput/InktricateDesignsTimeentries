import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Download, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export function BackupControls() {
  const { toast } = useToast();

  const createBackupMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('/api/admin/backup/create', 'POST', {});
      return await (res as any).json?.() ?? res;
    },
    onSuccess: (data: any) => {
      toast({
        title: "Backup Created Successfully",
        description: `Full database backup saved: ${data.backupPath}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Backup Failed",
        description: error.message || "Failed to create backup",
        variant: "destructive"
      });
    }
  });

  const emergencyBackupMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('/api/admin/backup/emergency', 'POST', {});
      return await (res as any).json?.() ?? res;
    },
    onSuccess: (data: any) => {
      toast({
        title: "Emergency Backup Created",
        description: `Emergency backup saved: ${data.backupPath}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Emergency Backup Failed",
        description: error.message || "Failed to create emergency backup",
        variant: "destructive"
      });
    }
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Data Backup
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Automatic hourly backups are active. Use manual controls for on-demand backups.
        </p>
        <div className="flex gap-3">
          <Button
            onClick={() => createBackupMutation.mutate()}
            disabled={createBackupMutation.isPending}
            size="sm"
          >
            <Download className="h-4 w-4 mr-2" />
            {createBackupMutation.isPending ? "Creating..." : "Full Backup"}
          </Button>
          <Button
            onClick={() => emergencyBackupMutation.mutate()}
            disabled={emergencyBackupMutation.isPending}
            variant="outline"
            size="sm"
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            {emergencyBackupMutation.isPending ? "Creating..." : "Emergency Backup"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
