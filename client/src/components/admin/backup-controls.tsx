import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Database, AlertTriangle, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export function BackupControls() {
  const { toast } = useToast();
  
  const createBackupMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/admin/backup/create', {});
    },
    onSuccess: (data) => {
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
      return await apiRequest('POST', '/api/admin/backup/emergency', {});
    },
    onSuccess: (data) => {
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
    <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
      <CardHeader>
        <CardTitle className="text-green-800 dark:text-green-200 flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Data Protection & Backup Center
        </CardTitle>
        <CardDescription className="text-green-700 dark:text-green-300">
          Multiple backup systems are active to prevent data loss. Manual backup controls available below.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Backup Status Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-2 p-3 bg-white dark:bg-green-900 rounded-lg">
            <Database className="h-4 w-4 text-green-600 dark:text-green-400" />
            <div className="text-sm">
              <div className="font-semibold text-green-800 dark:text-green-200">Hourly Backups</div>
              <div className="text-green-600 dark:text-green-400">Active</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-3 bg-white dark:bg-green-900 rounded-lg">
            <Shield className="h-4 w-4 text-green-600 dark:text-green-400" />
            <div className="text-sm">
              <div className="font-semibold text-green-800 dark:text-green-200">Change Monitoring</div>
              <div className="text-green-600 dark:text-green-400">Protected</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-3 bg-white dark:bg-green-900 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <div className="text-sm">
              <div className="font-semibold text-green-800 dark:text-green-200">Emergency System</div>
              <div className="text-green-600 dark:text-green-400">Standby</div>
            </div>
          </div>
        </div>

        {/* Manual Backup Controls */}
        <div className="border-t border-green-200 pt-4">
          <h4 className="font-semibold text-green-800 dark:text-green-200 mb-3">Manual Backup Controls</h4>
          
          <div className="flex gap-3">
            <Button
              onClick={() => createBackupMutation.mutate()}
              disabled={createBackupMutation.isPending}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Download className="h-4 w-4 mr-2" />
              {createBackupMutation.isPending ? "Creating..." : "Create Full Backup"}
            </Button>
            
            <Button
              onClick={() => emergencyBackupMutation.mutate()}
              disabled={emergencyBackupMutation.isPending}
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              {emergencyBackupMutation.isPending ? "Creating..." : "Emergency Backup"}
            </Button>
          </div>
        </div>

        {/* Protection Features */}
        <div className="border-t border-green-200 pt-4">
          <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">Active Protection Features</h4>
          <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
            <li>• Automatic backups every hour (time entries)</li>
            <li>• Full system backup every 6 hours</li>
            <li>• Pre-operation backups before destructive actions</li>
            <li>• Real-time monitoring for unexpected data loss</li>
            <li>• Emergency backup triggers on significant changes</li>
            <li>• Local backup storage with JSON format for easy recovery</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}