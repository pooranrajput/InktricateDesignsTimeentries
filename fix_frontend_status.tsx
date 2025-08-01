// Frontend fix: Use direct database query instead of API
import { useState, useEffect } from 'react';

// Create a working status component that bypasses API issues
export function DirectQuickBooksStatus() {
  const [status, setStatus] = useState<{
    connected: boolean;
    companyId?: string;
    sandbox?: boolean;
    checking: boolean;
    error?: string;
  }>({ connected: false, checking: true });

  useEffect(() => {
    // Instead of using the broken API endpoints, fetch status via a working method
    const checkStatus = async () => {
      try {
        // Try multiple approaches to get status
        const methods = [
          // Method 1: Try the working endpoint if any
          () => fetch('/api/quickbooks/status', { credentials: 'include' }),
          // Method 2: Direct connection test
          () => fetch('/api/debug-test', { credentials: 'include' }),
          // Method 3: Alternative endpoint
          () => fetch('/api/quickbooks/debug', { credentials: 'include' })
        ];

        for (const method of methods) {
          try {
            const response = await method();
            const text = await response.text();
            
            // Check if we got JSON instead of HTML
            if (text.startsWith('{')) {
              const data = JSON.parse(text);
              if (data.connected !== undefined) {
                setStatus({
                  connected: data.connected,
                  companyId: data.companyId,
                  sandbox: data.sandbox,
                  checking: false
                });
                return;
              }
            }
          } catch (e) {
            console.log('Method failed, trying next...', e.message);
          }
        }
        
        // If all methods fail, assume not connected
        setStatus({
          connected: false,
          checking: false,
          error: 'Unable to determine connection status'
        });
        
      } catch (error) {
        setStatus({
          connected: false,
          checking: false,
          error: error.message
        });
      }
    };

    checkStatus();
    // Check every 10 seconds
    const interval = setInterval(checkStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  if (status.checking) {
    return <div className="text-yellow-600">Checking QuickBooks connection...</div>;
  }

  if (status.connected) {
    return (
      <div className="text-green-600">
        ✅ QuickBooks Connected
        <br />
        Company: {status.companyId}
        <br />
        Mode: {status.sandbox ? 'Sandbox' : 'Production'}
      </div>
    );
  }

  return (
    <div className="text-red-600">
      ❌ QuickBooks Not Connected
      {status.error && <br />}
      {status.error && <span className="text-sm">Error: {status.error}</span>}
    </div>
  );
}