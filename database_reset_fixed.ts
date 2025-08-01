// Fixed database reset with correct schema
import { db } from './server/db';

async function resetDatabaseFixed() {
  console.log('🧹 RESETTING DATABASE FOR UI TESTING (FIXED)');
  console.log('==========================================');
  
  try {
    // Step 1: Clear existing data
    console.log('\n🗑️ Clearing existing data...');
    
    await db.execute('DELETE FROM monthly_payroll');
    console.log('   ✅ Cleared payroll records');
    
    await db.execute('DELETE FROM time_entries');
    console.log('   ✅ Cleared time entries');
    
    // Keep users but reset QB vendor IDs
    await db.execute('UPDATE users SET quickbooks_vendor_id = NULL');
    console.log('   ✅ Reset QB vendor IDs');
    
    // Step 2: Check current users and fix any missing hourly rates
    const users = await db.execute(`
      SELECT id, first_name, last_name, email, hourly_rate, role 
      FROM users 
      ORDER BY first_name
    `);
    
    const userList = users.rows || users;
    console.log(`\n👥 Current users (${userList.length}):`);
    
    for (const user of userList) {
      if (!user.hourly_rate && user.role !== 'admin') {
        // Set default hourly rate for employees without one
        const defaultRate = user.first_name === 'Bindiya' ? 18.00 : 17.00;
        await db.execute(`
          UPDATE users 
          SET hourly_rate = ${defaultRate} 
          WHERE id = ${user.id}
        `);
        console.log(`   ${user.first_name} ${user.last_name}: Set hourly rate to $${defaultRate}`);
      } else {
        console.log(`   ${user.first_name} ${user.last_name}: $${user.hourly_rate || 'N/A'}/hr`);
      }
    }
    
    // Step 3: Create realistic timesheet entries using correct column names
    console.log('\n📝 Creating fresh timesheet entries...');
    
    const months = [7, 8, 9, 10, 11, 12];
    const taskCategories = ['Design', 'Planning', 'Client Meeting', 'Production', 'Administration'];
    let totalEntries = 0;
    
    for (const user of userList) {
      if (user.role === 'admin') continue; // Skip admin for timesheet entries
      
      console.log(`\n   Creating entries for ${user.first_name} ${user.last_name}:`);
      
      for (const month of months) {
        const monthName = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][month];
        
        const entriesThisMonth = 15 + Math.floor(Math.random() * 10); // 15-24 entries per month
        
        for (let i = 0; i < entriesThisMonth; i++) {
          const day = Math.floor(Math.random() * 28) + 1;
          const hoursWorked = (2 + Math.random() * 6).toFixed(2); // 2-8 hours per entry
          const taskCategory = taskCategories[Math.floor(Math.random() * taskCategories.length)];
          
          const date = `2025-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
          const description = `${taskCategory} work - ${monthName} project tasks and deliverables`;
          
          // Use correct column names: totalHours instead of hours
          await db.execute(`
            INSERT INTO time_entries (
              user_id, 
              date, 
              total_hours, 
              task_category, 
              description,
              created_at
            ) VALUES (
              ${user.id}, 
              '${date}', 
              ${hoursWorked}, 
              '${taskCategory}', 
              '${description}',
              NOW()
            )
          `);
          
          totalEntries++;
        }
        
        console.log(`     ${monthName}: ${entriesThisMonth} entries`);
      }
    }
    
    // Step 4: Verify the data
    console.log(`\n📊 RESET COMPLETE:`);
    console.log(`   ✅ Total timesheet entries: ${totalEntries}`);
    console.log(`   ✅ Period: July - December 2025`);
    console.log(`   ✅ Active employees: ${userList.filter((u: any) => u.role !== 'admin').length}`);
    
    // Check monthly totals
    const monthlyCheck = await db.execute(`
      SELECT 
        EXTRACT(MONTH FROM date) as month,
        COUNT(*) as entries,
        ROUND(SUM(total_hours), 2) as total_hours
      FROM time_entries 
      WHERE date >= '2025-07-01' AND date <= '2025-12-31'
      GROUP BY EXTRACT(MONTH FROM date)
      ORDER BY month
    `);
    
    const monthlyData = monthlyCheck.rows || monthlyCheck;
    console.log(`\n📋 MONTHLY VERIFICATION:`);
    monthlyData.forEach((month: any) => {
      const monthName = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][month.month];
      console.log(`   ${monthName}: ${month.entries} entries, ${month.total_hours} hours`);
    });
    
    console.log(`\n🎯 READY FOR END-TO-END UI TESTING:`);
    console.log(`   1. Fresh timesheet data loaded`);
    console.log(`   2. No payroll records yet - you'll generate via UI`);
    console.log(`   3. No QB vendors yet - you'll sync via UI`);
    console.log(`   4. No QB bills yet - you'll create via UI`);
    console.log(`   5. Complete workflow ready for testing`);
    
    return {
      success: true,
      totalEntries,
      employeeCount: userList.filter((u: any) => u.role !== 'admin').length,
      monthsCreated: months.length
    };
    
  } catch (error) {
    console.error('❌ Error in database reset:', error);
    throw error;
  }
}

resetDatabaseFixed();