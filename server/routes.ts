import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertTimeEntrySchema, updateTimeEntrySchema, updateUserSchema } from "@shared/schema";
import { quickbooksService } from "./quickbooks";
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
  // Auth middleware
  setupAuth(app);

  // Auth routes - SECURITY: Users can see their own data including hourly rate
  app.get('/api/user', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // SECURITY: Users can see their own complete profile including hourly rate
      res.json(user);
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
      const { comparePasswords, hashPassword } = require('./auth');
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
      
      if (!hourlyRate || isNaN(parseFloat(hourlyRate))) {
        return res.status(400).json({ message: "Valid hourly rate required" });
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
      const newPassword = "Inktricate2024!";
      const hashedPassword = await hashPassword(newPassword);
      
      await storage.updatePassword(id, hashedPassword);
      res.json({ newPassword });
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
      
      res.json({ ...newEmployee, password: defaultPassword });
    } catch (error) {
      console.error("Error creating employee:", error);
      res.status(500).json({ message: "Failed to create employee" });
    }
  });

  // Time entry routes - SECURITY CRITICAL: Users can only see their own time entries
  app.get('/api/time-entries', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { startDate, endDate } = req.query;
      
      let start: Date | undefined;
      let end: Date | undefined;
      
      if (startDate) start = new Date(startDate as string);
      if (endDate) end = new Date(endDate as string);
      
      // SECURITY: Each user can ONLY see their own time entries
      const timeEntries = await storage.getUserTimeEntries(userId, start, end);
      res.json(timeEntries);
    } catch (error) {
      console.error("Error fetching time entries:", error);
      res.status(500).json({ message: "Failed to fetch time entries" });
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
      
      // Calculate total hours
      const startTime = new Date(`2024-01-01 ${timeEntryData.startTime}`);
      const endTime = new Date(`2024-01-01 ${timeEntryData.endTime}`);
      const diffMs = endTime.getTime() - startTime.getTime();
      const totalHours = Math.max(0, diffMs / (1000 * 60 * 60));
      
      const timeEntry = await storage.createTimeEntry({
        ...timeEntryData,
        totalHours: totalHours.toFixed(2),
      });
      
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
      
      // Recalculate total hours if times are updated
      if (updateData.startTime && updateData.endTime) {
        const startTime = new Date(`2024-01-01 ${updateData.startTime}`);
        const endTime = new Date(`2024-01-01 ${updateData.endTime}`);
        const diffMs = endTime.getTime() - startTime.getTime();
        const totalHours = Math.max(0, diffMs / (1000 * 60 * 60));
        updateData.totalHours = totalHours.toFixed(2);
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
      
      const { name, description } = req.body;
      const taskData = {
        name,
        description,
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
      
      const { year, month } = req.body;
      const records = await storage.generateMonthlyPayroll(year, month);
      res.json(records);
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
  app.get('/api/quickbooks/auth', async (req: any, res) => {
    try {
      // Debug environment variables
      console.log('Environment check:', {
        hasClientId: !!process.env.QUICKBOOKS_CLIENT_ID,
        hasClientSecret: !!process.env.QUICKBOOKS_CLIENT_SECRET,
        hasRedirectUri: !!process.env.QUICKBOOKS_REDIRECT_URI,
        sandbox: process.env.QUICKBOOKS_SANDBOX
      });
      
      const authUrl = quickbooksService.getAuthorizationUrl('timetracking-setup');
      res.json({ authUrl, debug: { configured: true } });
    } catch (error) {
      console.error("Error getting QuickBooks auth URL:", error);
      res.status(500).json({ 
        message: "Failed to get authorization URL", 
        error: error.message,
        debug: {
          hasClientId: !!process.env.QUICKBOOKS_CLIENT_ID,
          hasRedirectUri: !!process.env.QUICKBOOKS_REDIRECT_URI
        }
      });
    }
  });

  // Handle QuickBooks OAuth callback
  app.get('/api/quickbooks/callback', async (req: any, res) => {
    try {
      const { code, state, realmId } = req.query;
      
      if (!code || !realmId) {
        return res.status(400).json({ message: "Missing authorization code or company ID" });
      }

      const result = await quickbooksService.handleCallback(code, state, realmId);
      
      // Redirect to admin dashboard with success message
      res.redirect('/?quickbooks=success');
    } catch (error) {
      console.error("Error handling QuickBooks callback:", error);
      res.redirect('/?quickbooks=error');
    }
  });

  // Test QuickBooks connection
  app.get('/api/quickbooks/test', isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can test QuickBooks connection" });
      }
      
      const result = await quickbooksService.testConnection();
      res.json(result);
    } catch (error) {
      console.error("Error testing QuickBooks connection:", error);
      res.status(500).json({ message: "Failed to test connection" });
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

      const contractor = await quickbooksService.createContractor(user);
      
      // Update user with QuickBooks contractor ID
      await storage.updateUserQuickBooksInfo(userId, contractor.Id, contractor.ItemRef?.value);
      
      res.json({ contractor, message: "Contractor created successfully in QuickBooks" });
    } catch (error) {
      console.error("Error creating contractor:", error);
      res.status(500).json({ message: "Failed to create contractor in QuickBooks" });
    }
  });

  // Generate monthly contractor bills
  app.post('/api/quickbooks/generate-bills', isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can generate contractor bills" });
      }
      
      const { year, month } = req.body;
      
      if (!year || !month) {
        return res.status(400).json({ message: "Year and month are required" });
      }

      const results = await quickbooksService.generateMonthlyContractorBills(year, month);
      
      res.json({
        results,
        message: `Generated ${results.filter(r => !r.error).length} contractor bills for ${month}/${year}`
      });
    } catch (error) {
      console.error("Error generating contractor bills:", error);
      res.status(500).json({ message: "Failed to generate contractor bills" });
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

      const timeActivity = await quickbooksService.createTimeActivity(timeEntry, user);
      
      // Update time entry with QuickBooks ID
      await storage.updateTimeEntryQuickBooksInfo(timeEntryId, timeActivity.Id);
      
      res.json({ timeActivity, message: "Time entry synced to QuickBooks successfully" });
    } catch (error) {
      console.error("Error syncing time entry:", error);
      res.status(500).json({ message: "Failed to sync time entry to QuickBooks" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
