import {
  users,
  timeEntries,
  taskCategories,
  userTaskAssignments,
  monthlyPayroll,
  quickbooksConfig,
  type User,
  type UpsertUser,
  type InsertTimeEntry,
  type TimeEntry,
  type TimeEntryWithUser,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, sql, desc } from "drizzle-orm";
import { count } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  updateUserCredentials(id: string, username: string, hashedPassword: string): Promise<User>;
  updatePassword(id: string, hashedPassword: string): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  createEmployee(employee: any): Promise<User>;
  createEmployeeBulk(employees: any[]): Promise<User[]>;
  
  // Employee management
  getAllEmployees(): Promise<User[]>;
  updateUserRole(userId: string, role: string): Promise<User>;
  updateUserHourlyRate(userId: string, hourlyRate: string): Promise<User>;
  deactivateUser(userId: string): Promise<User>;
  
  // Time entry operations
  createTimeEntry(timeEntry: InsertTimeEntry): Promise<TimeEntry>;
  updateTimeEntry(id: number, updates: Partial<InsertTimeEntry>): Promise<TimeEntry>;
  deleteTimeEntry(id: number): Promise<void>;
  getUserTimeEntries(userId: string, startDate?: Date, endDate?: Date): Promise<TimeEntry[]>;
  getAllTimeEntriesWithUsers(startDate?: Date, endDate?: Date): Promise<TimeEntryWithUser[]>;
  
  // Monthly report operations
  getMonthlyHoursForUser(userId: string, year: number, month: number): Promise<{ totalHours: number; entries: TimeEntry[] }>;
  getMonthlyPayrollReport(year: number, month: number): Promise<{
    totalHours: number;
    totalPayroll: number;
    employeeReports: Array<{
      user: User;
      totalHours: number;
      grossPay: number;
      entries: TimeEntry[];
    }>;
  }>;
  
  // Task category operations
  getAllTaskCategories(): Promise<any[]>;
  createTaskCategory(taskData: any): Promise<any>;
  updateTaskCategory(id: number, updates: any): Promise<any>;
  assignTaskToEmployees(taskCategoryId: number, employeeIds: string[], assignedBy: string): Promise<void>;
  getUserAssignedTasks(userId: string): Promise<any[]>;
  
  // Payroll operations
  getMonthlyPayrollRecords(year: number, month: number): Promise<any[]>;
  generateMonthlyPayroll(year: number, month: number): Promise<any[]>;
  markPayrollAsPaid(payrollId: number, paidBy: string): Promise<any>;
  
  // QuickBooks integration operations
  updateUserQuickBooksInfo(userId: string, quickbooksCustomerId: string, quickbooksItemId?: string): Promise<User>;
  updateTimeEntryQuickBooksInfo(timeEntryId: number, quickbooksTimeActivityId: string): Promise<TimeEntry>;
  getTimeEntry(id: number): Promise<TimeEntry | undefined>;
  getAllQuickBooksConfigs(): Promise<any[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(sql`LOWER(${users.username}) = LOWER(${username})`);
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(sql`LOWER(${users.email}) = LOWER(${email})`);
    return user;
  }

  async updateUserCredentials(id: string, username: string, hashedPassword: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        username, 
        password: hashedPassword,
        mustResetPassword: true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updatePassword(id: string, hashedPassword: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        password: hashedPassword,
        mustResetPassword: false,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async createEmployee(employeeData: any): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        id: `emp_${employeeData.username.toLowerCase()}_${Date.now()}`,
        ...employeeData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return user;
  }

  async createEmployeeBulk(employees: any[]): Promise<User[]> {
    const employeeData = employees.map((emp, index) => ({
      id: `emp_${Date.now()}_${index}`,
      email: emp.email,
      firstName: emp.firstName,
      lastName: emp.lastName,
      phone: emp.phone,
      homeAddress: emp.homeAddress,
      inktricateStartDate: emp.inktricateStartDate,
      hourlyRate: emp.hourlyRate || "25.00",
      role: "employee" as const,
      isActive: true,
    }));

    const insertedUsers = await db
      .insert(users)
      .values(employeeData)
      .returning();
    
    return insertedUsers;
  }

  // Employee management
  async getAllEmployees(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(eq(users.isActive, true))
      .orderBy(users.firstName, users.lastName);
  }

  async updateUserRole(userId: string, role: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserHourlyRate(userId: string, hourlyRate: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ hourlyRate, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async deactivateUser(userId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Time entry operations
  async createTimeEntry(timeEntry: InsertTimeEntry): Promise<TimeEntry> {
    // Calculate total hours from start and end times
    const startTime = new Date(`1970-01-01T${timeEntry.startTime}`);
    const endTime = new Date(`1970-01-01T${timeEntry.endTime}`);
    const diffMs = endTime.getTime() - startTime.getTime();
    const totalHours = (diffMs / (1000 * 60 * 60)).toFixed(2);
    
    const [entry] = await db
      .insert(timeEntries)
      .values({
        ...timeEntry,
        totalHours: totalHours
      })
      .returning();
    return entry;
  }

  async updateTimeEntry(id: number, updates: Partial<InsertTimeEntry>): Promise<TimeEntry> {
    let updateData: any = { ...updates, updatedAt: new Date() };
    
    // Recalculate total hours if start or end time is updated
    if (updates.startTime || updates.endTime) {
      const current = await db.select().from(timeEntries).where(eq(timeEntries.id, id));
      if (current.length > 0) {
        const startTime = updates.startTime || current[0].startTime;
        const endTime = updates.endTime || current[0].endTime;
        const start = new Date(`1970-01-01T${startTime}`);
        const end = new Date(`1970-01-01T${endTime}`);
        const diffMs = end.getTime() - start.getTime();
        updateData.totalHours = (diffMs / (1000 * 60 * 60)).toFixed(2);
      }
    }
    
    const [entry] = await db
      .update(timeEntries)
      .set(updateData)
      .where(eq(timeEntries.id, id))
      .returning();
    return entry;
  }

  async deleteTimeEntry(id: number): Promise<void> {
    await db.delete(timeEntries).where(eq(timeEntries.id, id));
  }

  async getUserTimeEntries(userId: string, startDate?: Date, endDate?: Date): Promise<TimeEntry[]> {
    if (startDate && endDate) {
      const startStr = startDate.toISOString().split('T')[0];
      const endStr = endDate.toISOString().split('T')[0];
      
      return await db
        .select()
        .from(timeEntries)
        .where(
          and(
            eq(timeEntries.userId, userId),
            gte(timeEntries.date, startStr),
            lte(timeEntries.date, endStr)
          )
        )
        .orderBy(desc(timeEntries.date), desc(timeEntries.createdAt));
    }
    
    return await db
      .select()
      .from(timeEntries)
      .where(eq(timeEntries.userId, userId))
      .orderBy(desc(timeEntries.date), desc(timeEntries.createdAt));
  }

  async getAllTimeEntriesWithUsers(startDate?: Date, endDate?: Date): Promise<TimeEntryWithUser[]> {
    if (startDate && endDate) {
      const results = await db
        .select()
        .from(timeEntries)
        .innerJoin(users, eq(timeEntries.userId, users.id))
        .where(
          and(
            gte(timeEntries.date, startDate.toISOString().split('T')[0]),
            lte(timeEntries.date, endDate.toISOString().split('T')[0])
          )
        )
        .orderBy(desc(timeEntries.date));
      
      return results.map(result => ({
        ...result.time_entries,
        user: result.users,
      }));
    }
    
    const results = await db
      .select()
      .from(timeEntries)
      .innerJoin(users, eq(timeEntries.userId, users.id))
      .orderBy(desc(timeEntries.date));
    
    return results.map(result => ({
      ...result.time_entries,
      user: result.users,
    }));
  }

  // Monthly report operations
  async getMonthlyHoursForUser(userId: string, year: number, month: number): Promise<{ totalHours: number; entries: TimeEntry[] }> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    const entries = await this.getUserTimeEntries(userId, startDate, endDate);
    const totalHours = entries.reduce((sum, entry) => sum + parseFloat(entry.totalHours || '0'), 0);
    
    return { totalHours, entries };
  }

  async getMonthlyPayrollReport(year: number, month: number): Promise<{
    totalHours: number;
    totalPayroll: number;
    employeeReports: Array<{
      user: User;
      totalHours: number;
      grossPay: number;
      entries: TimeEntry[];
      taskBreakdown?: Array<{
        taskName: string;
        hours: number;
        rate: number;
        pay: number;
      }>;
    }>;
  }> {
    const employees = await this.getAllEmployees();
    const employeeReports = [];
    let totalHours = 0;
    let totalPayroll = 0;

    for (const employee of employees) {
      const { totalHours: empHours, entries } = await this.getMonthlyHoursForUser(employee.id, year, month);
      
      // Calculate pay with task-specific rates
      let grossPay = 0;
      const standardHourlyRate = parseFloat(employee.hourlyRate || "0");
      
      for (const entry of entries) {
        const entryHours = parseFloat(entry.totalHours || "0");
        let hourlyRate = standardHourlyRate;
        
        // Check if this entry has a task-specific rate
        if (entry.taskCategoryId) {
          const taskAssignment = await db
            .select()
            .from(userTaskAssignments)
            .where(
              and(
                eq(userTaskAssignments.userId, employee.id),
                eq(userTaskAssignments.taskCategoryId, entry.taskCategoryId)
              )
            )
            .limit(1);
          
          if (taskAssignment.length > 0 && taskAssignment[0].taskSpecificHourlyRate) {
            hourlyRate = parseFloat(taskAssignment[0].taskSpecificHourlyRate);
          }
        }
        
        grossPay += entryHours * hourlyRate;
      }
      
      // Create task breakdown for this employee
      const taskBreakdown: Array<{
        taskName: string;
        hours: number;
        rate: number;
        pay: number;
      }> = [];
      const taskTotals: Record<string, { hours: number; rate: number }> = {};
      
      for (const entry of entries) {
        const taskName = entry.project;
        const entryHours = parseFloat(entry.totalHours || "0");
        let hourlyRate = standardHourlyRate;
        
        // Check if this entry has a task-specific rate
        if (entry.taskCategoryId) {
          const taskAssignment = await db
            .select()
            .from(userTaskAssignments)
            .where(
              and(
                eq(userTaskAssignments.userId, employee.id),
                eq(userTaskAssignments.taskCategoryId, entry.taskCategoryId)
              )
            )
            .limit(1);
          
          if (taskAssignment.length > 0 && taskAssignment[0].taskSpecificHourlyRate) {
            hourlyRate = parseFloat(taskAssignment[0].taskSpecificHourlyRate);
          }
        }
        
        if (!taskTotals[taskName]) {
          taskTotals[taskName] = { hours: 0, rate: hourlyRate };
        }
        
        taskTotals[taskName].hours += entryHours;
      }
      
      Object.entries(taskTotals).forEach(([taskName, data]) => {
        taskBreakdown.push({
          taskName,
          hours: data.hours,
          rate: data.rate,
          pay: data.hours * data.rate,
        });
      });

      employeeReports.push({
        user: employee,
        totalHours: empHours,
        grossPay,
        entries,
        taskBreakdown,
      });
      
      totalHours += empHours;
      totalPayroll += grossPay;
    }

    return {
      totalHours,
      totalPayroll,
      employeeReports,
    };
  }

  // Task category operations
  async getAllTaskCategories(): Promise<any[]> {
    const tasks = await db
      .select({
        id: taskCategories.id,
        name: taskCategories.name,
        description: taskCategories.description,
        color: taskCategories.color,
        isActive: taskCategories.isActive,
        createdAt: taskCategories.createdAt,
        assignedCount: count(userTaskAssignments.id),
      })
      .from(taskCategories)
      .leftJoin(userTaskAssignments, eq(taskCategories.id, userTaskAssignments.taskCategoryId))
      .where(eq(taskCategories.isActive, true))
      .groupBy(taskCategories.id);
    
    return tasks;
  }

  async createTaskCategory(taskData: any): Promise<any> {
    const [category] = await db.insert(taskCategories).values(taskData).returning();
    return category;
  }

  async updateTaskCategory(id: number, updates: any): Promise<any> {
    const [category] = await db
      .update(taskCategories)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(taskCategories.id, id))
      .returning();
    return category;
  }

  async assignTaskToEmployees(taskCategoryId: number, employeeIds: string[], assignedBy: string, taskSpecificRate?: number): Promise<void> {
    // Remove existing assignments for this task
    await db.delete(userTaskAssignments).where(eq(userTaskAssignments.taskCategoryId, taskCategoryId));
    
    // Add new assignments
    if (employeeIds.length > 0) {
      const assignments = employeeIds.map(employeeId => ({
        userId: employeeId,
        taskCategoryId,
        assignedBy,
        taskSpecificHourlyRate: taskSpecificRate ? taskSpecificRate.toString() : null,
      }));
      await db.insert(userTaskAssignments).values(assignments);
    }
  }

  async getUserAssignedTasks(userId: string): Promise<any[]> {
    return await db
      .select({
        id: taskCategories.id,
        name: taskCategories.name,
        description: taskCategories.description,
        taskSpecificRate: userTaskAssignments.taskSpecificHourlyRate,
      })
      .from(userTaskAssignments)
      .innerJoin(taskCategories, eq(userTaskAssignments.taskCategoryId, taskCategories.id))
      .where(eq(userTaskAssignments.userId, userId));
  }

  // Payroll operations
  async getMonthlyPayrollRecords(year: number, month: number): Promise<any[]> {
    return await db
      .select({
        id: monthlyPayroll.id,
        userId: monthlyPayroll.userId,
        year: monthlyPayroll.year,
        month: monthlyPayroll.month,
        totalHours: monthlyPayroll.totalHours,
        grossPay: monthlyPayroll.grossPay,
        status: monthlyPayroll.status,
        paidAt: monthlyPayroll.paidAt,
        paidBy: monthlyPayroll.paidBy,
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        },
      })
      .from(monthlyPayroll)
      .leftJoin(users, eq(monthlyPayroll.userId, users.id))
      .where(and(eq(monthlyPayroll.year, year), eq(monthlyPayroll.month, month)));
  }

  async generateMonthlyPayroll(year: number, month: number): Promise<any[]> {
    // Get all active employees
    const employees = await this.getAllEmployees();
    const records = [];

    for (const employee of employees) {
      // Get monthly hours for this employee
      const { totalHours } = await this.getMonthlyHoursForUser(employee.id, year, month);
      
      if (totalHours > 0) {
        const hourlyRate = parseFloat(employee.hourlyRate || '0');
        const grossPay = totalHours * hourlyRate;

        // Check if record already exists
        const [existing] = await db
          .select()
          .from(monthlyPayroll)
          .where(
            and(
              eq(monthlyPayroll.userId, employee.id),
              eq(monthlyPayroll.year, year),
              eq(monthlyPayroll.month, month)
            )
          );

        if (!existing) {
          const [record] = await db
            .insert(monthlyPayroll)
            .values({
              userId: employee.id,
              year,
              month,
              totalHours: totalHours.toString(),
              grossPay: grossPay.toFixed(2),
              status: 'pending',
            })
            .returning();
          records.push(record);
        }
      }
    }

    return records;
  }

  async markPayrollAsPaid(payrollId: number, paidBy: string): Promise<any> {
    const [record] = await db
      .update(monthlyPayroll)
      .set({
        status: 'paid',
        paidAt: new Date(),
        paidBy,
      })
      .where(eq(monthlyPayroll.id, payrollId))
      .returning();
    
    return record;
  }

  // QuickBooks integration methods
  async updateUserQuickBooksInfo(userId: string, quickbooksCustomerId: string, quickbooksItemId?: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        quickbooksCustomerId,
        quickbooksItemId,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    
    if (!user) {
      throw new Error("User not found");
    }
    
    return user;
  }

  async updateTimeEntryQuickBooksInfo(timeEntryId: number, quickbooksTimeActivityId: string): Promise<TimeEntry> {
    const [timeEntry] = await db
      .update(timeEntries)
      .set({
        quickbooksTimeActivityId,
        quickbooksStatus: 'billed',
        updatedAt: new Date(),
      })
      .where(eq(timeEntries.id, timeEntryId))
      .returning();
    
    if (!timeEntry) {
      throw new Error("Time entry not found");
    }
    
    return timeEntry;
  }

  async getTimeEntry(id: number): Promise<TimeEntry | undefined> {
    const timeEntry = await db.query.timeEntries.findFirst({
      where: eq(timeEntries.id, id),
    });
    
    return timeEntry;
  }

  async getAllQuickBooksConfigs(): Promise<any[]> {
    const configs = await db.select().from(quickbooksConfig);
    return configs;
  }
}

export const storage = new DatabaseStorage();
