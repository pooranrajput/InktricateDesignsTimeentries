// Load environment configuration
import { config } from 'dotenv';
config();

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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

  // Bootstrap admin user to fix authentication deadlock for Bindiya's auto-salary feature
  try {
    const { bootstrapAdminUser } = await import("./auth");
    await bootstrapAdminUser();
  } catch (error) {
    console.error('⚠️  Admin bootstrap failed:', error);
    // Continue server startup even if bootstrap fails - this is non-blocking
  }

  // Debug: Log which routes are registered
  console.log('📍 Express routes registered:');
  app._router.stack.forEach((layer, index) => {
    if (layer.route) {
      console.log(`${index}: ${Object.keys(layer.route.methods)} ${layer.route.path}`);
    } else if (layer.name === 'router') {
      console.log(`${index}: Router middleware`);
    } else {
      console.log(`${index}: ${layer.name || 'Anonymous'} middleware`);
    }
  });

  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    
    console.error(`Error ${status} for ${req.method} ${req.path}:`, message);
    console.error(err.stack);

    if (!res.headersSent) {
      res.status(status).json({ message });
    }
  });

  // Prevent any /api requests from falling through to Vite SPA fallback
  app.use('/api', (_req, res) => {
    res.status(404).json({ message: 'API endpoint not found' });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
    console.log(`🌐 Time Tracking App ready at: https://inkticate-time-tracker-pooranrajput.replit.app`);
  });
})();
