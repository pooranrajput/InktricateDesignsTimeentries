import { users, timeEntries, taskCategories, userTaskAssignments, monthlyPayroll, backups } from "@shared/schema";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { desc } from "drizzle-orm";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

export class BackupService {
  async createFullBackup(trigger: string = 'manual'): Promise<{ id: number; counts: any }> {
    try {
      const allUsers = await db.select().from(users);
      const allTimeEntries = await db.select().from(timeEntries);
      const allTaskCategories = await db.select().from(taskCategories);
      const allTaskAssignments = await db.select().from(userTaskAssignments);
      const allPayroll = await db.select().from(monthlyPayroll);

      // Strip passwords from backup
      const safeUsers = allUsers.map(({ password, ...rest }) => rest);

      const data = {
        users: safeUsers,
        timeEntries: allTimeEntries,
        taskCategories: allTaskCategories,
        userTaskAssignments: allTaskAssignments,
        monthlyPayroll: allPayroll,
      };

      const counts = {
        users: allUsers.length,
        timeEntries: allTimeEntries.length,
        taskCategories: allTaskCategories.length,
        userTaskAssignments: allTaskAssignments.length,
        monthlyPayroll: allPayroll.length,
      };

      const [record] = await db.insert(backups).values({
        trigger,
        data,
        counts,
      }).returning();

      console.log(`BACKUP #${record.id} [${trigger}]: ${allTimeEntries.length} entries, ${allUsers.length} users`);
      return { id: record.id, counts };
    } catch (error) {
      console.error('BACKUP FAILED:', error);
      throw error;
    }
  }

  async getLatestBackup(): Promise<any> {
    const [latest] = await db.select().from(backups).orderBy(desc(backups.createdAt)).limit(1);
    return latest;
  }

  async listBackups(): Promise<any[]> {
    return await db.select({
      id: backups.id,
      trigger: backups.trigger,
      counts: backups.counts,
      createdAt: backups.createdAt,
    }).from(backups).orderBy(desc(backups.createdAt)).limit(50);
  }

  startAutomaticBackups() {
    // Backup on startup
    this.createFullBackup('startup').catch(err =>
      console.error('Startup backup failed:', err)
    );

    // Full backup every hour
    setInterval(() => {
      this.createFullBackup('hourly').catch(err =>
        console.error('Hourly backup failed:', err)
      );
    }, 60 * 60 * 1000);

    console.log('AUTOMATIC BACKUPS STARTED - startup + hourly');
  }

  async createPreDestructiveBackup(operation: string): Promise<{ id: number; counts: any }> {
    return this.createFullBackup(`pre-${operation}`);
  }
}

export const backupService = new BackupService();
