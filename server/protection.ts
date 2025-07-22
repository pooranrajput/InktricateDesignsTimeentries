import { backupService } from "./backup";
import { storage } from "./storage";
import { timeEntries } from "@shared/schema";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

// Protection middleware to prevent destructive operations without backup
export const protectData = {
  // Before any DELETE operations on time_entries
  beforeTimeEntryDeletion: async (req: any, res: any, next: any) => {
    try {
      // Count existing time entries
      const count = await db.select({ count: timeEntries.id }).from(timeEntries);
      
      if (count.length > 0) {
        console.warn('🚨 TIME ENTRY DELETION DETECTED - Creating backup');
        await backupService.createPreDestructiveBackup('time-entry-deletion');
      }
      
      next();
    } catch (error) {
      console.error('❌ PROTECTION MIDDLEWARE FAILED:', error);
      res.status(500).json({ message: 'Protection system failed - operation aborted' });
    }
  },

  // Before any UPDATE operations that could affect multiple records
  beforeBulkUpdate: async (req: any, res: any, next: any) => {
    try {
      console.warn('🚨 BULK UPDATE DETECTED - Creating backup');
      await backupService.createPreDestructiveBackup('bulk-update');
      next();
    } catch (error) {
      console.error('❌ PROTECTION MIDDLEWARE FAILED:', error);
      res.status(500).json({ message: 'Protection system failed - operation aborted' });
    }
  },

  // Emergency backup trigger
  emergencyBackup: async () => {
    try {
      console.error('🚨 EMERGENCY BACKUP TRIGGERED');
      const backup = await backupService.createFullBackup('emergency');
      console.log(`✅ EMERGENCY BACKUP COMPLETE: ${backup}`);
      return backup;
    } catch (error) {
      console.error('❌ EMERGENCY BACKUP FAILED:', error);
      throw error;
    }
  }
};

// Database change monitor
export class ChangeMonitor {
  private lastTimeEntryCount = 0;
  
  async startMonitoring() {
    // Check every 5 minutes for unexpected changes
    setInterval(async () => {
      try {
        const result = await db.select({ count: timeEntries.id }).from(timeEntries);
        const currentCount = result.length;
        
        // If count dropped significantly, trigger emergency backup
        if (this.lastTimeEntryCount > 0 && currentCount < this.lastTimeEntryCount * 0.8) {
          console.error(`🚨 MASSIVE DATA LOSS DETECTED! Count dropped from ${this.lastTimeEntryCount} to ${currentCount}`);
          await protectData.emergencyBackup();
          
          // Could send alert email here
          console.error('🚨 EMERGENCY ALERT: Notify admin immediately of data loss!');
        }
        
        this.lastTimeEntryCount = currentCount;
      } catch (error) {
        console.error('❌ CHANGE MONITOR ERROR:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes

    console.log('🔍 DATABASE CHANGE MONITORING STARTED');
  }
}

export const changeMonitor = new ChangeMonitor();