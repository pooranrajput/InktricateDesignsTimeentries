// Clean application - no external service configurations

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { backupService } from "./backup";
import { changeMonitor } from "./protection";



const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Aggressive cache busting for all static assets
app.use((req, res, next) => {
  if (req.url.includes('.js') || req.url.includes('.css') || req.url.includes('/assets/')) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Last-Modified', new Date().toUTCString());
  }
  next();
});

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

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  
  // CRITICAL: Add a specific middleware to ensure API routes are handled before Vite
  app.use('/api/*', (req, res, next) => {
    // If we reach this point, it means no API route matched
    // This should not happen if routes are properly defined
    console.log(`🚨 UNMATCHED API ROUTE: ${req.method} ${req.path}`);
    res.status(404).json({ error: 'API endpoint not found', path: req.path });
  });
  
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

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
    
    // Start backup and protection systems
    console.log('🛡️  INITIALIZING DATA PROTECTION SYSTEMS...');
    backupService.startAutomaticBackups();
    changeMonitor.startMonitoring();
    console.log('✅ DATA PROTECTION ACTIVE - Multiple backup layers enabled');
  });
})();
