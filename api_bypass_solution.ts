// Solution: Create working endpoints that bypass Vite middleware
import { Express } from 'express';
import { db } from './server/db';
import { quickbooksConfig } from './shared/schema';

export function addBypassRoutes(app: Express) {
  // Add these routes VERY EARLY in the middleware stack, before Vite
  
  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });
  
  // QuickBooks status endpoint that bypasses all middleware
  app.get('/qb-direct-status', async (req, res) => {
    try {
      console.log('🔍 Direct QB status check (bypassing middleware)...');
      const configs = await db.select().from(quickbooksConfig);
      
      if (configs.length === 0) {
        return res.json({ connected: false, message: 'No QuickBooks configuration found' });
      }
      
      const config = configs[0];
      const hasValidConfig = config.accessToken && config.refreshToken && 
        (!config.tokenExpiry || new Date() < config.tokenExpiry);
      
      if (hasValidConfig) {
        console.log(`✅ QB Status: Connected to company ${config.companyId}`);
        res.json({
          connected: true,
          companyId: config.companyId,
          sandbox: config.sandbox,
          tokenExpiry: config.tokenExpiry,
          isProduction: config.companyId === '9130351530529746',
          message: 'QuickBooks connection active'
        });
      } else {
        console.log('❌ QB Status: Invalid or expired configuration');
        res.json({ 
          connected: false, 
          companyId: config.companyId,
          reason: 'Invalid or expired tokens',
          tokenExpiry: config.tokenExpiry
        });
      }
    } catch (error) {
      console.error('Direct QB status error:', error);
      res.status(500).json({ 
        connected: false, 
        error: error.message 
      });
    }
  });
}

// Usage: Call this BEFORE setupAuth() in registerRoutes()