import { storage } from "./storage";
import { users, timeEntries, taskCategories, userTaskAssignments, monthlyPayroll } from "@shared/schema";
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
      // Get all data
      const allUsers = await db.select().from(users);
      const allTimeEntries = await db.select().from(timeEntries);
      const allTaskCategories = await db.select().from(taskCategories);
      const allTaskAssignments = await db.select().from(userTaskAssignments);
      const allPayroll = await db.select().from(monthlyPayroll);

      const backup = {
        timestamp: new Date().toISOString(),
        trigger,
        version: '2.0',
        database_url: process.env.DATABASE_URL ? 'REDACTED' : 'NOT_SET',
        data: {
          users: allUsers,
          timeEntries: allTimeEntries,
          taskCategories: allTaskCategories,
          userTaskAssignments: allTaskAssignments,
          monthlyPayroll: allPayroll
        },
        counts: {
          users: allUsers.length,
          timeEntries: allTimeEntries.length,
          taskCategories: allTaskCategories.length,
          userTaskAssignments: allTaskAssignments.length,
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
          project: timeEntries.project,
          clientName: timeEntries.clientName,
          notes: timeEntries.notes,
          totalHours: timeEntries.totalHours,
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
    // Initial full backup on startup
    this.createFullBackup('startup').catch(err =>
      console.error('Startup backup failed:', err)
    );

    // Full backup every hour (not just time entries)
    setInterval(() => {
      this.createFullBackup('hourly').catch(err =>
        console.error('Hourly backup failed:', err)
      );
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