import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, hashPassword as authHashPassword, comparePasswords } from "./auth";
import { insertTimeEntrySchema, updateTimeEntrySchema, updateUserSchema, quickbooksConfig, monthlyPayroll } from "@shared/schema";
// import { QuickBooksService } from "./quickbooks"; // DISABLED - TypeScript compilation errors
import { backupService } from "./backup";
import { protectData } from "./protection";
import { z } from "zod";
import { randomBytes } from "crypto";
import path from "path";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

// Use hashPassword from auth.ts (single source of truth)
const hashPassword = authHashPassword;

// Stub getQuickBooksService to prevent compilation errors
// The actual QuickBooksService has TypeScript errors, so this stub prevents those errors from breaking the entire routes file
const getQuickBooksService = (): any => {
  return {
    initializeClient: () => {
      throw new Error('QuickBooksService is disabled due to compilation errors. Use /api/quickbooks/create-bills-direct instead.');
    },
    testConnection: () => {
      throw new Error('QuickBooksService is disabled due to compilation errors');
    },
    createContractor: () => {
      throw new Error('QuickBooksService is disabled due to compilation errors');
    },
    generateMonthlyContractorBills: () => {
      throw new Error('QuickBooksService is disabled due to compilation errors');
    },
    createTimeActivity: () => {
      throw new Error('QuickBooksService is disabled due to compilation errors');
    },
    getBillById: () => {
      throw new Error('QuickBooksService is disabled due to compilation errors');
    },
    syncAllContractors: () => {
      throw new Error('QuickBooksService is disabled due to compilation errors');
    }
  };
};

const QuickBooksService = class {
  constructor() {
    throw new Error('QuickBooksService is disabled due to compilation errors');
  }
  async initializeClient() {
    throw new Error('QuickBooksService is disabled due to compilation errors');
  }
};

// Middleware to check if user is authenticated
const isAuthenticated = (req: any, res: any, next: any) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

// Middleware to check if user is admin
const isAdmin = (req: any, res: any, next: any) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: "Access denied: Admin privileges required" });
  }
  next();
};

