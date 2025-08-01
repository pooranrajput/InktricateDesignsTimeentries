// Reset database and create fresh timesheet data for end-to-end UI testing
import { db } from './server/db';

async function resetDatabaseForUITesting() {
  console.log('🧹 RESETTING DATABASE FOR END-TO-END UI TESTING');
  console.log('===============================================');
  
  try {
    // Step 1: Clear all existing data (except users)
    console.log('\n🗑️ Clearing existing data...');
    
    // Clear payroll data first (has foreign key constraints)
    await db.execute('DELETE FROM monthly_payroll');
    console.log('   ✅ Cleared monthly payroll records');
    
    // Clear time entries
    await db.execute('DELETE FROM time_entries');
    console.log('   ✅ Cleared time entries');
    
    // Reset QuickBooks data in users but keep the accounts
    await db.execute('UPDATE users SET quickbooks_vendor_id = NULL WHERE role != \'admin\'');
    console.log('   ✅ Reset QuickBooks vendor IDs (except admin)');
    
    // Step 2: Keep existing users but reset their QB data
    const users = await db.execute(`
      SELECT id, first_name, last_name, email, hourly_rate 
      FROM users 
      WHERE role = 'employee' OR role = 'admin'
      ORDER BY first_name
    `);
    
    const userList = users.rows || users;
    console.log(`\n👥 Keeping ${userList.length} existing users:`);
    userList.forEach((user: any) => {
      console.log(`   ${user.first_name} ${user.last_name} ($${user.hourly_rate}/hr)`);
    });
    
    // Step 3: Create fresh timesheet entries for July-December 2025
    console.log('\n📝 Creating fresh timesheet entries (July-December 2025)...');
    
    const months = [7, 8, 9, 10, 11, 12]; // July to December
    const taskCategories = ['Design', 'Planning', 'Client Meeting', 'Production', 'Administration'];
    
    let totalEntries = 0;
    
    for (const user of userList) {
      console.log(`\n   Creating entries for ${user.first_name} ${user.last_name}:`);
      
      for (const month of months) {
        const monthName = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][month];
        
        // Create 15-25 entries per month per user (realistic workload)
        const entriesThisMonth = 18 + Math.floor(Math.random() * 8); // 18-25 entries
        
        for (let i = 0; i < entriesThisMonth; i++) {
          const day = Math.floor(Math.random() * 28) + 1; // Day 1-28 (safe for all months)
          const hours = 3 + Math.random() * 6; // 3-9 hours per entry
          const taskCategory = taskCategories[Math.floor(Math.random() * taskCategories.length)];
          
          const date = `2025-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
          const description = `${taskCategory} work - ${monthName} project tasks`;
          
          await db.execute(`
            INSERT INTO time_entries (
              user_id, 
              date, 
              hours, 
              task_category, 
              description
            ) VALUES (
              ${user.id}, 
              '${date}', 
              ${hours.toFixed(2)}, 
              '${taskCategory}', 
              '${description}'
            )
          `);
          
          totalEntries++;
        }
        
        console.log(`     ${monthName}: ${entriesThisMonth} entries created`);
      }
    }
    
    console.log(`\n📊 FRESH DATA SUMMARY:`);
    console.log(`   ✅ Total timesheet entries: ${totalEntries}`);
    console.log(`   ✅ Period: July - December 2025`);
    console.log(`   ✅ Users: ${userList.length} employees`);
    console.log(`   ✅ Average: ${Math.round(totalEntries / userList.length / 6)} entries per user per month`);
    
    // Step 4: Verify the fresh data
    const verification = await db.execute(`
      SELECT 
        DATE_FORMAT(date, '%Y-%m') as month,
        COUNT(*) as entries,
        ROUND(SUM(hours), 2) as total_hours
      FROM time_entries 
      WHERE date >= '2025-07-01' AND date <= '2025-12-31'
      GROUP BY DATE_FORMAT(date, '%Y-%m')
      ORDER BY month
    `);
    
    const monthlyData = verification.rows || verification;
    console.log(`\n📋 MONTHLY BREAKDOWN:`);
    monthlyData.forEach((month: any) => {
      console.log(`   ${month.month}: ${month.entries} entries, ${month.total_hours} hours`);
    });
    
    console.log(`\n🎯 READY FOR UI TESTING:`);
    console.log(`   1. Database cleaned and fresh data loaded`);
    console.log(`   2. No payroll records generated yet`);
    console.log(`   3. No QuickBooks bills created yet`);
    console.log(`   4. Ready for you to test the complete UI workflow`);
    
    return {
      totalEntries,
      users: userList.length,
      months: months.length,
      ready: true
    };
    
  } catch (error) {
    console.error('❌ Error resetting database:', error);
    throw error;
  }
}

resetDatabaseForUITesting();