import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { CheckCircle, XCircle, ExternalLink, DollarSign, Clock, Users } from 'lucide-react';

export default function QuickBooksIntegration() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Test QuickBooks connection
  const { data: connectionTest, isLoading: isTestingConnection } = useQuery<{
    success: boolean;
    companyInfo?: {
      CompanyName: string;
    };
  }>({
    queryKey: ['/api/quickbooks/test'],
    enabled: true,
  });

  // Get QuickBooks authorization URL
  const authMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('GET', '/api/quickbooks/auth');
      return response.json();
    },
    onSuccess: (data) => {
      // Open QuickBooks authorization in new window
      window.open(data.authUrl, '_blank');
      toast({
        title: "Authorization Started",
        description: "Please complete the authorization in the new window.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Authorization Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Generate monthly contractor bills
  const generateBillsMutation = useMutation({
    mutationFn: async (data: { year: number; month: number }) => {
      const response = await apiRequest('POST', '/api/quickbooks/generate-bills', data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Bills Generated",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/quickbooks/test'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Bill Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Sync contractors to QuickBooks
  const syncContractorsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/quickbooks/sync-contractors');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Contractors Synced",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/quickbooks/test'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Sync Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create contractor in QuickBooks
  const createContractorMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest('POST', '/api/quickbooks/create-contractor', { userId });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Contractor Created",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Contractor Creation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleGenerateBills = () => {
    generateBillsMutation.mutate({ year: selectedYear, month: selectedMonth });
  };

  const isConnected = connectionTest?.success;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            QuickBooks Integration
          </CardTitle>
          <CardDescription>
            Connect your timesheet system to QuickBooks Online for automated contractor billing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Connection Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-medium">Connection Status:</span>
              {isTestingConnection ? (
                <Badge variant="secondary">Testing...</Badge>
              ) : isConnected ? (
                <Badge variant="default" className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <XCircle className="h-3 w-3 mr-1" />
                  Not Connected
                </Badge>
              )}
            </div>
            
            {!isConnected && (
              <Button
                onClick={() => authMutation.mutate()}
                disabled={authMutation.isPending}
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Connect to QuickBooks
              </Button>
            )}
          </div>

          {isConnected && connectionTest?.companyInfo && (
            <Alert>
              <AlertDescription>
                Connected to <strong>{connectionTest.companyInfo.CompanyName}</strong>
              </AlertDescription>
            </Alert>
          )}

          {/* Contractor Management */}
          {isConnected && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  <h3 className="text-lg font-medium">Contractor Management</h3>
                </div>
                <Button
                  onClick={() => syncContractorsMutation.mutate()}
                  disabled={syncContractorsMutation.isPending}
                  className="flex items-center gap-2"
                >
                  <Users className="h-4 w-4" />
                  {syncContractorsMutation.isPending ? 'Syncing...' : 'Sync Contractors'}
                </Button>
              </div>
              
              <Alert>
                <AlertDescription>
                  This will create all active contractors as vendors in QuickBooks for billing and 1099 reporting.
                </AlertDescription>
              </Alert>
            </div>
          )}

          <Separator />

          {/* Monthly Bill Generation */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              <h3 className="text-lg font-medium">Monthly Contractor Bills</h3>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Year:</span>
                <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2023">2023</SelectItem>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2025">2025</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Month:</span>
                <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">January</SelectItem>
                    <SelectItem value="2">February</SelectItem>
                    <SelectItem value="3">March</SelectItem>
                    <SelectItem value="4">April</SelectItem>
                    <SelectItem value="5">May</SelectItem>
                    <SelectItem value="6">June</SelectItem>
                    <SelectItem value="7">July</SelectItem>
                    <SelectItem value="8">August</SelectItem>
                    <SelectItem value="9">September</SelectItem>
                    <SelectItem value="10">October</SelectItem>
                    <SelectItem value="11">November</SelectItem>
                    <SelectItem value="12">December</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button
                onClick={handleGenerateBills}
                disabled={!isConnected || generateBillsMutation.isPending}
                className="flex items-center gap-2"
              >
                <DollarSign className="h-4 w-4" />
                {generateBillsMutation.isPending ? 'Generating...' : 'Generate Bills'}
              </Button>
            </div>

            <Alert>
              <AlertDescription>
                This will create invoices in QuickBooks for all contractors who have logged time in the selected month.
                Make sure contractors are properly set up in QuickBooks first.
              </AlertDescription>
            </Alert>
          </div>

          <Separator />

          {/* Features List */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <h3 className="text-lg font-medium">QuickBooks Features</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">Contractor Management</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Create contractors as vendors in QuickBooks</li>
                  <li>• Track 1099 contractor information</li>
                  <li>• Sync hourly rates and contact details</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Automated Billing</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Generate monthly contractor invoices</li>
                  <li>• Include time tracking details</li>
                  <li>• Track billable vs non-billable time</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Time Tracking Sync</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Sync time entries to QuickBooks</li>
                  <li>• Project-based time tracking</li>
                  <li>• Automatic time activity creation</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Reporting</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Monthly payroll reports</li>
                  <li>• Contractor payment tracking</li>
                  <li>• Integration with QB reporting</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}