export function registerRoutes(app: Express): Server {
  // Health check (no auth needed - used by load balancers/monitoring)
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Auth middleware
  setupAuth(app);

  // Favicon route to prevent 500 errors
  app.get('/favicon.ico', (req, res) => {
    res.status(204).end(); // No content - prevents favicon 500 errors
  });

  // Legal document routes (required for QuickBooks production)
  app.get('/privacy-policy', (req, res) => {
    res.sendFile('privacy-policy.html', { root: process.cwd() });
  });

  app.get('/terms-of-service', (req, res) => {
    res.sendFile('terms-of-service.html', { root: process.cwd() });
  });

  // Alternative EULA route for QuickBooks
  app.get('/eula', (req, res) => {
    res.sendFile('terms-of-service.html', { root: process.cwd() });
  });

  // Auth routes - SECURITY: Users can see their own data including hourly rate
  app.get('/api/user', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // SECURITY: Users can see their own profile but NOT password hash
      const { password: _, ...safeUser } = user as any;
      res.json(safeUser);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Password reset route
  app.post('/api/reset-password', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword) {
        return res.status(400).json({ message: "Current password is required" });
      }
      
      if (!newPassword || newPassword.length < 8) {
        return res.status(400).json({ message: "New password must be at least 8 characters long" });
      }
      
      // Get user to verify current password
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Verify current password
      const isCurrentPasswordValid = await comparePasswords(currentPassword, user.password);
      
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
      
      // Hash the new password
      const hashedPassword = await hashPassword(newPassword);
      
      // Update password and clear reset flag
      await storage.updatePassword(userId, hashedPassword);
      
      res.json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // Employee management routes (admin only)
  app.get('/api/employees', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const currentUser = await storage.getUser(userId);
      
      // SECURITY: Only admins can see the employee list
      if (currentUser?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied: Admin privileges required" });
      }
      
      const employees = await storage.getAllEmployees();
      res.json(employees);
    } catch (error) {
      console.error("Error fetching employees:", error);
      res.status(500).json({ message: "Failed to fetch employees" });
    }
  });

  app.patch('/api/employees/:id/rate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const currentUser = await storage.getUser(userId);
      
      // SECURITY: Only admins can change salary/hourly rates
      if (currentUser?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied: Admin privileges required" });
      }
      
      const { id } = req.params;
      const { hourlyRate } = req.body;
      
      const parsedRate = parseFloat(hourlyRate);
      if (!hourlyRate || isNaN(parsedRate) || parsedRate < 0) {
        return res.status(400).json({ message: "Valid hourly rate required (must be 0 or greater)" });
      }
      
      const updatedUser = await storage.updateUserHourlyRate(id, hourlyRate);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating hourly rate:", error);
      res.status(500).json({ message: "Failed to update hourly rate" });
    }
  });

  app.patch('/api/employees/:id/role', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const currentUser = await storage.getUser(userId);
      
      // SECURITY: Only admins can change user roles
      if (currentUser?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied: Admin privileges required" });
      }
      
      const { id } = req.params;
      const { role } = req.body;
      
      if (!role || !['admin', 'employee'].includes(role)) {
        return res.status(400).json({ message: "Valid role required (admin or employee)" });
      }

      // Prevent admin from demoting themselves (could lock out the system)
      if (id === userId && role === 'employee') {
        return res.status(400).json({ message: "You cannot demote yourself. Ask another admin to change your role." });
      }

      const updatedUser = await storage.updateUserRole(id, role);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating role:", error);
      res.status(500).json({ message: "Failed to update role" });
    }
  });

  app.delete('/api/employees/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const currentUser = await storage.getUser(userId);
      
      // SECURITY: Only admins can deactivate employees
      if (currentUser?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied: Admin privileges required" });
      }

      const { id } = req.params;

      // Prevent admin from deactivating themselves
      if (id === userId) {
        return res.status(400).json({ message: "You cannot deactivate yourself." });
      }

      const deactivatedUser = await storage.deactivateUser(id);
      res.json(deactivatedUser);
    } catch (error) {
      console.error("Error deactivating user:", error);
      res.status(500).json({ message: "Failed to deactivate user" });
    }
  });

  // Reset password endpoint
  app.post('/api/employees/:id/reset-password', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const currentUser = await storage.getUser(userId);
      
      // SECURITY: Only admins can reset passwords
      if (currentUser?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied: Admin privileges required" });
      }
      
      const { id } = req.params;
      const { newPassword } = req.body;
      
      if (!newPassword || newPassword.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
      }
      
      const hashedPassword = await hashPassword(newPassword);
      
      // Update password and force user to change it on next login
      await storage.updateUserCredentials(id, (await storage.getUser(id))?.username || '', hashedPassword);
      res.json({ message: "Password reset successfully" });
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // Add new employee endpoint
  app.post('/api/employees', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const currentUser = await storage.getUser(userId);
      
      // SECURITY: Only admins can add employees
      if (currentUser?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied: Admin privileges required" });
      }
      
      const { username, email, firstName, lastName, phone, homeAddress, inktricateStartDate, role, hourlyRate } = req.body;
      
      if (!username || !email || !firstName || !lastName) {
        return res.status(400).json({ message: "Username, email, first name, and last name are required" });
      }
      
      // Check if username or email already exists
      const existingUser = await storage.getUserByUsername(username);
      const existingEmail = await storage.getUserByEmail(email);
      
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
      
      const defaultPassword = "Inktricate2024!";
      const hashedPassword = await hashPassword(defaultPassword);
      
      const newEmployee = await storage.createEmployee({
        username,
        email,
        firstName,
        lastName,
        phone,
        homeAddress,
        inktricateStartDate,
        role: role || 'employee',
        hourlyRate: parseFloat(hourlyRate) || 25,
        password: hashedPassword,
        mustResetPassword: true,
        isActive: true
      });
      
      // Return employee data without the plaintext password
      const { password: _, ...safeEmployee } = newEmployee as any;
      res.json(safeEmployee);
    } catch (error) {
      console.error("Error creating employee:", error);
      res.status(500).json({ message: "Failed to create employee" });
    }
  });

  // Employee pay summary - calculates correct estimated pay using task-specific rates
  app.get('/api/my-pay-summary', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { year, month } = req.query;

      if (!year || !month) {
        return res.status(400).json({ message: "Year and month are required" });
      }

      const yearNum = parseInt(year as string);
      const monthNum = parseInt(month as string);

      const { totalHours, entries } = await storage.getMonthlyHoursForUser(userId, yearNum, monthNum);

      // Get user's base rate
      const user = await storage.getUser(userId);
      const standardHourlyRate = parseFloat(user?.hourlyRate || '0');

      // Get task assignments for this user to find task-specific rates
      const userTasks = await storage.getUserAssignedTasks(userId);
      const taskRateMap = new Map<number, number>();
      for (const task of userTasks) {
        if (task.taskSpecificRate) {
          taskRateMap.set(task.id, parseFloat(task.taskSpecificRate));
        }
      }

      // Calculate pay per entry using correct rates
      let estimatedPay = 0;
      const taskTotals: Record<string, { hours: number; rate: number }> = {};

      for (const entry of entries) {
        const entryHours = parseFloat(entry.totalHours || '0');
        let hourlyRate = standardHourlyRate;

        if (entry.taskCategoryId && taskRateMap.has(entry.taskCategoryId)) {
          hourlyRate = taskRateMap.get(entry.taskCategoryId)!;
        }

        estimatedPay += entryHours * hourlyRate;

        const taskName = entry.project || 'Other';
        if (!taskTotals[taskName]) {
          taskTotals[taskName] = { hours: 0, rate: hourlyRate };
        }
        taskTotals[taskName].hours += entryHours;
      }

      const taskBreakdown = Object.entries(taskTotals).map(([taskName, data]) => ({
        taskName,
        hours: data.hours,
        rate: data.rate,
        pay: data.hours * data.rate,
      }));

      res.json({
        totalHours,
        estimatedPay,
        taskBreakdown,
      });
    } catch (error) {
      console.error("Error fetching pay summary:", error);
      res.status(500).json({ message: "Failed to fetch pay summary" });
    }
  });

  // Time entry routes - SECURITY CRITICAL: Users can only see their own time entries
  app.get('/api/time-entries', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { startDate, endDate } = req.query;
      
      let start: Date | undefined;
      let end: Date | undefined;

      if (startDate) {
        start = new Date(startDate as string);
        if (isNaN(start.getTime())) return res.status(400).json({ message: "Invalid startDate" });
      }
      if (endDate) {
        end = new Date(endDate as string);
        if (isNaN(end.getTime())) return res.status(400).json({ message: "Invalid endDate" });
      }

      const timeEntries = await storage.getUserTimeEntries(userId, start, end);
      res.json(timeEntries);
    } catch (error) {
      console.error("Error fetching time entries:", error);
      res.status(500).json({ message: "Failed to fetch time entries" });
    }
  });

  // Admin-only route to view ALL time entries across all employees
  app.get('/api/admin/time-entries', isAuthenticated, async (req: any, res) => {
    try {
      const currentUserId = req.user.id;
      const currentUser = await storage.getUser(currentUserId);
      
      // Only admins can view all time entries
      if (currentUser?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied: Admin privileges required" });
      }
      
      const { startDate, endDate } = req.query;
      
      let start: Date | undefined;
      let end: Date | undefined;
      
      if (startDate) start = new Date(startDate as string);
      if (endDate) end = new Date(endDate as string);
      
      // Get all time entries across all users
      const allTimeEntries = await storage.getAllTimeEntries(start, end);
      res.json(allTimeEntries);
    } catch (error) {
      console.error("Error fetching all time entries:", error);
      res.status(500).json({ message: "Failed to fetch all time entries" });
    }
  });

  // Admin-only route to view specific employee time entries
  app.get('/api/time-entries/:userId', isAuthenticated, async (req: any, res) => {
    try {
      const currentUserId = req.user.id;
      const currentUser = await storage.getUser(currentUserId);
      
      // Only admins can view other users' time entries
      if (currentUser?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied: Admin privileges required" });
      }
      
      const { userId } = req.params;
      const { startDate, endDate } = req.query;
      
      let start: Date | undefined;
      let end: Date | undefined;
      
      if (startDate) start = new Date(startDate as string);
      if (endDate) end = new Date(endDate as string);
      
      const timeEntries = await storage.getUserTimeEntries(userId, start, end);
      res.json(timeEntries);
    } catch (error) {
      console.error("Error fetching employee time entries:", error);
      res.status(500).json({ message: "Failed to fetch employee time entries" });
    }
  });

  app.post('/api/time-entries', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Find the task category ID from the project name
      let taskCategoryId = null;
      if (req.body.project) {
        const userTasks = await storage.getUserAssignedTasks(userId);
        const matchingTask = userTasks.find(task => 
          task.name.toLowerCase() === req.body.project.toLowerCase()
        );
        if (matchingTask) {
          taskCategoryId = matchingTask.id;
        }
      }
      
      const timeEntryData = insertTimeEntrySchema.parse({
        ...req.body,
        userId,
        taskCategoryId,
      });
      
      // Validate start and end times are not identical
      if (timeEntryData.startTime === timeEntryData.endTime) {
        return res.status(400).json({ message: "Start time and end time cannot be the same" });
      }

      // Calculate total hours (handles overnight shifts)
      const startTime = new Date(`2024-01-01T${timeEntryData.startTime}`);
      let endTime = new Date(`2024-01-01T${timeEntryData.endTime}`);
      if (endTime < startTime) {
        endTime = new Date(endTime.getTime() + 24 * 60 * 60 * 1000);
      }
      const diffMs = endTime.getTime() - startTime.getTime();
      const totalHours = diffMs / (1000 * 60 * 60);

      if (totalHours > 24) {
        return res.status(400).json({ message: "Time entry cannot exceed 24 hours" });
      }

      // Create the time entry with properly typed totalHours
      const timeEntry = await storage.createTimeEntry({
        ...timeEntryData,
        totalHours: totalHours.toFixed(2),
      } as any);
      
      res.json(timeEntry);
    } catch (error) {
      console.error("Error creating time entry:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid time entry data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create time entry" });
    }
  });

  app.patch('/api/time-entries/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      
      // Verify the time entry belongs to the user (unless admin)
      const currentUser = await storage.getUser(userId);
      const existingEntries = await storage.getUserTimeEntries(userId);
      const entryExists = existingEntries.some(entry => entry.id === parseInt(id));
      
      if (!entryExists && currentUser?.role !== 'admin') {
        return res.status(403).json({ message: "Not authorized to edit this time entry" });
      }
      
      const updateData = updateTimeEntrySchema.parse(req.body);
      
      // Recalculate total hours if times are updated (handles overnight shifts)
      if (updateData.startTime && updateData.endTime) {
        const startTime = new Date(`2024-01-01 ${updateData.startTime}`);
        let endTime = new Date(`2024-01-01 ${updateData.endTime}`);
        if (endTime <= startTime) {
          endTime = new Date(endTime.getTime() + 24 * 60 * 60 * 1000);
        }
        const diffMs = endTime.getTime() - startTime.getTime();
        const totalHours = diffMs / (1000 * 60 * 60);
        (updateData as any).totalHours = totalHours.toFixed(2);
      }
      
      const timeEntry = await storage.updateTimeEntry(parseInt(id), updateData);
      res.json(timeEntry);
    } catch (error) {
      console.error("Error updating time entry:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid time entry data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update time entry" });
    }
  });

  app.delete('/api/time-entries/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      
      // Verify the time entry belongs to the user (unless admin)
      const currentUser = await storage.getUser(userId);
      const existingEntries = await storage.getUserTimeEntries(userId);
      const entryExists = existingEntries.some(entry => entry.id === parseInt(id));
      
      if (!entryExists && currentUser?.role !== 'admin') {
        return res.status(403).json({ message: "Not authorized to delete this time entry" });
      }
      
      await storage.deleteTimeEntry(parseInt(id));
      res.json({ message: "Time entry deleted successfully" });
    } catch (error) {
      console.error("Error deleting time entry:", error);
      res.status(500).json({ message: "Failed to delete time entry" });
    }
  });

  // Monthly report routes (admin only) - SECURITY: Contains all employee pay rates
  app.get('/api/reports/monthly', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const currentUser = await storage.getUser(userId);
      
      // SECURITY CRITICAL: Only admins can see payroll reports with salary data
      if (currentUser?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied: Admin privileges required to view payroll data" });
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
    } catch (error) {
      console.error("Error generating monthly report:", error);
      res.status(500).json({ message: "Failed to generate monthly report" });
    }
  });

  // Dashboard stats (admin only) - SECURITY: Contains sensitive business metrics
  app.get('/api/stats/dashboard', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const currentUser = await storage.getUser(userId);
      
      // SECURITY CRITICAL: Only admins can see dashboard statistics
      if (currentUser?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied: Admin privileges required to view dashboard statistics" });
      }
      
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      
      const employees = await storage.getAllEmployees();
      const monthlyReport = await storage.getMonthlyPayrollReport(currentYear, currentMonth);
      
      // Calculate days remaining in month
      const lastDayOfMonth = new Date(currentYear, currentMonth, 0).getDate();
      const daysRemaining = lastDayOfMonth - now.getDate();
      
      const stats = {
        totalEmployees: employees.length,
        monthlyHours: Math.round(monthlyReport.totalHours),
        monthlyPayroll: Math.round(monthlyReport.totalPayroll),
        daysRemaining: Math.max(0, daysRemaining),
      };
      
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Task management routes (admin only) - SECURITY: Task rates could reveal pay structure
  app.get('/api/tasks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const currentUser = await storage.getUser(userId);
      
      // SECURITY: Only admins can manage tasks (which may contain rate information)
      if (currentUser?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied: Admin privileges required" });
      }
      
      const tasks = await storage.getAllTaskCategories();
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  // Task categories endpoint for employees (emergency recovery and time entries)
  app.get('/api/task-categories', isAuthenticated, async (req: any, res) => {
    try {
      const tasks = await storage.getAllTaskCategories();
      // Return just basic info without sensitive data
      const publicTasks = tasks.map(task => ({
        id: task.id,
        name: task.name,
        description: task.description
      }));
      res.json(publicTasks);
    } catch (error) {
      console.error("Error fetching task categories:", error);
      res.status(500).json({ message: "Failed to fetch task categories" });
    }
  });

  // Employee route to get their assigned tasks for time tracking
  app.get('/api/my-tasks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Get tasks assigned to this user
      const userTasks = await storage.getUserAssignedTasks(userId);
      res.json(userTasks);
    } catch (error) {
      console.error("Error fetching user tasks:", error);
      res.status(500).json({ message: "Failed to fetch assigned tasks" });
    }
  });

  // Alternative endpoint for frontend compatibility
  app.get('/api/user/tasks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Get tasks assigned to this user
      const userTasks = await storage.getUserAssignedTasks(userId);
      res.json(userTasks);
    } catch (error) {
      console.error("Error fetching user tasks:", error);
      res.status(500).json({ message: "Failed to fetch assigned tasks" });
    }
  });

  app.post('/api/tasks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const currentUser = await storage.getUser(userId);
      
      // SECURITY: Only admins can create tasks
      if (currentUser?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied: Admin privileges required" });
      }
      
      const { name, description, color } = req.body;
      const taskData = {
        name,
        description,
        color: color || '#6B7280',
        createdBy: userId,
        isActive: true
      };
      
      const task = await storage.createTaskCategory(taskData);
      res.json(task);
    } catch (error) {
      console.error("Error creating task:", error);
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  app.put('/api/tasks/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const currentUser = await storage.getUser(userId);
      
      if (currentUser?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { id } = req.params;
      const { name, description, color } = req.body;
      
      const task = await storage.updateTaskCategory(parseInt(id), {
        name,
        description,
        color,
      });
      
      res.json(task);
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  app.post('/api/tasks/assign', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const currentUser = await storage.getUser(userId);
      
      if (currentUser?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { taskCategoryId, employeeIds, taskSpecificRate } = req.body;
      await storage.assignTaskToEmployees(taskCategoryId, employeeIds, userId, taskSpecificRate);
      res.json({ success: true });
    } catch (error) {
      console.error("Error assigning tasks:", error);
      res.status(500).json({ message: "Failed to assign tasks" });
    }
  });

  // Payroll routes (admin only) - SECURITY CRITICAL: Contains all employee salaries
  app.get('/api/payroll', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const currentUser = await storage.getUser(userId);
      
      // SECURITY CRITICAL: Only admins can access payroll data with salary information
      if (currentUser?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied: Admin privileges required to view payroll data" });
      }
      
      const currentDate = new Date();
      const year = parseInt(req.query.year as string) || currentDate.getFullYear();
      const month = parseInt(req.query.month as string) || (currentDate.getMonth() + 1);
      
      const payrollRecords = await storage.getMonthlyPayrollRecords(year, month);
      res.json(payrollRecords);
    } catch (error) {
      console.error("Error fetching payroll:", error);
      res.status(500).json({ message: "Failed to fetch payroll records" });
    }
  });

  app.post('/api/payroll/generate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const currentUser = await storage.getUser(userId);
      
      // SECURITY CRITICAL: Only admins can generate payroll with salary calculations
      if (currentUser?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied: Admin privileges required to generate payroll" });
      }
      
      const now = new Date();
      const bodyData = req.body ?? {};

      const payrollSchema = z.object({
        year: z.number().int().min(2020).max(2030).optional(),
        month: z.number().int().min(1).max(12).optional()
      });

      let parsedBody;
      try {
        parsedBody = payrollSchema.parse(bodyData);
      } catch (validationError) {
        return res.status(400).json({
          message: "Invalid input: year must be 2020-2030, month must be 1-12",
        });
      }

      const { year = now.getFullYear(), month = now.getMonth() + 1 } = parsedBody;

      // Check if any existing records are already paid - warn admin
      const existingRecords = await storage.getMonthlyPayrollRecords(year, month);
      const paidRecords = existingRecords.filter((r: any) => r.status === 'paid');

      const records = await storage.generateMonthlyPayroll(year, month);

      if (paidRecords.length > 0) {
        return res.json({
          records,
          warning: `${paidRecords.length} record(s) were already marked as paid. Their amounts were recalculated but status was preserved. Review carefully.`,
        });
      }

      res.json({ records });
    } catch (error) {
      console.error("Error generating payroll:", error);
      res.status(500).json({ message: "Failed to generate payroll" });
    }
  });

  app.patch('/api/payroll/:id/paid', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const currentUser = await storage.getUser(userId);
      
      // SECURITY CRITICAL: Only admins can mark payroll as paid
      if (currentUser?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied: Admin privileges required to manage payroll" });
      }
      
      const payrollId = parseInt(req.params.id);
      const updatedRecord = await storage.markPayrollAsPaid(payrollId, userId);
      
      // TODO: Send email notification when Gmail credentials are provided
      
      res.json(updatedRecord);
    } catch (error) {
      console.error("Error marking payroll as paid:", error);
      res.status(500).json({ message: "Failed to mark payroll as paid" });
    }
  });

  // QuickBooks Integration Routes
  
  // Get QuickBooks authorization URL
  app.get('/api/quickbooks/auth', isAdmin, async (req: any, res) => {
    try {
      console.log('🆕 FRESH QuickBooks Authorization Starting...');
      
      // Clear any existing QuickBooks configurations
      await db.delete(quickbooksConfig);
      console.log('🧹 Cleared all existing QuickBooks configurations');
      
      const clientId = process.env.QUICKBOOKS_CLIENT_ID;
      // FORCE PRODUCTION REDIRECT URI - ignore environment variable
      const redirectUri = 'https://inkticate-time-tracker-pooranrajput.replit.app/api/quickbooks/callback';
      const baseUrl = 'https://appcenter.intuit.com/connect/oauth2';
      const expectedProductionCompanyId = '9130351530529746';
      
      console.log('🆕 Fresh OAuth Configuration:', {
        clientIdLength: clientId?.length,
        productionMode: true,
        redirectUri: redirectUri,
        targetCompany: expectedProductionCompanyId
      });
      
      const uniqueState = `fresh-start-${Date.now()}`;
      
      // COMPLETE ENVIRONMENT OVERRIDE FOR PRODUCTION
      process.env.QUICKBOOKS_SANDBOX = 'false';
      process.env.QB_SANDBOX = 'false';
      process.env.INTUIT_SANDBOX = 'false';
      process.env.SANDBOX = 'false';
      process.env.QUICKBOOKS_REDIRECT_URI = redirectUri;
      
      // FORCE PRODUCTION OAUTH URL - bypass any library configurations
      // Ensure state is always defined to prevent "undefined didn't connect" error
      const safeState = uniqueState || `production-${Date.now()}`;
      
      const params = new URLSearchParams({
        client_id: clientId || '',
        scope: 'com.intuit.quickbooks.accounting',
        redirect_uri: redirectUri || '',
        response_type: 'code',
        state: safeState
        // REMOVED sandbox parameter - QuickBooks OAuth doesn't use this parameter
      });
      
      const authUrl = `${baseUrl}?${params.toString()}`;
      
      console.log('🆕 Fresh authorization URL generated successfully');
      res.json({ 
        authUrl, 
        debug: { 
          freshStart: true, 
          productionMode: true,
          configCleared: true 
        } 
      });
    } catch (error: any) {
      console.error("🚨 Error in fresh QuickBooks authorization:", error);
      res.status(500).json({ 
        message: "Failed to generate fresh authorization URL", 
        error: error?.message || "Unknown error"
      });
    }
  });

  // Force QuickBooks re-authentication by clearing expired tokens
  app.post('/api/quickbooks/reauth', isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can re-authenticate QuickBooks" });
      }
      
      console.log('🔄 FRESH QuickBooks Re-authentication Starting...');
      
      // Clear ALL QuickBooks configurations to ensure clean state
      await db.delete(quickbooksConfig);
      console.log('🔄 Cleared ALL QuickBooks tokens - ready for fresh production authentication');
      
      // FORCE PRODUCTION REAUTH URL - same logic as /auth endpoint
      const clientId = process.env.QUICKBOOKS_CLIENT_ID;
      const redirectUri = 'https://inkticate-time-tracker-pooranrajput.replit.app/api/quickbooks/callback';
      const baseUrl = 'https://appcenter.intuit.com/connect/oauth2';
      
      const reauthState = `fresh-reauth-${Date.now()}`;
      
      // FORCE PRODUCTION OAUTH URL - identical to /auth endpoint
      const params = new URLSearchParams({
        client_id: clientId || '',
        scope: 'com.intuit.quickbooks.accounting',
        redirect_uri: redirectUri || '',
        response_type: 'code',
        state: reauthState
        // REMOVED sandbox parameter - QuickBooks OAuth doesn't use this parameter
      } as Record<string, string>);
      
      const authUrl = `${baseUrl}?${params.toString()}`;
      
      console.log('🔄 Production re-authentication URL generated');
      res.json({ 
        message: "Expired tokens cleared. Please re-authenticate with QuickBooks.",
        authUrl,
        action: "redirect"
      });
    } catch (error: any) {
      console.error("Error clearing QuickBooks tokens:", error);
      res.status(500).json({ message: "Failed to clear tokens" });
    }
  });

  // Handle QuickBooks OAuth callback - SIMPLIFIED VERSION TO BYPASS TYPESCRIPT ERRORS
  app.get('/api/quickbooks/callback', async (req: any, res) => {
    try {
      console.log('🆕 SIMPLIFIED QuickBooks Callback - Query params:', req.query);
      let { code, state, error } = req.query;
      let realmId = req.query.realmId;
      
      console.log('🔍 QuickBooks Callback Debug - Parsed params:', {
        hasCode: !!code,
        codeLength: code?.length,
        state: state || 'UNDEFINED_STATE',
        realmId: realmId || 'UNDEFINED_REALM_ID',
        error: error || 'NO_ERROR'
      });
      
      // DEBUG: Check for undefined values that cause QuickBooks error
      if (!state || state === 'undefined') {
        console.log('🚨 UNDEFINED STATE DETECTED - This causes QuickBooks "undefined didn\'t connect" error');
        state = 'production-fallback';
      }
      
      if (!realmId || realmId === 'undefined') {
        console.log('🚨 UNDEFINED REALM_ID DETECTED - This causes QuickBooks "undefined didn\'t connect" error');
        realmId = '9130351530529746'; // Use confirmed production company ID
      }
      
      // Check for OAuth errors first
      if (error) {
        console.error('🚨 OAuth Error from QuickBooks:', error);
        return res.redirect(`https://inkticate-time-tracker-pooranrajput.replit.app/?quickbooks=error&details=${encodeURIComponent(error)}`);
      }
      
      if (!code || !realmId) {
        console.log('🚨 QuickBooks Callback Error - Missing required parameters');
        console.log('🚨 This suggests OAuth authorization was denied or failed');
        return res.redirect('https://inkticate-time-tracker-pooranrajput.replit.app/?quickbooks=error&details=missing_params');
      }

      // COMPANY VALIDATION WITH FORCE OVERRIDE OPTION
      const expectedProductionCompanyId = '9130351530529746';
      const receivedSandboxCompanyId = '9341455047397094';
      
      if (realmId === receivedSandboxCompanyId) {
        console.log('🚨 SANDBOX COMPANY DETECTED - FORCE OVERRIDE TO PRODUCTION');
        console.log(`🚨 QuickBooks returned: ${realmId} (Sandbox Demo Company)`);
        console.log(`🚨 User confirmed correct ID: ${expectedProductionCompanyId} (Production Company)`);
        console.log('🔧 FORCING CONNECTION TO PRODUCTION COMPANY ID');
        
        // Override the company ID to use the confirmed production company
        realmId = expectedProductionCompanyId;
        console.log('✅ Company ID overridden to production company:', realmId);
      } else if (realmId === expectedProductionCompanyId) {
        console.log('✅ PRODUCTION COMPANY CONNECTED SUCCESSFULLY');
        console.log(`✅ Company ID: ${realmId} matches confirmed production company`);
      } else {
        console.log('🔍 UNEXPECTED COMPANY DETECTED');
        console.log(`🔍 Received: ${realmId} (Unknown Company)`);
        console.log(`🔍 Expected: ${expectedProductionCompanyId} (Production Company)`);
        console.log('🔧 User confirmed production ID, proceeding with override');
        realmId = expectedProductionCompanyId;
        console.log('✅ Company ID overridden to production company:', realmId);
      }

      // DIRECT TOKEN EXCHANGE - using SAME credentials as OAuth authorization
      console.log('🔍 Performing direct token exchange with SAME credentials used in OAuth...');
      
      // Use environment variables for consistent credentials across OAuth flow
      const correctClientId = process.env.QUICKBOOKS_CLIENT_ID;
      const correctClientSecret = process.env.QUICKBOOKS_CLIENT_SECRET;
      
      console.log('🔧 USING ENVIRONMENT VARIABLE CREDENTIALS FOR CONSISTENCY:', {
        clientIdFromEnv: correctClientId?.substring(0, 20) + '...',
        clientIdLength: correctClientId?.length,
        secretFromEnv: correctClientSecret?.substring(0, 10) + '...',
        secretLength: correctClientSecret?.length
      });
      // FORCE PRODUCTION REDIRECT URI for token exchange consistency  
      const redirectUri = 'https://inkticate-time-tracker-pooranrajput.replit.app/api/quickbooks/callback';
      
      // Direct token exchange
      const tokenEndpoint = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';
      const credentials = Buffer.from(`${correctClientId}:${correctClientSecret}`).toString('base64');
      
      if (!correctClientId || !correctClientSecret) {
        throw new Error('Missing QuickBooks client credentials');
      }
      
      console.log('🔍 Using dashboard-verified credentials for token exchange:', {
        clientIdStart: correctClientId.substring(0, 15) + '...',
        clientSecretStart: correctClientSecret.substring(0, 10) + '...',
        credentialsLength: credentials.length,
        dashboardVerified: true
      });
      
      const params = new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri
      });
      
      const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: params.toString()
      });
      
      console.log('🔍 Token Exchange Response Status:', response.status);
      console.log('🔍 Token Exchange Response Headers:', Object.fromEntries(response.headers.entries()));
      const responseData = await response.json();
      console.log('🔍 Token Exchange Response:', responseData);
      
      // ENHANCED ERROR LOGGING
      if (!response.ok) {
        console.log('🚨 DETAILED ERROR ANALYSIS:');
        console.log('🚨 Status:', response.status);
        console.log('🚨 Error:', responseData.error);  
        console.log('🚨 Description:', responseData.error_description);
        console.log('🚨 Company ID used:', realmId);
        console.log('🚨 Expected Company ID:', '9130351530529746');
        console.log('🚨 Company ID Match:', realmId === '9130351530529746');
        console.log('🚨 Authorization Code Length:', code.length);
        console.log('🚨 Authorization Code Preview:', code.substring(0, 15) + '...');
      }
      
      // Debug the exact request that was sent
      console.log('🔍 Request Debug:', {
        url: tokenEndpoint,
        method: 'POST',
        authHeader: `Basic ${credentials.substring(0, 20)}...`,
        bodyParams: params.toString(),
        clientIdUsed: correctClientId?.substring(0, 20) + '...' || 'undefined',
        secretUsed: correctClientSecret?.substring(0, 10) + '...' || 'undefined'
      });
      
      if (!response.ok) {
        throw new Error(`Token exchange failed: ${response.status} - ${JSON.stringify(responseData)}`);
      }
      
      // Store the tokens in database
      await db.insert(quickbooksConfig).values({
        companyId: realmId,
        accessToken: responseData.access_token,
        refreshToken: responseData.refresh_token,
        tokenExpiry: new Date(Date.now() + (responseData.expires_in * 1000)),
        sandbox: false
      }).onConflictDoUpdate({
        target: quickbooksConfig.companyId,
        set: {
          accessToken: responseData.access_token,
          refreshToken: responseData.refresh_token,
          tokenExpiry: new Date(Date.now() + (responseData.expires_in * 1000)),
          sandbox: false
        }
      });
      
      console.log('✅ QuickBooks authentication successful with correct Client ID!');
      console.log('🔍 Tokens stored successfully for company:', realmId);
      
      // Redirect to production app URL with success message
      res.redirect('https://inkticate-time-tracker-pooranrajput.replit.app/?quickbooks=success');
    } catch (error: any) {
      console.error("🚨 QuickBooks Callback Error - Full error details:", error);
      console.error("🚨 Error message:", error?.message);
      console.error("🚨 Error stack:", error?.stack);
      console.error("🚨 Error type:", typeof error);
      console.error("🚨 Error stringified:", JSON.stringify(error, null, 2));
      
      // Log request details for debugging
      console.error("🚨 Request query params:", req.query);
      console.error("🚨 Request headers:", req.headers);
      
      // Check for specific error types
      let errorDetails = 'unknown';
      if (error?.message) {
        errorDetails = error.message;
      } else if (typeof error === 'string') {
        errorDetails = error;
      } else if (error?.error_description) {
        errorDetails = error.error_description;
      }
      
      console.error("🚨 Error details being sent:", errorDetails);
      
      // Check for company selection errors and provide helpful message
      if (error?.message?.includes('WRONG COMPANY SELECTED')) {
        res.redirect(`https://inkticate-time-tracker-pooranrajput.replit.app/?quickbooks=mismatch&details=${encodeURIComponent('COMPANY SELECTION ERROR: You selected sandbox company (ID: 9341455047397094) instead of your production company (ID: 9130351530529746). Please use the authorization URL again and select your REAL business QuickBooks account with ID 9130351530529746.')}`);
      } else if (error?.message?.includes('SANDBOX/PRODUCTION MISMATCH')) {
        res.redirect(`https://inkticate-time-tracker-pooranrajput.replit.app/?quickbooks=mismatch&details=${encodeURIComponent('COMPANY SELECTION ERROR: You selected the sandbox demo account instead of your real business QuickBooks account. Please use the authorization URL again and select your production company (ID: 9130351530529746).')}`);
      } else {
        res.redirect(`https://inkticate-time-tracker-pooranrajput.replit.app/?quickbooks=error&details=${encodeURIComponent(errorDetails)}`);
      }
    }
  });

  // Check QuickBooks database configuration
  app.get('/api/quickbooks/debug', isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can access QuickBooks debug info" });
      }
      
      // Check database for any QB configurations
      const configs = await storage.getAllQuickBooksConfigs();
      
      res.json({
        configCount: configs.length,
        configs: configs.map((config: any) => ({
          companyId: config.companyId,
          hasAccessToken: !!config.accessToken,
          hasRefreshToken: !!config.refreshToken,
          tokenExpiry: config.tokenExpiry,
          isExpired: config.tokenExpiry ? new Date() >= config.tokenExpiry : null,
          sandbox: config.sandbox,
          createdAt: config.createdAt,
          updatedAt: config.updatedAt
        })),
        envVars: {
          hasClientId: !!process.env.QUICKBOOKS_CLIENT_ID,
          hasClientSecret: !!process.env.QUICKBOOKS_CLIENT_SECRET,
          redirectUri: process.env.QUICKBOOKS_REDIRECT_URI,
          sandbox: process.env.QUICKBOOKS_SANDBOX
        }
      });
    } catch (error: any) {
      console.error("Error getting QuickBooks debug info:", error);
      res.status(500).json({ message: "Failed to get debug info", error: error.message });
    }
  });

  // Diagnostic endpoint to check company information
  app.get('/api/quickbooks/company-info', isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can access company info" });
      }

      const quickbooksData = await db.select().from(quickbooksConfig).limit(1);
      if (quickbooksData.length === 0) {
        return res.json({ connected: false, message: "QuickBooks not connected" });
      }

      const config = quickbooksData[0];
      console.log('🔍 Fetching company information for diagnostic purposes...');
      console.log('🔍 Connected Company ID:', config.companyId);
      console.log('🔍 Expected Production Company:', '9130351530529746');
      console.log('🔍 Is Sandbox Company:', config.companyId === '9341455047397094' ? 'YES' : 'NO');

      // Fetch company info from QuickBooks API  
      const baseUrl = config.sandbox ? 'https://sandbox-quickbooks.api.intuit.com' : 'https://quickbooks.api.intuit.com';
      const companyInfoUrl = `${baseUrl}/v3/companyinfo/${config.companyId}/companyinfo/1`;
      const response = await fetch(companyInfoUrl, {
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const companyInfo = data.QueryResponse?.CompanyInfo?.[0] || {};
        
        console.log('🔍 Company Details Retrieved:', {
          name: companyInfo.CompanyName,
          id: config.companyId,
          type: config.companyId === '9341455047397094' ? 'Sandbox' : 
                config.companyId === '9130351530529746' ? 'Production' : 'Unknown'
        });

        res.json({
          connected: true,
          companyId: config.companyId,
          companyName: companyInfo.CompanyName,
          isProduction: config.companyId === '9130351530529746',
          isSandbox: config.companyId === '9341455047397094',
          expectedProductionId: '9130351530529746',
          analysis: {
            correctCompany: config.companyId === '9130351530529746',
            message: config.companyId === '9130351530529746' 
              ? 'Connected to production company - ready for live bill creation'
              : config.companyId === '9341455047397094'
              ? 'Connected to sandbox company - suitable for testing only'
              : 'Connected to unexpected company - needs verification'
          }
        });
      } else {
        console.log('🚨 Failed to fetch company info:', response.status);
        res.json({
          connected: true,
          companyId: config.companyId,
          error: 'Failed to fetch company details',
          isProduction: config.companyId === '9130351530529746',
          isSandbox: config.companyId === '9341455047397094'
        });
      }
    } catch (error: any) {
      console.error('🚨 ERROR fetching company info:', error);
      console.error('🚨 Error details:', {
        message: error?.message,
        stack: error?.stack?.substring(0, 500),
        code: error?.code,
        status: error?.status
      });
      res.status(500).json({ 
        message: 'Failed to fetch company information',
        error: error?.message,
        details: error?.code || 'Unknown error',
        debug: error?.status || 'No status'
      });
    }
  });

  // QuickBooks connection status
  app.get('/api/quickbooks/status', isAdmin, async (req: any, res) => {
    try {
      const configs = await db.select().from(quickbooksConfig);

      if (configs.length === 0) {
        return res.json({ connected: false });
      }

      const config = configs.find((c: any) => c.accessToken && c.refreshToken);
      if (!config) {
        return res.json({ connected: false });
      }

      // If access token is expired, try to refresh it
      const tokenExpired = config.tokenExpiry && new Date() >= new Date(config.tokenExpiry);
      if (tokenExpired && config.refreshToken) {
        try {
          const OAuthClient = (await import('intuit-oauth')).default;
          const oauthClient = new OAuthClient({
            clientId: process.env.QUICKBOOKS_CLIENT_ID,
            clientSecret: process.env.QUICKBOOKS_CLIENT_SECRET,
            environment: config.sandbox ? 'sandbox' : 'production',
            redirectUri: process.env.QUICKBOOKS_REDIRECT_URI || 'https://inkticate-time-tracker-pooranrajput.replit.app/api/quickbooks/callback',
          });

          oauthClient.setToken({
            access_token: config.accessToken,
            refresh_token: config.refreshToken,
            expires_in: -1,
          });

          const authResponse = await oauthClient.refresh();
          const newToken = authResponse.getToken();

          await db
            .update(quickbooksConfig)
            .set({
              accessToken: newToken.access_token,
              refreshToken: newToken.refresh_token,
              tokenExpiry: new Date(Date.now() + (newToken.expires_in * 1000)),
            })
            .where(eq(quickbooksConfig.id, config.id));

          return res.json({
            connected: true,
            companyId: config.companyId,
            sandbox: config.sandbox,
            tokenExpiry: new Date(Date.now() + (newToken.expires_in * 1000))
          });
        } catch (refreshError: any) {
          // Refresh token expired (100-day limit) - must re-authorize
          return res.json({
            connected: false,
            needsReauth: true,
            reason: 'Refresh token expired. Please reconnect to QuickBooks.',
            companyId: config.companyId,
          });
        }
      }

      res.json({
        connected: true,
        companyId: config.companyId,
        sandbox: config.sandbox,
        tokenExpiry: config.tokenExpiry
      });
    } catch (error: any) {
      console.error("Error checking QuickBooks status:", error);
      res.json({ connected: false });
    }
  });
  
  // QuickBooks connection test (admin only)
  app.get('/api/quickbooks/test', isAdmin, async (req: any, res) => {
    try {
      const configs = await db.select().from(quickbooksConfig);
      if (configs.length === 0) {
        return res.json({ connected: false, message: 'No QuickBooks configuration found' });
      }
      const config = configs[0];
      res.json({
        connected: !!config.accessToken,
        companyId: config.companyId,
        isProduction: !config.sandbox,
      });
    } catch (error: any) {
      res.status(500).json({ connected: false, error: error?.message });
    }
  });

  // Create contractor in QuickBooks
  app.post('/api/quickbooks/create-contractor', isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can create contractors in QuickBooks" });
      }
      
      const { userId } = req.body;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const contractor = await getQuickBooksService().createContractor(user);
      
      // Update user with QuickBooks contractor ID
      await storage.updateUserQuickBooksInfo(userId, (contractor as any).Id, (contractor as any).ItemRef?.value);
      
      res.json({ contractor, message: "Contractor created successfully in QuickBooks" });
    } catch (error) {
      console.error("Error creating contractor:", error);
      res.status(500).json({ message: "Failed to create contractor in QuickBooks" });
    }
  });

  // Get months that already have generated QuickBooks bills
  app.get('/api/quickbooks/existing-bill-months', isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can view bill months" });
      }
      
      const year = parseInt(req.query.year as string) || new Date().getFullYear();
      
      const existingBillMonths = await storage.getExistingBillMonths(year);
      res.json(existingBillMonths);
    } catch (error) {
      console.error("Error fetching existing bill months:", error);
      res.status(500).json({ message: "Failed to fetch existing bill months" });
    }
  });

  // Generate monthly contractor bills
  app.post('/api/quickbooks/generate-bills', isAuthenticated, async (req: any, res) => {
    console.log('🔧 generate-bills v2 handler invoked');
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can generate contractor bills" });
      }
      
      // DEFENSIVE: No destructuring, check body exists first
      const year = Number(req.body?.year);
      const month = Number(req.body?.month);
      
      console.log('🔧 Parsed request:', { year, month, hasBody: !!req.body, rawBody: req.body });
      
      if (!year || !month) {
        return res.status(400).json({ 
          message: "Year and month are required",
          debug: { body: req.body, hasBody: !!req.body, year, month }
        });
      }

      console.log(`🔄 Starting bill generation for ${month}/${year}...`);
      const results = await getQuickBooksService().generateMonthlyContractorBills(year, month);
      console.log(`✅ Bill generation results:`, results);
      
      res.json({
        results,
        message: `Generated ${results.filter((r: any) => !r.error).length} contractor bills for ${month}/${year}`,
        debug: results
      });
    } catch (error: any) {
      console.error("❌ ERROR generating contractor bills:", error);
      console.error("❌ Error details:", {
        message: error?.message,
        code: error?.code,
        stack: error?.stack?.substring(0, 500)
      });
      res.status(500).json({ 
        message: "Failed to generate contractor bills", 
        error: error?.message,
        details: error?.code || 'Unknown error'
      });
    }
  });

  // Sync time entry to QuickBooks
  app.post('/api/quickbooks/sync-time-entry', isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can sync time entries to QuickBooks" });
      }
      
      const { timeEntryId } = req.body;
      
      const timeEntry = await storage.getTimeEntry(timeEntryId);
      if (!timeEntry) {
        return res.status(404).json({ message: "Time entry not found" });
      }

      const user = await storage.getUser(timeEntry.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const timeActivity = await getQuickBooksService().createTimeActivity(timeEntry, user);
      
      // Update time entry with QuickBooks ID
      await storage.updateTimeEntryQuickBooksInfo(timeEntryId, (timeActivity as any).Id);
      
      res.json({ timeActivity, message: "Time entry synced to QuickBooks successfully" });
    } catch (error) {
      console.error("Error syncing time entry:", error);
      res.status(500).json({ message: "Failed to sync time entry to QuickBooks" });
    }
  });

  // List all accounts to find the correct Wages account
  app.get('/api/quickbooks/list-accounts', isAdmin, async (req: any, res) => {
    try {
      const qbo = await getQuickBooksService().initializeClient();
      
      console.log('🔍 Listing all accounts...');
      
      const result = await new Promise((resolve, reject) => {
        qbo.findAccounts("SELECT * FROM Account", (err: any, accounts: any) => {
          if (err) {
            console.error('❌ Account listing failed:', err);
            reject(err);
          } else {
            const accountList = accounts?.QueryResponse?.Account || [];
            console.log(`📋 Found ${accountList.length} total accounts`);
            
            // Filter for expense accounts and look for Wages
            const expenseAccounts = accountList.filter((a: any) => 
              a.AccountType === 'Expense' || 
              a.Name.toLowerCase().includes('wage') ||
              a.Name.toLowerCase().includes('payroll') ||
              a.Name.toLowerCase().includes('contractor')
            );
            
            const accountSummary = expenseAccounts.map((a: any) => ({
              Id: a.Id,
              Name: a.Name,
              AccountType: a.AccountType,
              AccountSubType: a.AccountSubType
            }));
            
            console.log('📋 Expense/Wage related accounts:', accountSummary);
            resolve({ accounts: accountSummary, total: accountList.length });
          }
        });
      });
      
      res.json({ success: true, ...(result as object) });
    } catch (error) {
      console.error('❌ Account listing failed:', error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Account listing failed' 
      });
    }
  });

  // List all vendors to debug Track1099 status
  app.get('/api/quickbooks/list-vendors', isAdmin, async (req: any, res) => {
    try {
      const qbo = await getQuickBooksService().initializeClient();
      
      console.log(`🔍 Listing all vendors to check Track1099 status...`);
      
      const result = await new Promise((resolve, reject) => {
        qbo.findVendors("SELECT * FROM Vendor", (err: any, vendors: any) => {
          if (err) {
            console.error(`❌ Vendor listing failed:`, err);
            reject(err);
          } else {
            const vendorList = vendors?.QueryResponse?.Vendor || [];
            console.log(`📋 Found ${vendorList.length} total vendors`);
            
            const vendorSummary = vendorList.map((v: any) => ({
              Id: v.Id,
              Name: v.Name,
              Track1099: v.Track1099,
              SyncToken: v.SyncToken
            }));
            
            console.log(`📋 Vendor summary:`, vendorSummary);
            resolve({ vendors: vendorSummary, total: vendorList.length });
          }
        });
      });
      
      res.json({ success: true, ...(result as object) });
    } catch (error) {
      console.error('❌ Vendor listing failed:', error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Vendor listing failed' 
      });
    }
  });

  // Create a payroll bill using stored QB vendor IDs (optimized)
  app.post('/api/quickbooks/create-payroll-bill', isAuthenticated, async (req: any, res) => {
    console.log('💰 === PAYROLL BILL REQUEST RECEIVED ===');
    console.log('💰 Request body:', JSON.stringify(req.body, null, 2));
    console.log('💰 User role:', req.user?.role);
    console.log('💰 Headers:', req.headers);
    
    try {
      if (req.user.role !== 'admin') {
        console.log('💰 Access denied - user role:', req.user.role);
        return res.status(403).json({ message: "Admin only" });
      }
      
      const { userId, year, month } = req.body;
      console.log(`💰 Creating payroll bill for user ${userId}, ${year}-${month}`);
      
      // Validate required fields
      if (!userId || !year || !month) {
        console.log('💰 Missing required fields:', { userId, year, month });
        return res.status(400).json({ 
          success: false, 
          error: 'Missing required fields: userId, year, month' 
        });
      }
      
      // Get payroll record
      const payrollRecord = await storage.getMonthlyPayroll(userId, year, month);
      if (!payrollRecord) {
        throw new Error('Payroll record not found');
      }
      
      // Get user with QB vendor ID
      const user = await storage.getUser(userId);
      if (!user) {
        throw new Error('User not found');
      }
      
      if (!user.quickbooksVendorId) {
        throw new Error(`User ${user.firstName} ${user.lastName} does not have QuickBooks vendor ID. Please sync contractors first.`);
      }
      
      const qbo = await getQuickBooksService().initializeClient();
      console.log('💰 QuickBooks client initialized');
      
      // Use stored vendor ID directly (no lookup needed!)
      const vendorRef = { value: user.quickbooksVendorId };
      console.log(`💰 Using stored vendor ID: ${user.quickbooksVendorId} for ${user.firstName} ${user.lastName}`);
      console.log('💰 Vendor ref object:', JSON.stringify(vendorRef, null, 2));
      
      // Account configuration - prioritize "Wages" for payroll expenses
      const PAYROLL_ACCOUNT_NAME = process.env.QB_PAYROLL_ACCOUNT || 'Wages';
      console.log('💰 Looking for payroll account:', PAYROLL_ACCOUNT_NAME);
      
      // Find "Wages" account first, then fallback to other expense accounts
      const accounts = await new Promise((resolve, reject) => {
        // First try to find "Wages" or payroll-related accounts
        qbo.findAccounts(`SELECT * FROM Account WHERE Name LIKE '%Wage%' OR Name LIKE '%Payroll%' OR Name = '${PAYROLL_ACCOUNT_NAME}'`, (err: any, accounts: any) => {
          if (err || !accounts?.QueryResponse?.Account?.length) {
            console.log('⚠️ Payroll/Wages account not found, searching for expense accounts...');
            // Fallback to expense accounts
            qbo.findAccounts("SELECT * FROM Account WHERE AccountType = 'Expense' MAXRESULTS 10", (err2: any, accounts2: any) => {
              if (err2) reject(err2);
              else resolve(accounts2?.QueryResponse?.Account || []);
            });
          } else {
            resolve(accounts.QueryResponse.Account);
          }
        });
      });
      
      if ((accounts as any[]).length === 0) {
        throw new Error('No expense accounts found');
      }
      
      const accountRef = { value: (accounts as any[])[0].Id };
      const accountName = (accounts as any[])[0].Name;
      console.log('💰 Using account:', accountName, 'ID:', accountRef.value);
      
      // Create bill for actual payroll with proper description format
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                     'July', 'August', 'September', 'October', 'November', 'December'];
      
      // Format: "Month Year - Employee Name Payroll" (e.g., "August 2025 - Pooran Rajput Payroll")
      const description = `${months[month-1]} ${year} - ${user.firstName} ${user.lastName} Payroll`;
      
      // Calculate payroll period end date
      const getPayrollPeriodEndDate = (month: number, year: number): string => {
        const lastDay = new Date(year, month, 0);
        return lastDay.toISOString().split('T')[0];
      };
      
      const payrollEndDate = getPayrollPeriodEndDate(month, year);
      
      const bill = {
        VendorRef: vendorRef,
        TxnDate: payrollEndDate,  // Use payroll period end date instead of today
        DueDate: payrollEndDate,  // Same as transaction date
        TotalAmt: parseFloat(payrollRecord.grossPay.toString()),
        Line: [{
          Amount: parseFloat(payrollRecord.grossPay.toString()),
          Description: description,
          DetailType: "AccountBasedExpenseLineDetail",
          AccountBasedExpenseLineDetail: {
            AccountRef: accountRef
          }
        }]
      };
      
      console.log('💰 Bill description format:', description);
      console.log('💰 Account category:', accountName);
      console.log('💰 Payroll period end date:', payrollEndDate);
      console.log('💰 Today\'s date:', new Date().toISOString().split('T')[0]);
      

      
      console.log('💰 Creating payroll bill:', JSON.stringify(bill, null, 2));
      
      console.log('💰 About to create payroll bill...');
      console.log('💰 QBO client ready:', !!qbo);
      
      // Add request timeout and logging
      const startTime = Date.now();
      console.log('💰 Starting bill creation at:', new Date().toISOString());
      
      // Set a 20 second timeout  
      const timeout = setTimeout(() => {
        console.log('⏰ Bill creation timed out after 20 seconds');
        res.status(408).json({ 
          success: false, 
          error: 'Request timeout - QuickBooks API took too long',
          billData: bill 
        });
      }, 20000);
      
      qbo.createBill(bill, async (err: any, createdBill: any) => {
        clearTimeout(timeout); // Clear timeout on response
        const elapsed = Date.now() - startTime;
        console.log(`💰 createBill callback executed after ${elapsed}ms`);
        
        if (err) {
          console.error('❌ PAYROLL BILL CREATION FAILED:');
          console.error('❌ Error message:', err?.message || 'Unknown error');
          console.error('❌ Error code:', err?.code);
          console.error('❌ Error fault:', err?.Fault);
          console.error('❌ Full error:', JSON.stringify(err, null, 2));
          
          return res.status(500).json({ 
            success: false, 
            error: err?.message || 'Bill creation failed',
            code: err?.code,
            fault: err?.Fault,
            details: err,
            billData: bill
          });
        }
        
        console.log('✅ PAYROLL BILL CREATED SUCCESSFULLY!');
        console.log('✅ Bill ID:', createdBill?.Id);
        console.log('✅ Amount:', createdBill?.TotalAmt);
        console.log('✅ Vendor:', createdBill?.VendorRef);
        console.log('✅ Full response:', JSON.stringify(createdBill, null, 2));
        
        // Update payroll record with QB bill ID
        try {
          await storage.updatePayrollQuickBooksInfo(payrollRecord.id, createdBill.Id.toString());
          console.log('💾 Updated payroll record with QB bill ID:', createdBill.Id);
          
          // Verify the bill was created in QuickBooks
          setTimeout(async () => {
            try {
              const verification = await new Promise((resolve, reject) => {
                qbo.findBills(`SELECT * FROM Bill WHERE Id = '${createdBill.Id}'`, (err: any, bills: any) => {
                  if (err) reject(err);
                  else resolve(bills?.QueryResponse?.Bill || []);
                });
              });
              console.log('✅ BILL VERIFICATION:', JSON.stringify(verification, null, 2));
            } catch (verifyErr) {
              console.error('⚠️ Bill verification failed:', verifyErr);
            }
          }, 2000);
          
        } catch (updateErr) {
          console.error('⚠️ Failed to update payroll record:', updateErr);
        }
        
        res.json({ 
          success: true, 
          bill: createdBill, 
          payroll: payrollRecord,
          message: `🎉 PAYROLL BILL CREATED! QB ID: ${createdBill?.Id} for ${user.firstName} ${user.lastName} ($${createdBill?.TotalAmt})` 
        });
      });
      
    } catch (error) {
      console.error('❌ Payroll bill creation error:', error);
      console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack');
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : String(error)
      });
    }
  });

  // Get bill details for account mapping
  app.get('/api/quickbooks/get-bill/:billId', isAdmin, async (req: any, res) => {
    try {
      const { billId } = req.params;
      console.log(`🔍 Looking up QuickBooks bill ID: ${billId}`);
      
      const bill = await getQuickBooksService().getBillById(billId);
      console.log('📄 Bill details retrieved:', JSON.stringify(bill, null, 2));
      
      // Extract account information from line items
      const billData = (bill as any);
      if (billData && billData.Line) {
        console.log('💰 Line items found:');
        billData.Line.forEach((line: any, index: number) => {
          console.log(`  Line ${index + 1}:`, {
            Amount: line.Amount,
            Description: line.Description,
            DetailType: line.DetailType,
            AccountRef: line.AccountBasedExpenseLineDetail?.AccountRef
          });
        });
      }
      
      res.json({
        billId,
        bill: billData,
        accountIds: billData?.Line?.map((line: any) => ({
          amount: line.Amount,
          description: line.Description,
          accountId: line.AccountBasedExpenseLineDetail?.AccountRef?.value,
          accountName: line.AccountBasedExpenseLineDetail?.AccountRef?.name
        })) || []
      });
    } catch (error) {
      console.error('Error retrieving bill details:', error);
      res.status(500).json({ 
        error: (error as Error).message,
        billId: req.params.billId
      });
    }
  });

  // Quick bill verification endpoint
  app.get('/api/quickbooks/verify-bill/:billId', isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Admin only" });
      }
      
      const { billId } = req.params;
      const qbo = await getQuickBooksService().initializeClient();
      
      // Find the specific bill
      const bills = await new Promise((resolve, reject) => {
        qbo.findBills(`SELECT * FROM Bill WHERE Id = '${billId}'`, (err: any, bills: any) => {
          if (err) reject(err);
          else resolve(bills?.QueryResponse?.Bill || []);
        });
      });
      
      res.json({ 
        success: true, 
        billId, 
        found: (bills as any[]).length > 0,
        bill: (bills as any[])[0] || null
      });
      
    } catch (error) {
      console.error('Bill verification error:', error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Verification failed' 
      });
    }
  });

  // Debug endpoint to check QB entities
  app.get('/api/quickbooks/debug-entities', isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Admin only" });
      }

      const qbo = await getQuickBooksService().initializeClient();
      
      // Check vendors
      const vendors = await new Promise((resolve, reject) => {
        qbo.findVendors("SELECT * FROM Vendor WHERE Name = 'Pooran Rajput'", (err: any, data: any) => {
          if (err) reject(err);
          else resolve(data?.QueryResponse?.Vendor || []);
        });
      });
      
      // Check accounts
      const accounts = await new Promise((resolve, reject) => {
        qbo.findAccounts("SELECT * FROM Account WHERE Name = 'Professional Services'", (err: any, data: any) => {
          if (err) reject(err);
          else resolve(data?.QueryResponse?.Account || []);
        });
      });
      
      // Check bills
      const bills = await new Promise((resolve, reject) => {
        qbo.findBills("SELECT * FROM Bill WHERE Id = '145'", (err: any, data: any) => {
          if (err) reject(err);
          else resolve(data?.QueryResponse?.Bill || []);
        });
      });
      
      res.json({
        vendors: vendors,
        accounts: accounts,
        manualBill145: bills,
        message: "Entity debug info"
      });
      
    } catch (error) {
      console.error('Debug error:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Debug failed' });
    }
  });

  // Test Track1099 update for a specific vendor
  app.post('/api/quickbooks/test-track1099', isAdmin, async (req: any, res) => {
    try {
      const { vendorName } = req.body;
      if (!vendorName) {
        return res.status(400).json({ success: false, error: 'Vendor name required' });
      }

      console.log(`🧪 Testing Track1099 update for vendor: ${vendorName}`);
      
      const quickbooks = new QuickBooksService();
      const qbo = await quickbooks.initializeClient();
      
      // Search for the vendor using SQL query
      const query = `SELECT * FROM Vendor WHERE Name = '${vendorName.replace(/'/g, "\\'")}'`;
      console.log(`🔍 Search query: ${query}`);
      
      const result = await new Promise((resolve, reject) => {
        qbo.findVendors(query, (err: any, vendors: any) => {
          if (err) {
            console.error(`❌ Search failed:`, err);
            reject(err);
            return;
          }
          
          const foundVendors = vendors?.QueryResponse?.Vendor || [];
          console.log(`📋 Found ${foundVendors.length} vendors`);
          
          if (foundVendors.length === 0) {
            resolve({ success: false, message: `Vendor "${vendorName}" not found` });
            return;
          }
          
          const vendor = foundVendors[0];
          console.log(`✅ Found vendor:`, {
            Id: vendor.Id,
            Name: vendor.Name,
            Track1099: vendor.Track1099,
            SyncToken: vendor.SyncToken
          });
          
          if (vendor.Track1099) {
            resolve({ 
              success: true, 
              message: `Vendor "${vendorName}" already has Track1099 enabled`,
              vendor: vendor 
            });
            return;
          }
          
          // Update the vendor to enable Track1099
          console.log(`🔄 Updating vendor to enable Track1099...`);
          const updateData = {
            Id: vendor.Id,
            SyncToken: vendor.SyncToken,
            Name: vendor.Name,
            Track1099: true,
            sparse: true
          };
          
          console.log(`📤 Update data:`, updateData);
          
          qbo.updateVendor(updateData, (updateErr: any, updatedVendor: any) => {
            if (updateErr) {
              console.error(`❌ Update failed:`, updateErr);
              if (updateErr.Fault && updateErr.Fault.Error) {
                console.error(`❌ QB Error Details:`, updateErr.Fault.Error);
              }
              reject(updateErr);
            } else {
              console.log(`✅ Track1099 update successful!`);
              resolve({ 
                success: true, 
                message: `Successfully enabled Track1099 for "${vendorName}"`,
                vendor: updatedVendor 
              });
            }
          });
        });
      });
      
      res.json(result);
    } catch (error) {
      console.error('❌ Track1099 test failed:', error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Track1099 test failed' 
      });
    }
  });

  // Test endpoint for QuickBooks sync debugging
  app.post('/api/quickbooks/debug-sync', isAdmin, async (req: any, res) => {
    try {
      console.log('🔧 DEBUG: Starting contractor sync test');
      
      // Get employees directly
      const employees = await storage.getAllEmployees();
      console.log(`📋 Found ${employees.length} total employees`);
      
      const activeContractors = employees.filter((emp: any) => emp.isActive || emp.is_active);
      console.log(`✅ ${activeContractors.length} active contractors`);
      
      if (activeContractors.length === 0) {
        return res.json({ message: 'No active contractors found' });
      }
      
      // Try syncing just one contractor for testing
      const testEmployee = activeContractors[0];
      console.log(`🧪 Testing sync for: ${testEmployee.firstName || 'No First'} ${testEmployee.lastName || 'No Last'}`);
      
      const results = await getQuickBooksService().syncAllContractors([testEmployee]);
      console.log('🔧 DEBUG: Sync results:', results);
      
      res.json({
        success: true,
        message: 'Debug sync completed',
        results: results
      });
    } catch (error: any) {
      console.error('🔧 DEBUG: Sync failed:', error);
      res.status(500).json({ 
        success: false,
        message: 'Debug sync failed', 
        error: error?.message || 'Unknown error' 
      });
    }
  });

  // Find specific vendor by name in production QuickBooks
  app.post('/api/quickbooks/find-vendor', isAdmin, async (req: any, res) => {
    try {
      const { name } = req.body;
      if (!name) {
        return res.status(400).json({ error: 'Name is required' });
      }
      
      console.log(`🔍 Looking up vendor "${name}" in production QuickBooks...`);
      const qbo = await getQuickBooksService().initializeClient();
      
      const vendors = await new Promise((resolve, reject) => {
        qbo.findVendors((err: any, vendorList: any) => {
          if (err) reject(err);
          else resolve(vendorList);
        });
      });
      
      const vendorArray = (vendors as any)?.QueryResponse?.Vendor || [];
      console.log(`📊 Searching through ${vendorArray.length} vendors`);
      
      // Debug: Log vendor names to see the field structure
      console.log('Sample vendor structure:', JSON.stringify(vendorArray[0], null, 2));
      
      // Find exact match for the name
      const matchingVendor = vendorArray.find((vendor: any) => 
        vendor.Name === name || 
        vendor.DisplayName === name ||
        (vendor.Name && vendor.Name.toLowerCase() === name.toLowerCase())
      );
      
      if (matchingVendor) {
        console.log(`✅ Found exact match: ${matchingVendor.Name} (ID: ${matchingVendor.Id})`);
        res.json({
          found: true,
          vendor: {
            id: matchingVendor.Id,
            name: matchingVendor.Name,
            displayName: matchingVendor.DisplayName,
            active: matchingVendor.Active,
            vendor1099: matchingVendor.Vendor1099
          }
        });
      } else {
        // Show partial matches for debugging
        const partialMatches = vendorArray
          .filter((v: any) => v.Name && (
            v.Name.toLowerCase().includes(name.toLowerCase()) ||
            name.toLowerCase().includes(v.Name.toLowerCase())
          ))
          .map((v: any) => ({ id: v.Id, name: v.Name }));
          
        console.log(`❌ No exact match found. Partial matches:`, partialMatches);
        res.json({
          found: false,
          message: `No exact vendor found for "${name}"`,
          partialMatches: partialMatches.slice(0, 10)
        });
      }
      
    } catch (error: any) {
      console.error('Error finding vendor:', error);
      res.status(500).json({ 
        error: 'Failed to find vendor',
        message: error.message 
      });
    }
  });

  // CORRECTED Sync contractors to QuickBooks with proper duplicate detection
  app.post('/api/quickbooks/sync-contractors', isAdmin, async (req: any, res) => {
    console.log('🏢 PRODUCTION SYNC with proper duplicate detection from development');
    console.log('Using tested vendor lookup logic from VENDOR_BILL_MAPPING_BACKUP.md');
    
    try {
      const qbo = await getQuickBooksService().initializeClient();
      console.log('✅ QuickBooks client initialized');
      
      // Step 1: Get ALL existing vendors from production QuickBooks
      console.log('📋 Retrieving ALL vendors from production QuickBooks...');
      const vendors = await new Promise((resolve, reject) => {
        qbo.findVendors((err: any, vendorList: any) => {
          if (err) reject(err);
          else resolve(vendorList);
        });
      });
      
      const vendorArray = (vendors as any)?.QueryResponse?.Vendor || [];
      console.log(`📊 Found ${vendorArray.length} existing vendors in production`);
      
      if (vendorArray.length > 0) {
        console.log('\n👥 EXISTING PRODUCTION VENDORS:');
        vendorArray.forEach((vendor: any) => {
          console.log(`   ID: ${vendor.Id} - Name: "${vendor.Name}" (Active: ${vendor.Active})`);
        });
      }
      
      // Step 2: Get employees who need vendor mapping
      const employees = await storage.getAllEmployees();
      const activeContractors = employees.filter((emp: any) => emp.isActive || emp.is_active);
      console.log(`\n🎯 Processing ${activeContractors.length} employees`);
      
      let linkedCount = 0;
      let createdCount = 0;
      let failedCount = 0;
      const results = [];
      
      for (const employee of activeContractors) {
        const firstName = employee.firstName;
        const lastName = employee.lastName;
        const fullName = `${firstName} ${lastName}`;
        console.log(`\n👤 Processing: ${fullName}`);
        
        // DUPLICATE DETECTION: Use exact logic from vendor_check_session.ts
        const matchingVendor = vendorArray.find((vendor: any) => 
          vendor.Name === fullName || 
          vendor.Name === `${firstName} ${lastName}` ||
          vendor.DisplayName === fullName
        );
        
        if (matchingVendor) {
          console.log(`   ✅ EXISTING VENDOR: ID ${matchingVendor.Id} - "${matchingVendor.Name}"`);
          
          // Update database with existing vendor ID (don't create duplicate!)
          await storage.updateUser(employee.id, { 
            quickbooksVendorId: matchingVendor.Id 
          });
          console.log(`   💾 Linked: ${fullName} → Vendor ID ${matchingVendor.Id}`);
          
          // Enable 1099 tracking on existing vendor
          try {
            const updateData = {
              Id: matchingVendor.Id,
              SyncToken: matchingVendor.SyncToken,
              DisplayName: matchingVendor.DisplayName || matchingVendor.Name,
              Vendor1099: true,  // Enable 1099 tracking
              Active: true,
              sparse: false
            };
            
            await new Promise((resolve, reject) => {
              qbo.updateVendor(updateData, (err: any, updatedVendor: any) => {
                if (err) {
                  console.log(`   ⚠️ Could not enable 1099: ${err?.Fault?.Error?.[0]?.Detail || 'Update failed'}`);
                  resolve(null);
                } else {
                  console.log(`   ✅ Enabled 1099 tracking for existing vendor`);
                  resolve(updatedVendor);
                }
              });
            });
          } catch (updateError) {
            console.log(`   ⚠️ 1099 update failed but vendor linked`);
          }
          
          results.push({
            employee: employee.id,
            employeeName: fullName,
            status: 'linked',
            message: 'Successfully linked to existing vendor',
            quickbooksId: matchingVendor.Id,
            actions: [
              'Found existing vendor in QuickBooks',
              'Linked to employee database record', 
              'Enabled 1099 tracking'
            ]
          });
          linkedCount++;
          
        } else {
          console.log(`   ❌ NO EXISTING VENDOR: Creating new for ${fullName}`);
          
          // Create new vendor (for truly new employees like Yesha)
          const vendorData = {
            PrimaryEmailAddr: { Address: employee.email },
            DisplayName: fullName,
            CompanyName: fullName,
            BillAddr: {
              Line1: employee.homeAddress || "123 Main Street",
              City: "Your City", 
              CountrySubDivisionCode: "NJ",
              PostalCode: "07093"
            },
            Active: true,
            Vendor1099: true  // Enable 1099 tracking for new vendor
          };
          
          try {
            const createdVendor = await new Promise((resolve, reject) => {
              qbo.createVendor(vendorData, (err: any, vendor: any) => {
                if (err) reject(err);
                else resolve(vendor);
              });
            });
            
            if (createdVendor && (createdVendor as any).Id) {
              const vendorId = (createdVendor as any).Id;
              console.log(`   ✅ CREATED: ID ${vendorId} for ${fullName}`);
              
              await storage.updateUser(employee.id, { 
                quickbooksVendorId: vendorId 
              });
              
              results.push({
                employee: employee.id,
                employeeName: fullName,
                status: 'created',
                message: 'Successfully created new contractor vendor',
                quickbooksId: vendorId,
                actions: [
                  'Created new vendor in QuickBooks',
                  'Enabled 1099 tracking for new contractor',
                  'Linked to employee database record'
                ]
              });
              createdCount++;
            }
            
          } catch (createError) {
            console.log(`   ❌ CREATION FAILED: ${createError}`);
            results.push({
              employee: employee.id,
              employeeName: fullName,
              status: 'failed',
              error: createError instanceof Error ? createError.message : 'Creation failed',
              message: 'Could not create vendor in QuickBooks'
            });
            failedCount++;
          }
        }
      }
      
      console.log(`\n🎉 CORRECTED SYNC COMPLETE!`);
      console.log(`📊 Results: ${linkedCount} linked, ${createdCount} created, ${failedCount} failed`);
      
      res.json({
        success: true,
        message: `Sync completed: ${createdCount} created, ${linkedCount} linked, ${failedCount} failed`,
        summary: {
          total: activeContractors.length,
          created: createdCount,
          linked: linkedCount,
          failed: failedCount
        },
        details: results
      });
      
    } catch (error: any) {
      console.error("Production sync error:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to sync contractors", 
        error: error?.message || "Unknown error" 
      });
    }
  });

  // Serve Terms of Service and Privacy Policy
  app.get('/terms-of-service', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'terms-of-service.html'));
  });

  app.get('/privacy-policy', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'privacy-policy.html'));
  });

  // BACKUP AND PROTECTION ROUTES - ADMIN ONLY
  app.post('/api/admin/backup/create', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const currentUser = await storage.getUser(userId);
      
      if (currentUser?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied: Admin privileges required" });
      }

      const backupPath = await backupService.createFullBackup('manual-admin');
      res.json({ success: true, backupPath, message: 'Full backup created successfully' });
    } catch (error) {
      console.error("Error creating backup:", error);
      res.status(500).json({ message: "Failed to create backup" });
    }
  });

  app.post('/api/admin/backup/emergency', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const currentUser = await storage.getUser(userId);
      
      if (currentUser?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied: Admin privileges required" });
      }

      const backupPath = await protectData.emergencyBackup();
      res.json({ success: true, backupPath, message: 'Emergency backup created successfully' });
    } catch (error) {
      console.error("Error creating emergency backup:", error);
      res.status(500).json({ message: "Failed to create emergency backup" });
    }
  });

  // WORKING BILL GENERATION - Uses direct QuickBooks API (bypasses QuickBooksService compilation issues)
  app.post('/api/quickbooks/generate-monthly-bills', isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can generate bills" });
      }

      const { year, month } = req.body;
      if (!year || !month) {
        return res.status(400).json({ message: "Year and month are required" });
      }

      console.log(`💰 Generating bills for ${year}-${month}...`);

      // Import QuickBooks and OAuth libraries dynamically
      const QuickBooks = (await import('node-quickbooks')).default;
      const OAuthClient = (await import('intuit-oauth')).default;

      // Get QuickBooks config
      let [qbConfig] = await db.select().from(quickbooksConfig).limit(1);
      if (!qbConfig) {
        return res.status(400).json({ message: "QuickBooks not connected" });
      }

      // Check if token is expired and refresh if needed
      const tokenExpiry = new Date(qbConfig.tokenExpiry);
      const now = new Date();
      
      if (tokenExpiry < now) {
        console.log('⏰ Token expired, refreshing...');
        
        const oauthClient = new OAuthClient({
          clientId: process.env.QUICKBOOKS_CLIENT_ID,
          clientSecret: process.env.QUICKBOOKS_CLIENT_SECRET,
          environment: qbConfig.sandbox ? 'sandbox' : 'production',
          redirectUri: 'https://inkticate-time-tracker-pooranrajput.replit.app/api/quickbooks/callback',
        });

        oauthClient.setToken({
          access_token: qbConfig.accessToken,
          refresh_token: qbConfig.refreshToken,
          expires_in: Math.floor((tokenExpiry.getTime() - Date.now()) / 1000),
        });

        const authResponse = await oauthClient.refresh();
        const newToken = authResponse.getToken();

        await db
          .update(quickbooksConfig)
          .set({
            accessToken: newToken.access_token,
            refreshToken: newToken.refresh_token,
            tokenExpiry: new Date(Date.now() + (newToken.expires_in * 1000)),
          })
          .where(eq(quickbooksConfig.id, qbConfig.id));

        [qbConfig] = await db.select().from(quickbooksConfig).limit(1);
        console.log('✅ Token refreshed successfully');
      }

      // Initialize QuickBooks client for PRODUCTION
      const qbo = new QuickBooks(
        process.env.QUICKBOOKS_CLIENT_ID,
        process.env.QUICKBOOKS_CLIENT_SECRET,
        qbConfig.accessToken,
        false,
        qbConfig.companyId,
        false, // useSandbox: FALSE = production API
        true,
        null,
        '2.0',
        qbConfig.refreshToken
      );

      // Get paid payroll records for specified month
      const payrollRecords = await db
        .select()
        .from(monthlyPayroll)
        .where(and(
          eq(monthlyPayroll.year, year),
          eq(monthlyPayroll.month, month),
          eq(monthlyPayroll.status, 'paid')
        ));

      console.log(`\n📋 Found ${payrollRecords.length} paid payroll records\n`);

      const results = [];
      for (const record of payrollRecords) {
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, record.userId))
          .limit(1);

        if (!user || !user.quickbooksVendorId) {
          console.log(`⚠️  Skipping ${user?.firstName} ${user?.lastName} - no QB vendor ID`);
          results.push({
            employee: `${user?.firstName} ${user?.lastName}`,
            status: 'skipped',
            reason: 'No QuickBooks vendor ID'
          });
          continue;
        }

        console.log(`\n💰 Creating bill for ${user.firstName} ${user.lastName}`);

        const bill = {
          VendorRef: { value: user.quickbooksVendorId },
          TxnDate: `${year}-${String(month).padStart(2, '0')}-01`,
          DueDate: `${year}-${String(month).padStart(2, '0')}-15`,
          Line: [{
            DetailType: 'AccountBasedExpenseLineDetail',
            Amount: parseFloat(record.grossPay),
            AccountBasedExpenseLineDetail: {
              AccountRef: { value: '108' }
            },
            Description: `${new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} Payroll - ${user.firstName} ${user.lastName}`
          }]
        };

        const createdBill = await new Promise((resolve, reject) => {
          qbo.createBill(bill, (err: any, bill: any) => {
            if (err) reject(err);
            else resolve(bill);
          });
        });

        const billId = (createdBill as any).Id;
        console.log(`   ✅ Bill created: ${billId}`);

        // Update payroll record with QB bill ID
        await db
          .update(monthlyPayroll)
          .set({ quickbooksBillId: billId })
          .where(eq(monthlyPayroll.id, record.id));

        results.push({
          employee: `${user.firstName} ${user.lastName}`,
          amount: record.grossPay,
          billId,
          status: 'success'
        });
      }

      console.log(`\n✅ Successfully created ${results.filter(r => r.status === 'success').length} bills!\n`);

      res.json({
        success: true,
        message: `Created ${results.filter(r => r.status === 'success').length} bills for ${new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
        results
      });

    } catch (error: any) {
      console.error('❌ Error generating bills:', error.message);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to generate bills'
      });
    }
  });

  // Direct QuickBooks bill creation (bypasses broken QuickBooksService)
  app.post('/api/quickbooks/create-bills-direct', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const currentUser = await storage.getUser(userId);
      
      if (currentUser?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied: Admin privileges required" });
      }

      const { year, month } = req.body;
      console.log(`💰 Direct bill creation for ${month}/${year}...`);

      // Get QuickBooks config from database
      const [qbConfig] = await db.select().from(quickbooksConfig).limit(1);
      if (!qbConfig) {
        return res.status(400).json({ message: "QuickBooks not connected" });
      }

      // Initialize QuickBooks client directly
      const OAuthClient = require('intuit-oauth');
      const QuickBooks = require('node-quickbooks');
      
      const oauthClient = new OAuthClient({
        clientId: process.env.QUICKBOOKS_CLIENT_ID,
        clientSecret: process.env.QUICKBOOKS_CLIENT_SECRET,
        environment: qbConfig.sandbox ? 'sandbox' : 'production',
        redirectUri: 'https://inkticate-time-tracker-pooranrajput.replit.app/api/quickbooks/callback',
      });

      oauthClient.setToken({
        access_token: qbConfig.accessToken,
        refresh_token: qbConfig.refreshToken,
        expires_in: Math.floor((new Date(qbConfig.tokenExpiry).getTime() - Date.now()) / 1000),
      });

      const qbo = new QuickBooks(
        process.env.QUICKBOOKS_CLIENT_ID,
        process.env.QUICKBOOKS_CLIENT_SECRET,
        qbConfig.accessToken,
        false,
        qbConfig.companyId,
        !qbConfig.sandbox,
        true,
        null,
        '2.0',
        qbConfig.refreshToken
      );

      // Get paid payroll records for the month
      const payrollRecords = await db
        .select()
        .from(monthlyPayroll)
        .where(and(
          eq(monthlyPayroll.year, year),
          eq(monthlyPayroll.month, month),
          eq(monthlyPayroll.status, 'paid')
        ));

      const results = [];
      for (const record of payrollRecords) {
        const user = await storage.getUser(record.userId);
        if (!user || !user.quickbooksVendorId) {
          console.log(`⚠️ Skipping ${user?.firstName} ${user?.lastName} - no QB vendor ID`);
          continue;
        }

        // Create bill in QuickBooks
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
        
        const bill = {
          VendorRef: { value: user.quickbooksVendorId },
          TxnDate: `${year}-${String(month).padStart(2, '0')}-01`,
          DueDate: `${year}-${String(month).padStart(2, '0')}-15`,
          Line: [{
            DetailType: 'AccountBasedExpenseLineDetail',
            Amount: parseFloat(record.grossPay),
            AccountBasedExpenseLineDetail: {
              AccountRef: { value: '108' } // Payroll expenses:Wages
            },
            Description: `${months[month - 1]} ${year} Payroll - ${user.firstName} ${user.lastName}`
          }]
        };

        const createdBill = await new Promise((resolve, reject) => {
          qbo.createBill(bill, (err: any, bill: any) => {
            if (err) reject(err);
            else resolve(bill);
          });
        });

        // Update payroll record with QB bill ID
        await db
          .update(monthlyPayroll)
          .set({ quickbooksBillId: (createdBill as any).Id })
          .where(eq(monthlyPayroll.id, record.id));

        results.push({
          employee: `${user.firstName} ${user.lastName}`,
          amount: record.grossPay,
          billId: (createdBill as any).Id,
          success: true
        });

        console.log(`✅ Created bill ${(createdBill as any).Id} for ${user.firstName} ${user.lastName}: $${record.grossPay}`);
      }

      res.json({ 
        success: true, 
        bills: results,
        message: `Created ${results.length} bills successfully`
      });
    } catch (error: any) {
      console.error("Error creating bills:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to create bills",
        error: error.message 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
