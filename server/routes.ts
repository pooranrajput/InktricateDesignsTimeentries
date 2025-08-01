import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertTimeEntrySchema, updateTimeEntrySchema, updateUserSchema } from "@shared/schema";
import { backupService } from "./backup";
import { protectData } from "./protection";
import { z } from "zod";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// Middleware to check if user is authenticated
const isAuthenticated = (req: any, res: any, next: any) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

export function registerRoutes(app: Express): Server {
  
  // Simple test route
  app.get('/api/test-route', (req: any, res) => {
    console.log('✅ Test route hit successfully');
    res.json({ message: 'Test route working', timestamp: Date.now() });
  });

  // Setup authentication (login, logout, etc.)
  setupAuth(app);

  // Current user endpoint
  app.get("/api/user", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        homeAddress: user.homeAddress,
        inktricateStartDate: user.inktricateStartDate,
        role: user.role,
        hourlyRate: user.hourlyRate,
        mustResetPassword: user.mustResetPassword,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      });
    } catch (error: any) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Update user profile
  app.patch("/api/user", isAuthenticated, async (req: any, res) => {
    try {
      const updateData = updateUserSchema.parse(req.body);
      if (updateData.id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ message: "Cannot update other users" });
      }
      
      const updatedUser = await storage.updateUser(updateData.id || req.user.id, updateData);
      res.json(updatedUser);
    } catch (error: any) {
      console.error("Error updating user:", error);
      res.status(400).json({ message: error.message });
    }
  });

  // Dashboard stats
  app.get("/api/stats/dashboard", isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Admin only" });
      }

      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      
      const employees = await storage.getAllEmployees();
      const activeEmployees = employees.filter(emp => emp.isActive);
      
      const monthlyReport = await storage.getMonthlyPayrollReport(currentYear, currentMonth);
      
      const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
      const currentDay = now.getDate();
      const daysRemaining = daysInMonth - currentDay;

      res.json({
        totalEmployees: activeEmployees.length,
        monthlyHours: monthlyReport.totalHours,
        monthlyPayroll: monthlyReport.totalPayroll,
        daysRemaining: Math.max(0, daysRemaining)
      });
    } catch (error: any) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Time entry routes
  app.post("/api/time-entries", isAuthenticated, async (req: any, res) => {
    try {
      const entryData = insertTimeEntrySchema.parse(req.body);
      
      if (entryData.userId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ message: "Cannot create time entries for other users" });
      }

      const timeEntry = await storage.createTimeEntry(entryData);
      res.json(timeEntry);
    } catch (error: any) {
      console.error("Error creating time entry:", error);
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/time-entries", isAuthenticated, async (req: any, res) => {
    try {
      const { startDate, endDate, userId } = req.query;
      
      let entries;
      if (req.user.role === 'admin' && userId) {
        entries = await storage.getUserTimeEntries(
          userId as string,
          startDate ? new Date(startDate as string) : undefined,
          endDate ? new Date(endDate as string) : undefined
        );
      } else {
        entries = await storage.getUserTimeEntries(
          req.user.id,
          startDate ? new Date(startDate as string) : undefined,
          endDate ? new Date(endDate as string) : undefined
        );
      }
      
      res.json(entries);
    } catch (error: any) {
      console.error("Error fetching time entries:", error);
      res.status(500).json({ message: "Failed to fetch time entries" });
    }
  });

  app.patch("/api/time-entries/:id", isAuthenticated, async (req: any, res) => {
    try {
      const timeEntryId = parseInt(req.params.id);
      const updates = updateTimeEntrySchema.parse(req.body);
      
      const existingEntry = await storage.getTimeEntry(timeEntryId);
      if (!existingEntry) {
        return res.status(404).json({ message: "Time entry not found" });
      }
      
      if (existingEntry.userId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ message: "Cannot update other users' time entries" });
      }

      const updatedEntry = await storage.updateTimeEntry(timeEntryId, updates);
      res.json(updatedEntry);
    } catch (error: any) {
      console.error("Error updating time entry:", error);
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/time-entries/:id", isAuthenticated, async (req: any, res) => {
    try {
      const timeEntryId = parseInt(req.params.id);
      
      const existingEntry = await storage.getTimeEntry(timeEntryId);
      if (!existingEntry) {
        return res.status(404).json({ message: "Time entry not found" });
      }
      
      if (existingEntry.userId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ message: "Cannot delete other users' time entries" });
      }

      await storage.deleteTimeEntry(timeEntryId);
      res.json({ message: "Time entry deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting time entry:", error);
      res.status(500).json({ message: "Failed to delete time entry" });
    }
  });

  // Employee management routes (Admin only)
  app.get("/api/employees", isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Admin only" });
      }
      
      const employees = await storage.getAllEmployees();
      res.json(employees);
    } catch (error: any) {
      console.error("Error fetching employees:", error);
      res.status(500).json({ message: "Failed to fetch employees" });
    }
  });

  app.post("/api/employees", isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Admin only" });
      }
      
      const employee = await storage.createEmployee(req.body);
      res.json(employee);
    } catch (error: any) {
      console.error("Error creating employee:", error);
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/employees/:id", isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Admin only" });
      }
      
      const userId = req.params.id;
      const updates = req.body;
      
      const updatedUser = await storage.updateUser(userId, updates);
      res.json(updatedUser);
    } catch (error: any) {
      console.error("Error updating employee:", error);
      res.status(400).json({ message: error.message });
    }
  });

  // Monthly reports
  app.get("/api/reports/monthly", isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Admin only" });
      }
      
      const { year, month } = req.query;
      
      if (!year || !month) {
        return res.status(400).json({ message: "Year and month are required" });
      }
      
      const report = await storage.getMonthlyPayrollReport(
        parseInt(year as string),
        parseInt(month as string)
      );
      
      res.json(report);
    } catch (error: any) {
      console.error("Error generating monthly report:", error);
      res.status(500).json({ message: "Failed to generate monthly report" });
    }
  });

  // Backup endpoints
  app.post("/api/backup/create", isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Admin only" });
      }
      
      const backupFile = await backupService.createBackup('manual-admin-request');
      res.json({ 
        success: true, 
        message: 'Backup created successfully',
        filename: backupFile
      });
    } catch (error: any) {
      console.error("Error creating backup:", error);
      res.status(500).json({ message: "Failed to create backup" });
    }
  });

  // Data protection endpoints
  app.post("/api/protection/activate", isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Admin only" });
      }
      
      protectData();
      res.json({ 
        success: true, 
        message: 'Data protection activated'
      });
    } catch (error: any) {
      console.error("Error activating protection:", error);
      res.status(500).json({ message: "Failed to activate protection" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}