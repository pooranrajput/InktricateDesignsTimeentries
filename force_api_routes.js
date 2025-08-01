// Force API routes to work by creating direct endpoints
const express = require('express');
const { db } = require('./server/db');
const { quickbooksConfig } = require('./shared/schema');

const app = express();
app.use(express.json());

// Simple test endpoint
app.get('/test', (req, res) => {
  res.json({ status: 'API routes working!', timestamp: new Date().toISOString() });
});

// QuickBooks status endpoint
app.get('/qb-status', async (req, res) => {
  try {
    console.log('🔍 Direct QB status check...');
    const configs = await db.select().from(quickbooksConfig);
    
    const hasValidConfig = configs.length > 0 && 
      configs.some((config) => config.accessToken && config.refreshToken && 
      (!config.tokenExpiry || new Date() < config.tokenExpiry));
    
    if (hasValidConfig) {
      const config = configs[0];
      console.log(`✅ Valid QB config: Company ${config.companyId}`);
      res.json({
        connected: true,
        companyId: config.companyId,
        sandbox: config.sandbox,
        tokenExpiry: config.tokenExpiry,
        message: 'QuickBooks connection confirmed!'
      });
    } else {
      console.log('❌ No valid QB config found');
      res.json({ connected: false, message: 'No valid QuickBooks configuration' });
    }
  } catch (error) {
    console.error("Direct QB status error:", error);
    res.status(500).json({ error: error.message, connected: false });
  }
});

const port = 3001;
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Direct API server running on port ${port}`);
  console.log(`Test: https://inkticate-time-tracker-pooranrajput.replit.app:${port}/test`);
  console.log(`QB Status: https://inkticate-time-tracker-pooranrajput.replit.app:${port}/qb-status`);
});