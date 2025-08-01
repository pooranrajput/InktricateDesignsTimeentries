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
  const [selectedYear, setSelectedYear] = useState(2025); // Use test data year
  const [selectedMonth, setSelectedMonth] = useState(11); // Default to November (next available month)
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get months with existing QuickBooks bills to filter dropdown
  const { data: existingBillMonths = [] } = useQuery<Array<{month: number, year: number}>>({
    queryKey: ['/api/quickbooks/existing-bill-months', selectedYear],
    queryFn: async () => {
      const response = await fetch(`/api/quickbooks/existing-bill-months?year=${selectedYear}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch existing bill months');
      return response.json();
    },
  });

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
      // FORCE FRESH REQUEST - clear all caches
      const timestamp = Date.now();
      const response = await fetch(`/api/quickbooks/auth?fresh=${timestamp}`, {
        method: 'GET',
        credentials: 'include',
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      if (!response.ok) throw new Error('Failed to get authorization URL');
      return response.json();
    },
    onSuccess: (data) => {
      console.log('PRODUCTION OAuth URL:', data.authUrl);
      
      // Verify the URL uses correct Client ID and production endpoints
      if (data.authUrl.includes('AB6HieH2iCWWSQ8jneSC') && data.authUrl.includes('inkticate-time-tracker-pooranrajput.replit.app')) {
        console.log('✅ Production URL confirmed');
        
        // Clear ALL browser storage
        localStorage.clear();
        sessionStorage.clear();
        
        // Clear QuickBooks cookies
        document.cookie = 'intuit_tid=; path=/; domain=.intuit.com; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        document.cookie = 'qbn.appCenter.token=; path=/; domain=.intuit.com; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        
        // Open fresh URL
        window.open(data.authUrl, '_blank', 'noopener,noreferrer');
        
        toast({
          title: "Production Authorization Started",
          description: "Opening QuickBooks authorization with production credentials.",
        });
      } else {
        console.error('❌ Wrong Client ID or redirect URI in URL:', data.authUrl);
        toast({
          title: "Configuration Error",
          description: "OAuth URL contains incorrect credentials. Please try again.",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Authorization Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Re-authenticate QuickBooks (clear expired tokens) - FORCE FRESH
  const reauthMutation = useMutation({
    mutationFn: async () => {
      // Force fresh request identical to connect button
      const timestamp = Date.now();
      const response = await fetch(`/api/quickbooks/auth?reauth=${timestamp}`, {
        method: 'GET',
        credentials: 'include',
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      if (!response.ok) throw new Error('Failed to get re-authentication URL');
      return response.json();
    },
    onSuccess: (data) => {
      console.log('PRODUCTION Re-auth URL:', data.authUrl);
      
      // Verify production credentials before opening
      if (data.authUrl.includes('AB6HieH2iCWWSQ8jneSC') && data.authUrl.includes('inkticate-time-tracker-pooranrajput.replit.app')) {
        console.log('✅ Production re-auth URL confirmed');
        
        // Clear all browser caches
        localStorage.clear();
        sessionStorage.clear();
        
        window.open(data.authUrl, '_blank');
        
        toast({
          title: "Production Re-authentication Started",
          description: "Opening QuickBooks with production credentials.",
        });
      } else {
        console.error('❌ Wrong credentials in re-auth URL:', data.authUrl);
        toast({
          title: "Configuration Error",
          description: "Re-auth URL contains incorrect credentials.",
          variant: "destructive",
        });
      }
      queryClient.invalidateQueries({ queryKey: ['/api/quickbooks/test'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Re-authentication Failed",
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

  // Create payroll bill for specific user
  const createPayrollBillMutation = useMutation({
    mutationFn: async (data: { userId: string; year: number; month: number }) => {
      const response = await apiRequest('POST', '/api/quickbooks/create-payroll-bill', data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Payroll Bill Created",
        description: `Successfully created QuickBooks bill ID ${data.bill?.Id} for $${data.bill?.TotalAmt}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/quickbooks/test'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Payroll Bill Creation Failed",
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
        title: "Contractor Sync Complete",
        description: data.message || "Contractors processed successfully",
      });
      
      // Log detailed results for admin review
      if (data.details && data.details.length > 0) {
        console.log('📋 Contractor Sync Results:', data.details);
        console.log(`✅ ${data.summary.created} created, 🔗 ${data.summary.linked} linked, ❌ ${data.summary.failed} failed`);
      }
      
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

  const handleCreatePayrollBill = () => {
    // Using admin user ID for testing - you can modify this to select different users
    createPayrollBillMutation.mutate({ 
      userId: "43458679", // Admin user ID for testing
      year: selectedYear, 
      month: selectedMonth 
    });
  };

  const isConnected = connectionTest?.success;

  // Generate available months (only show months that don't have bills yet)
  const availableMonths = [
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ].filter(month => !existingBillMonths.some(existing => existing.month === month.value));

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
              <div className="flex gap-2">
                <Button
                  onClick={() => authMutation.mutate()}
                  disabled={authMutation.isPending}
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Connect to QuickBooks
                </Button>
                <Button
                  onClick={() => reauthMutation.mutate()}
                  disabled={reauthMutation.isPending}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  {reauthMutation.isPending ? 'Re-authenticating...' : 'Re-authenticate'}
                </Button>
              </div>
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
              
              {/* 1099 Setup Guide */}
              <Alert className="bg-blue-50 border-blue-200">
                <AlertDescription>
                  <div className="space-y-3">
                    <div className="font-medium text-blue-900">📋 Complete 1099 Setup in QuickBooks</div>
                    <div className="text-sm text-blue-800">
                      After syncing contractors, complete these steps in QuickBooks to see "Track payments for 1099" checkboxes checked:
                    </div>
                    <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
                      <li>Go to <strong>Taxes → 1099 filings</strong> in QuickBooks</li>
                      <li>Complete the 1099 setup wizard through "Step 2 - Accounts"</li>
                      <li><strong>Critical:</strong> Check "Box 7: Nonemployee Compensation" and map your contractor expense accounts</li>
                      <li>Click "Save & Finish Later" (filing not required for sandbox)</li>
                    </ol>
                    <div className="text-xs text-blue-700">
                      💡 The API correctly sets Vendor1099=true, but QuickBooks only shows checkboxes after account mapping is complete.
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          )}

          <Separator />

          {/* Monthly Bill Generation */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                <h3 className="text-lg font-medium">Monthly Contractor Bills</h3>
              </div>
              {availableMonths.length === 0 && (
                <Badge variant="secondary" className="text-green-700 bg-green-50">
                  All months completed
                </Badge>
              )}
            </div>
            
            {availableMonths.length === 0 && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>All months processed!</strong> Bills have been generated for all available months in {selectedYear}.
                </AlertDescription>
              </Alert>
            )}
            
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
                <Select 
                  value={selectedMonth.toString()} 
                  onValueChange={(value) => setSelectedMonth(parseInt(value))}
                  disabled={availableMonths.length === 0}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder={availableMonths.length === 0 ? "No available months" : "Select month"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMonths.map(month => (
                      <SelectItem key={month.value} value={month.value.toString()}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button
                onClick={handleGenerateBills}
                disabled={!isConnected || generateBillsMutation.isPending || availableMonths.length === 0}
                className="flex items-center gap-2"
              >
                <DollarSign className="h-4 w-4" />
                {generateBillsMutation.isPending ? 'Generating...' : 'Generate Bills'}
              </Button>
              
              <Button
                onClick={handleCreatePayrollBill}
                disabled={!isConnected || createPayrollBillMutation.isPending}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
              >
                <DollarSign className="h-4 w-4" />
                {createPayrollBillMutation.isPending ? 'Creating...' : 'Test Payroll Bill'}
              </Button>
            </div>

            <Alert>
              <AlertDescription>
                <div className="space-y-2">
                  <div><strong>Generate Bills:</strong> Creates invoices for all contractors with logged time in the selected period.</div>
                  <div><strong>Test Payroll Bill:</strong> Creates a single payroll bill using the new "Wages" category and "Month Year - Name Payroll" description format.</div>
                </div>
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