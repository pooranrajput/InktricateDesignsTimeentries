import { storage } from "./storage";
import { users, timeEntries, taskCategories, monthlyPayroll } from "@shared/schema";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

export class BackupService {
  private backupDir = path.join(process.cwd(), 'backups');
  
  constructor() {
    this.ensureBackupDir();
  }

  private async ensureBackupDir() {
    if (!existsSync(this.backupDir)) {
      await mkdir(this.backupDir, { recursive: true });
    }
  }

  // Create full database backup
  async createFullBackup(trigger: string = 'manual'): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `full-backup-${timestamp}-${trigger}.json`;
    const filepath = path.join(this.backupDir, filename);

    try {
      // Get all data - handle missing columns gracefully
      const allUsers = await db.select({
        id: users.id,
        username: users.username,
        password: users.password,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        phone: users.phone,
        homeAddress: users.homeAddress,
        inktricateStartDate: users.inktricateStartDate,
        role: users.role,
        hourlyRate: users.hourlyRate,
        isActive: users.isActive,
        mustResetPassword: users.mustResetPassword,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt
      }).from(users);
      const allTimeEntries = await db.select({
        id: timeEntries.id,
        userId: timeEntries.userId,
        project: timeEntries.project,
        description: timeEntries.description,
        date: timeEntries.date,
        startTime: timeEntries.startTime,
        endTime: timeEntries.endTime,
        totalHours: timeEntries.totalHours,
        taskCategory: timeEntries.taskCategory,
        createdAt: timeEntries.createdAt,
        updatedAt: timeEntries.updatedAt
      }).from(timeEntries);
      const allTaskCategories = await db.select().from(taskCategories);
      const allPayroll = await db.select().from(monthlyPayroll);

      const backup = {
        timestamp: new Date().toISOString(),
        trigger,
        version: '1.0',
        database_url: process.env.DATABASE_URL ? 'REDACTED' : 'NOT_SET',
        data: {
          users: allUsers,
          timeEntries: allTimeEntries,
          taskCategories: allTaskCategories,
          monthlyPayroll: allPayroll
        },
        counts: {
          users: allUsers.length,
          timeEntries: allTimeEntries.length,
          taskCategories: allTaskCategories.length,
          monthlyPayroll: allPayroll.length
        }
      };

      await writeFile(filepath, JSON.stringify(backup, null, 2));
      
      console.log(`✅ BACKUP CREATED: ${filename} (${allTimeEntries.length} time entries)`);
      return filepath;
    } catch (error) {
      console.error('❌ BACKUP FAILED:', error);
      throw error;
    }
  }

  // Create time entries only backup (most critical data)
  async createTimeEntriesBackup(trigger: string = 'auto'): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `time-entries-${timestamp}-${trigger}.json`;
    const filepath = path.join(this.backupDir, filename);

    try {
      const timeEntriesData = await db
        .select({
          id: timeEntries.id,
          userId: timeEntries.userId,
          date: timeEntries.date,
          startTime: timeEntries.startTime,
          endTime: timeEntries.endTime,
          description: timeEntries.description,
          taskCategoryId: timeEntries.taskCategoryId,
          createdAt: timeEntries.createdAt,
          updatedAt: timeEntries.updatedAt
        })
        .from(timeEntries)
        .orderBy(timeEntries.createdAt);

      const backup = {
        timestamp: new Date().toISOString(),
        trigger,
        type: 'time_entries_only',
        count: timeEntriesData.length,
        data: timeEntriesData
      };

      await writeFile(filepath, JSON.stringify(backup, null, 2));
      
      console.log(`✅ TIME ENTRIES BACKUP: ${filename} (${timeEntriesData.length} entries)`);
      return filepath;
    } catch (error) {
      console.error('❌ TIME ENTRIES BACKUP FAILED:', error);
      throw error;
    }
  }

  // Scheduled backup every hour
  startAutomaticBackups() {
    // Initial backup on startup
    this.createFullBackup('startup');
    
    // Backup every hour
    setInterval(() => {
      this.createTimeEntriesBackup('hourly');
    }, 60 * 60 * 1000); // 1 hour

    // Full backup every 6 hours
    setInterval(() => {
      this.createFullBackup('scheduled');
    }, 6 * 60 * 60 * 1000); // 6 hours

    console.log('🔄 AUTOMATIC BACKUPS STARTED - Every hour for time entries, every 6 hours for full backup');
  }

  // Create backup before any destructive operation
  async createPreDestructiveBackup(operation: string): Promise<string> {
    console.warn(`⚠️ DESTRUCTIVE OPERATION DETECTED: ${operation}`);
    const backup = await this.createFullBackup(`pre-${operation}`);
    console.log(`✅ PRE-OPERATION BACKUP CREATED: ${backup}`);
    return backup;
  }
}

export const backupService = new BackupService();