// Database reset with correct schema column names
import { db } from './server/db';

async function resetDatabaseCorrect() {
  console.log('🧹 DATABASE RESET FOR END-TO-END UI TESTING');
  console.log('==========================================');
  
  try {
    // Clear all data except users
    await db.execute('DELETE FROM monthly_payroll');
    await db.execute('DELETE FROM time_entries');  
    await db.execute('UPDATE users SET quickbooks_vendor_id = NULL');
    console.log('✅ Database cleared, users preserved');
    
    // Get active users
    const users = await db.execute(`
      SELECT id, first_name, last_name, hourly_rate, role 
      FROM users 
      WHERE role != 'admin'
      ORDER BY first_name
    `);
    
    const userList = users.rows || users;
    console.log(`👥 Active employees: ${userList.length}`);
    
    // Create timesheet entries with correct schema
    const months = [7, 8, 9, 10, 11, 12];
    const projects = ['Wedding Project A', 'Wedding Project B', 'Corporate Event', 'Birthday Party', 'Anniversary Celebration'];
    let totalEntries = 0;
    
    for (const user of userList) {
      console.log(`Creating entries for ${user.first_name} ${user.last_name}`);
      
      for (const month of months) {
        const entriesThisMonth = 20 + Math.floor(Math.random() * 10); // 20-29 entries per month
        
        for (let i = 0; i < entriesThisMonth; i++) {
          const day = Math.floor(Math.random() * 28) + 1;
          const startHour = 8 + Math.floor(Math.random() * 4); // Start between 8-11 AM
          const workDuration = 2 + Math.random() * 6; // 2-8 hours
          const endHour = startHour + workDuration;
          
          const date = `2025-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
          const startTime = `${startHour.toString().padStart(2, '0')}:00:00`;
          const endTime = `${Math.floor(endHour).toString().padStart(2, '0')}:${Math.floor((endHour % 1) * 60).toString().padStart(2, '0')}:00`;
          const project = projects[Math.floor(Math.random() * projects.length)];
          const totalHours = workDuration.toFixed(2);
          const notes = `Worked on ${project} tasks including planning, execution, and client coordination`;
          
          await db.execute(`
            INSERT INTO time_entries (
              user_id, 
              date, 
              start_time,
              end_time,
              project,
              client_name,
              notes,
              total_hours,
              created_at
            ) VALUES (
              '${user.id}', 
              '${date}', 
              '${startTime}',
              '${endTime}',
              '${project}',
              'Client ${Math.floor(Math.random() * 100) + 1}',
              '${notes}',
              ${totalHours},
              NOW()
            )
          `);
          
          totalEntries++;
        }
      }
    }
    
    // Verify data creation
    const verification = await db.execute(`
      SELECT 
        EXTRACT(MONTH FROM date) as month,
        COUNT(*) as entries,
        ROUND(SUM(total_hours), 2) as total_hours
      FROM time_entries 
      GROUP BY EXTRACT(MONTH FROM date)
      ORDER BY month
    `);
    
    const monthlyData = verification.rows || verification;
    console.log('\n📊 RESET COMPLETE:');
    console.log(`Total entries: ${totalEntries}`);
    monthlyData.forEach((month: any) => {
      const monthName = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][month.month];
      console.log(`${monthName}: ${month.entries} entries, ${month.total_hours} hours`);
    });
    
    console.log('\n🎯 READY FOR UI TESTING:');
    console.log('1. Login as admin (admin/admin123)');
    console.log('2. Generate payroll for each month via UI');
    console.log('3. Sync contractors to QuickBooks via UI');
    console.log('4. Create QuickBooks bills via UI');
    console.log('5. Verify in QuickBooks sandbox');
    
    return { success: true, totalEntries, employees: userList.length };
    
  } catch (error) {
    console.error('❌ Reset failed:', error);
    throw error;
  }
}

resetDatabaseCorrect();