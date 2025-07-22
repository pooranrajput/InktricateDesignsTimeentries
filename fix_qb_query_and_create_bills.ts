// Fix QuickBooks query issue and create bills for all payroll records
import { quickbooksService } from './server/quickbooks';
import { db } from './server/db';
import { users, monthlyPayroll } from './shared/schema';
import { eq, and, isNull } from 'drizzle-orm';

async function fixQBAndCreateAllBills() {
  console.log('🚀 FIXING QB QUERIES AND CREATING ALL BILLS');
  console.log('============================================');
  
  try {
    // Get QB client
    const qbo = await quickbooksService.initializeClient();
    console.log('✅ QuickBooks client initialized');
    
    // Use hardcoded account ID from successful manual bill (Professional Services = 81)
    const PROFESSIONAL_SERVICES_ACCOUNT_ID = '81';
    console.log('✅ Using Professional Services account ID:', PROFESSIONAL_SERVICES_ACCOUNT_ID);
    
    // Get all payroll records that need bills - using simpler approach to avoid Drizzle issue
    const result = await db.execute(`
      SELECT 
        mp.id as payroll_id,
        mp.user_id,
        mp.year,
        mp.month,
        mp.total_hours,
        mp.gross_pay,
        mp.quickbooks_bill_id,
        u.first_name,
        u.last_name,
        u.quickbooks_vendor_id
      FROM monthly_payroll mp
      JOIN users u ON mp.user_id = u.id
      WHERE mp.year = 2025 AND mp.quickbooks_bill_id IS NULL
      ORDER BY u.first_name, mp.month
    `);
    
    const payrollRecords = result.rows || result;
    console.log(`💰 Found ${payrollRecords.length} payroll records needing bills`);
    
    if (payrollRecords.length === 0) {
      console.log('✅ All payroll records already have QuickBooks bills!');
      return;
    }
    
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                   'July', 'August', 'September', 'October', 'November', 'December'];
    
    let billsCreated = 0;
    let billsSkipped = 0;
    
    for (const record of payrollRecords) {
      console.log(`\n👤 Processing ${record.first_name} ${record.last_name} - ${months[record.month-1]} 2025`);
      console.log(`   💰 Amount: $${record.gross_pay} (${record.total_hours} hours)`);
      
      // Skip if no vendor ID (need to create vendor first)
      if (!record.quickbooks_vendor_id) {
        console.log(`   ⏭️  Skipping - no QuickBooks vendor ID`);
        billsSkipped++;
        continue;
      }
      
      // Create bill description with proper format
      const description = `${months[record.month-1]} ${record.year} - ${record.first_name} ${record.last_name} Payroll`;
      
      const bill = {
        VendorRef: { value: record.quickbooks_vendor_id },
        TotalAmt: parseFloat(record.gross_pay.toString()),
        Line: [{
          Amount: parseFloat(record.gross_pay.toString()),
          Description: description,
          DetailType: "AccountBasedExpenseLineDetail",
          AccountBasedExpenseLineDetail: {
            AccountRef: { value: PROFESSIONAL_SERVICES_ACCOUNT_ID }
          }
        }]
      };
      
      console.log(`   🔨 Creating bill: ${description}`);
      
      try {
        // Create bill in QuickBooks
        const result = await new Promise((resolve, reject) => {
          qbo.createBill(bill, (err: any, createdBill: any) => {
            if (err) {
              console.log(`   ❌ Error creating bill:`, err?.message || err);
              reject(err);
            } else {
              console.log(`   ✅ Bill created successfully: ID ${createdBill.Id}`);
              resolve(createdBill);
            }
          });
        });
        
        if (result && (result as any).Id) {
          const billId = (result as any).Id;
          
          // Update database with bill ID
          await db.execute(`
            UPDATE monthly_payroll 
            SET quickbooks_bill_id = '${billId}', updated_at = NOW()
            WHERE id = ${record.payroll_id}
          `);
          
          console.log(`   💾 Updated database with bill ID: ${billId}`);
          billsCreated++;
          
          // Small delay to avoid API rate limits
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
      } catch (error: any) {
        console.log(`   ❌ Failed to create bill: ${error?.message || error}`);
        billsSkipped++;
      }
    }
    
    console.log(`\n🎉 BILL CREATION COMPLETE!`);
    console.log(`✅ Bills created: ${billsCreated}`);
    console.log(`⏭️  Bills skipped: ${billsSkipped}`);
    console.log(`📊 Total processed: ${payrollRecords.length}`);
    
    // Verify results
    const updatedRecords = await db
      .select({
        firstName: users.firstName,
        lastName: users.lastName,
        month: monthlyPayroll.month,
        grossPay: monthlyPayroll.grossPay,
        quickbooksBillId: monthlyPayroll.quickbooksBillId
      })
      .from(monthlyPayroll)
      .innerJoin(users, eq(monthlyPayroll.userId, users.id))
      .where(eq(monthlyPayroll.year, 2025))
      .orderBy(users.firstName, monthlyPayroll.month);
    
    console.log(`\n📋 FINAL VERIFICATION (${updatedRecords.length} total records):`);
    updatedRecords.forEach(record => {
      const status = record.quickbooksBillId ? `✅ Bill ${record.quickbooksBillId}` : '❌ No bill';
      console.log(`${record.firstName} ${record.lastName} - ${months[record.month-1]}: $${record.grossPay} - ${status}`);
    });
    
    return { billsCreated, billsSkipped, totalRecords: payrollRecords.length };
    
  } catch (error) {
    console.error('❌ Error in bill creation process:', error);
    throw error;
  }
}

fixQBAndCreateAllBills();