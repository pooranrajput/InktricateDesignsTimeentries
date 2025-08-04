// Create recurring monthly entries for Bindiya Rajput - $4K salary
import { db } from './server/db.ts';
import { timeEntries } from './shared/schema.ts';

async function createBindiyaRecurringEntries() {
  console.log('💰 CREATING RECURRING PAYROLL ENTRIES FOR BINDIYA RAJPUT');
  console.log('====================================================');
  
  const monthsToCreate = [
    { month: 8, year: 2025, name: 'August 2025' },
    { month: 9, year: 2025, name: 'September 2025' },
    { month: 10, year: 2025, name: 'October 2025' },
    { month: 11, year: 2025, name: 'November 2025' },
    { month: 12, year: 2025, name: 'December 2025' }
  ];
  
  const results = [];
  
  for (const period of monthsToCreate) {
    try {
      const entryDate = `${period.year}-${period.month.toString().padStart(2, '0')}-01`;
      
      console.log(`📅 Creating entry for ${period.name}...`);
      
      const result = await db.insert(timeEntries).values({
        userId: 'founder_bindiya_rajput',
        date: entryDate,
        startTime: '09:00:00',
        endTime: '17:00:00', 
        totalHours: 160.00,
        project: 'Monthly Salary',
        notes: `Monthly salary entry - $4000 (160 hours @ $25/hr) for ${period.name}. Recurring monthly payroll.`,
        taskCategoryId: 2, // Admin category
        isQuickbooksBillable: true,
        quickbooksStatus: 'pending'
      }).returning();
      
      console.log(`   ✅ Created entry ID: ${result[0].id}`);
      
      results.push({
        month: period.name,
        entryId: result[0].id,
        success: true
      });
      
    } catch (error) {
      console.error(`   ❌ Failed to create entry for ${period.name}:`, error.message);
      results.push({
        month: period.name,
        error: error.message,
        success: false
      });
    }
  }
  
  console.log('\n📊 RECURRING PAYROLL SETUP COMPLETE');
  console.log('===================================');
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`✅ Successful entries: ${successful}`);
  console.log(`❌ Failed entries: ${failed}`);
  
  console.log('\n📋 DETAILS:');
  results.forEach((result, index) => {
    if (result.success) {
      console.log(`${index + 1}. ✅ ${result.month} - Entry ID: ${result.entryId}`);
    } else {
      console.log(`${index + 1}. ❌ ${result.month} - Error: ${result.error}`);
    }
  });
  
  console.log('\n💡 NEXT STEPS:');
  console.log('- These entries will appear in monthly payroll reports');
  console.log('- $4000 monthly salary (160 hours @ $25/hour)');
  console.log('- Marked as QuickBooks billable for contractor payments');
  console.log('- Can be processed through existing payroll system');
  
  return {
    totalProcessed: monthsToCreate.length,
    successful,
    failed,
    details: results
  };
}

// Run the recurring payroll setup
createBindiyaRecurringEntries()
  .then((summary) => {
    console.log('\n🎉 BINDIYA RECURRING PAYROLL SETUP COMPLETE!');
    console.log(`Total entries created: ${summary.successful}/${summary.totalProcessed}`);
  })
  .catch((error) => {
    console.error('❌ Setup failed:', error);
  });