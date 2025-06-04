import {
  users,
  timeEntries,
  type User,
  type UpsertUser,
  type InsertTimeEntry,
  type TimeEntry,
  type TimeEntryWithUser,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, sql, desc } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
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
}

export class DatabaseStorage implements IStorage {
  // User operations (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
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
    const [entry] = await db
      .insert(timeEntries)
      .values(timeEntry)
      .returning();
    return entry;
  }

  async updateTimeEntry(id: number, updates: Partial<InsertTimeEntry>): Promise<TimeEntry> {
    const [entry] = await db
      .update(timeEntries)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(timeEntries.id, id))
      .returning();
    return entry;
  }

  async deleteTimeEntry(id: number): Promise<void> {
    await db.delete(timeEntries).where(eq(timeEntries.id, id));
  }

  async getUserTimeEntries(userId: string, startDate?: Date, endDate?: Date): Promise<TimeEntry[]> {
    let query = db.select().from(timeEntries).where(eq(timeEntries.userId, userId));
    
    if (startDate && endDate) {
      query = query.where(
        and(
          eq(timeEntries.userId, userId),
          gte(timeEntries.date, startDate.toISOString().split('T')[0]),
          lte(timeEntries.date, endDate.toISOString().split('T')[0])
        )
      );
    }
    
    return await query.orderBy(desc(timeEntries.date), desc(timeEntries.createdAt));
  }

  async getAllTimeEntriesWithUsers(startDate?: Date, endDate?: Date): Promise<TimeEntryWithUser[]> {
    let query = db
      .select()
      .from(timeEntries)
      .innerJoin(users, eq(timeEntries.userId, users.id));
    
    if (startDate && endDate) {
      query = query.where(
        and(
          gte(timeEntries.date, startDate.toISOString().split('T')[0]),
          lte(timeEntries.date, endDate.toISOString().split('T')[0])
        )
      );
    }
    
    const results = await query.orderBy(desc(timeEntries.date));
    
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
    }>;
  }> {
    const employees = await this.getAllEmployees();
    const employeeReports = [];
    let totalHours = 0;
    let totalPayroll = 0;

    for (const employee of employees) {
      const { totalHours: empHours, entries } = await this.getMonthlyHoursForUser(employee.id, year, month);
      const hourlyRate = parseFloat(employee.hourlyRate || '0');
      const grossPay = empHours * hourlyRate;
      
      employeeReports.push({
        user: employee,
        totalHours: empHours,
        grossPay,
        entries,
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
}

export const storage = new DatabaseStorage();
