// CRITICAL: Load production environment FIRST before any other imports
import { config } from 'dotenv';
config({ path: '.env.production', override: true });

// CRITICAL FIX: Force override environment variables AFTER dotenv loading
process.env.QUICKBOOKS_REDIRECT_URI = 'https://inkticate-time-tracker-pooranrajput.replit.app/api/quickbooks/callback';
process.env.REPLIT_DOMAINS = 'inkticate-time-tracker-pooranrajput.replit.app';
// Override incorrect Client ID with correct production value - MUST BE AFTER dotenv
process.env.QUICKBOOKS_CLIENT_ID = 'AB6HieH2iCWWSQ8jneSCittfIAKuPHIcujzio09raTAQV5EUtA';

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import path from "path";
import fs from "fs";
// import { backupService } from "./backup";
// import { changeMonitor } from "./protection";

console.log('🔧 Production Environment Override:', {
  replotDomains: process.env.REPLIT_DOMAINS,
  quickbooksRedirect: process.env.QUICKBOOKS_REDIRECT_URI,
  quickbooksClient: process.env.QUICKBOOKS_CLIENT_ID?.substring(0, 10) + '...',
  quickbooksClientChar11: process.env.QUICKBOOKS_CLIENT_ID?.charAt(10),
  sandbox: process.env.QUICKBOOKS_SANDBOX,
  clientIdLength: process.env.QUICKBOOKS_CLIENT_ID?.length
});

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    
    console.error(`❌ ERROR ${status} on ${req.method} ${req.path}:`, err);
    console.error('Stack:', err.stack);

    res.status(status).json({ message });
  });

  // Force development mode to serve frontend properly on Replit
  console.log(`🔧 Environment: ${app.get("env")}, forcing development mode for frontend serving`);
  
  // Check if required files exist before setting up Vite
  const clientPath = path.resolve(import.meta.dirname, "..", "client");
  const indexPath = path.resolve(clientPath, "index.html");
  console.log(`📁 Checking client path: ${clientPath}`);
  console.log(`📄 Checking index.html: ${indexPath}`);
  console.log(`✅ Client exists: ${fs.existsSync(clientPath)}`);
  console.log(`✅ Index.html exists: ${fs.existsSync(indexPath)}`);
  
  await setupVite(app, server);

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
    
    // Start backup and protection systems (temporarily disabled)
    console.log('🛡️  DATA PROTECTION TEMPORARILY DISABLED FOR SCHEMA FIX...');
    // backupService.startAutomaticBackups();
    // changeMonitor.startMonitoring();
    console.log('⚠️  BACKUP SERVICE DISABLED - Schema updates in progress');
  });
})();
