// Create a simple test server to capture exactly what QuickBooks sends

import { createServer } from 'http';
import { parse } from 'url';

const server = createServer((req, res) => {
  const parsedUrl = parse(req.url, true);
  
  if (parsedUrl.pathname === '/test-callback') {
    console.log('\n=== QUICKBOOKS CALLBACK RECEIVED ===');
    console.log('Full URL:', req.url);
    console.log('Query Parameters:', parsedUrl.query);
    console.log('');
    
    console.log('Parameter Analysis:');
    Object.entries(parsedUrl.query).forEach(([key, value]) => {
      console.log(`- ${key}: "${value}" (type: ${typeof value}, length: ${value?.length || 0})`);
    });
    
    const { code, state, realmId, error } = parsedUrl.query;
    
    console.log('\nCritical Parameter Check:');
    console.log(`- code exists: ${!!code}`);
    console.log(`- state exists: ${!!state}`);
    console.log(`- state value: "${state}"`);
    console.log(`- state === "undefined": ${state === 'undefined'}`);
    console.log(`- realmId exists: ${!!realmId}`);
    console.log(`- realmId value: "${realmId}"`);
    console.log(`- error exists: ${!!error}`);
    
    // Send response back to QuickBooks
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <html>
        <head><title>Test Callback Received</title></head>
        <body>
          <h1>QuickBooks Test Callback</h1>
          <p>Parameters captured successfully!</p>
          <pre>${JSON.stringify(parsedUrl.query, null, 2)}</pre>
          <script>
            // Redirect back to main app after showing results
            setTimeout(() => {
              window.location.href = 'https://inkticate-time-tracker-pooranrajput.replit.app/';
            }, 3000);
          </script>
        </body>
      </html>
    `);
    
    return;
  }
  
  // For other paths, show instructions
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <html>
      <head><title>QuickBooks Test Server</title></head>
      <body>
        <h1>QuickBooks OAuth Test Server</h1>
        <p>Test callback endpoint: <code>/test-callback</code></p>
        <p>Use this URL as redirect URI temporarily to debug what QuickBooks sends</p>
      </body>
    </html>
  `);
});

const PORT = 3002;
server.listen(PORT, () => {
  console.log(`\nTest callback server running on port ${PORT}`);
  console.log(`Test callback URL: http://localhost:${PORT}/test-callback`);
  console.log('');
  console.log('DEBUGGING STRATEGY:');
  console.log('1. We will temporarily change the redirect URI to this test server');
  console.log('2. Generate a new OAuth URL pointing to this test server');
  console.log('3. See exactly what parameters QuickBooks sends us');
  console.log('4. This will reveal if QuickBooks is corrupting the state parameter');
  console.log('');
});

// Auto-shutdown after 10 minutes
setTimeout(() => {
  console.log('Test server shutting down...');
  server.close();
  process.exit(0);
}, 600000);