// Alternative solution: Create a separate API server if middleware approach fails
const express = require('express');
const { db } = require('./server/db');
const { quickbooksConfig } = require('./shared/schema');

const apiApp = express();
apiApp.use(express.json());

// Simple status endpoint that bypasses Vite entirely
apiApp.get('/status', async (req, res) => {
  try {
    const configs = await db.select().from(quickbooksConfig);
    
    const hasValidConfig = configs.length > 0 && 
      configs.some((config) => config.accessToken && config.refreshToken && 
      (!config.tokenExpiry || new Date() < config.tokenExpiry));
    
    if (hasValidConfig) {
      const config = configs[0];
      console.log(`QuickBooks status check: Company ${config.companyId}, Valid: true`);
      res.json({
        connected: true,
        companyId: config.companyId,
        sandbox: config.sandbox,
        tokenExpiry: config.tokenExpiry
      });
    } else {
      res.json({ connected: false });
    }
  } catch (error) {
    console.error("Status check error:", error);
    res.json({ connected: false, error: error.message });
  }
});

// Start on port 5001 if main server API routes fail
if (require.main === module) {
  const port = 5001;
  apiApp.listen(port, '0.0.0.0', () => {
    console.log(`Backup API server running on port ${port}`);
  });
}

module.exports = apiApp;