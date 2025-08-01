// Generate payroll for all employees and months with dummy data
import { db } from './server/db';
import { users, timeEntries, monthlyPayroll } from './shared/schema';
import { eq, and, sql } from 'drizzle-orm';

async function generateAllPayroll() {
  console.log('💰 GENERATING PAYROLL FOR ALL EMPLOYEES');
  console.log('=====================================');
  
  try {
    // Get all active users with hourly rates
    const allUsers = await db
      .select()
      .from(users)
      .where(eq(users.isActive, true));
    
    console.log(`👥 Processing ${allUsers.length} employees`);
    
    const months = [
      { month: 7, name: 'July' },
      { month: 8, name: 'August' },
      { month: 9, name: 'September' },
      { month: 10, name: 'October' },
      { month: 11, name: 'November' },
      { month: 12, name: 'December' }
    ];
    
    let totalPayrollRecords = 0;
    
    for (const user of allUsers) {
      // Skip users without hourly rates (like founder)
      if (!user.hourlyRate) {
        console.log(`⏭️  Skipping ${user.firstName} ${user.lastName} (no hourly rate)`);
        continue;
      }
      
      console.log(`\n👤 Generating payroll for ${user.firstName} ${user.lastName} ($${user.hourlyRate}/hr):`);
      
      for (const monthInfo of months) {
        // Calculate total hours for this user in this month
        const timeEntriesResult = await db
          .select({
            totalHours: sql<string>`COALESCE(SUM(CAST(${timeEntries.totalHours} AS DECIMAL)), 0)`
          })
          .from(timeEntries)
          .where(
            and(
              eq(timeEntries.userId, user.id),
              sql`EXTRACT(YEAR FROM ${timeEntries.date}) = 2025`,
              sql`EXTRACT(MONTH FROM ${timeEntries.date}) = ${monthInfo.month}`
            )
          );
        
        const totalHours = parseFloat(timeEntriesResult[0]?.totalHours || '0');
        
        if (totalHours > 0) {
          const grossPay = totalHours * parseFloat(user.hourlyRate.toString());
          
          // Check if payroll record already exists
          const existingPayroll = await db
            .select()
            .from(monthlyPayroll)
            .where(
              and(
                eq(monthlyPayroll.userId, user.id),
                eq(monthlyPayroll.year, 2025),
                eq(monthlyPayroll.month, monthInfo.month)
              )
            );
          
          if (existingPayroll.length === 0) {
            // Create new payroll record
            await db.insert(monthlyPayroll).values({
              userId: user.id,
              year: 2025,
              month: monthInfo.month,
              totalHours: totalHours.toFixed(2),
              grossPay: grossPay.toFixed(2),
              status: 'pending',
              createdAt: new Date(),
              updatedAt: new Date()
            });
            
            console.log(`  ✅ ${monthInfo.name}: ${totalHours.toFixed(1)}h = $${grossPay.toFixed(2)}`);
            totalPayrollRecords++;
          } else {
            console.log(`  ⏭️  ${monthInfo.name}: Already exists (${totalHours.toFixed(1)}h = $${grossPay.toFixed(2)})`);
          }
        } else {
          console.log(`  ⚠️  ${monthInfo.name}: No time entries`);
        }
      }
    }
    
    console.log(`\n🎉 PAYROLL GENERATION COMPLETE!`);
    console.log(`📊 Total payroll records created: ${totalPayrollRecords}`);
    
    // Show summary
    const payrollSummary = await db
      .select({
        userId: monthlyPayroll.userId,
        year: monthlyPayroll.year,
        month: monthlyPayroll.month,
        totalHours: monthlyPayroll.totalHours,
        grossPay: monthlyPayroll.grossPay,
        firstName: users.firstName,
        lastName: users.lastName
      })
      .from(monthlyPayroll)
      .innerJoin(users, eq(monthlyPayroll.userId, users.id))
      .where(eq(monthlyPayroll.year, 2025));
    
    console.log(`\n📋 PAYROLL SUMMARY (${payrollSummary.length} records):`);
    payrollSummary.forEach(record => {
      console.log(`${record.firstName} ${record.lastName} - ${record.month}/2025: ${record.totalHours}h = $${record.grossPay}`);
    });
    
    return payrollSummary;
    
  } catch (error) {
    console.error('❌ Error generating payroll:', error);
    throw error;
  }
}

generateAllPayroll();