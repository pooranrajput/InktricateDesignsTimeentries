// Create QuickBooks vendors for all employees and then create bills
import { quickbooksService } from './server/quickbooks';
import { db } from './server/db';
import { users, monthlyPayroll } from './shared/schema';
import { eq, and, isNull } from 'drizzle-orm';

async function createVendorsAndBills() {
  console.log('🏢 CREATING VENDORS AND BILLS FOR ALL EMPLOYEES');
  console.log('==============================================');
  
  try {
    const qbo = await quickbooksService.initializeClient();
    console.log('✅ QuickBooks client initialized');
    
    // Get all users who need vendor IDs
    const usersNeedingVendors = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.isActive, true),
          isNull(users.quickbooksVendorId)
        )
      );
    
    console.log(`👥 Found ${usersNeedingVendors.length} employees needing QuickBooks vendors`);
    
    // Create vendors first
    for (const user of usersNeedingVendors) {
      // Skip users without hourly rates (like founder)
      if (!user.hourlyRate) {
        console.log(`⏭️  Skipping ${user.firstName} ${user.lastName} (no hourly rate)`);
        continue;
      }
      
      console.log(`\n🏢 Creating vendor for ${user.firstName} ${user.lastName}`);
      
      const vendorData = {
        Name: `${user.firstName} ${user.lastName}`,
        Active: true,
        PrimaryEmailAddr: {
          Address: user.email
        }
      };
      
      try {
        const vendor = await new Promise((resolve, reject) => {
          qbo.createVendor(vendorData, (err: any, createdVendor: any) => {
            if (err) {
              console.log(`   ❌ Error creating vendor:`, err?.message || err);
              reject(err);
            } else {
              console.log(`   ✅ Vendor created: ID ${createdVendor.Id}`);
              resolve(createdVendor);
            }
          });
        });
        
        if (vendor && (vendor as any).Id) {
          // Update user with vendor ID
          await db
            .update(users)
            .set({
              quickbooksVendorId: (vendor as any).Id.toString(),
              updatedAt: new Date()
            })
            .where(eq(users.id, user.id));
          
          console.log(`   💾 Updated user ${user.firstName} with vendor ID: ${(vendor as any).Id}`);
          
          // Small delay to avoid API rate limits
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
        
      } catch (error: any) {
        console.log(`   ❌ Failed to create vendor: ${error?.message || error}`);
      }
    }
    
    console.log(`\n💰 NOW CREATING BILLS FOR ALL PAYROLL RECORDS...`);
    
    // Now get all payroll records that need bills (including newly created vendors)
    const payrollRecords = await db
      .select({
        payrollId: monthlyPayroll.id,
        userId: monthlyPayroll.userId,
        year: monthlyPayroll.year,
        month: monthlyPayroll.month,
        totalHours: monthlyPayroll.totalHours,
        grossPay: monthlyPayroll.grossPay,
        quickbooksBillId: monthlyPayroll.quickbooksBillId,
        firstName: users.firstName,
        lastName: users.lastName,
        quickbooksVendorId: users.quickbooksVendorId
      })
      .from(monthlyPayroll)
      .innerJoin(users, eq(monthlyPayroll.userId, users.id))
      .where(
        and(
          eq(monthlyPayroll.year, 2025),
          isNull(monthlyPayroll.quickbooksBillId) // Only records without bills
        )
      )
      .orderBy(users.firstName, monthlyPayroll.month);
    
    console.log(`💰 Found ${payrollRecords.length} payroll records needing bills`);
    
    const PROFESSIONAL_SERVICES_ACCOUNT_ID = '81';
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                   'July', 'August', 'September', 'October', 'November', 'December'];
    
    let billsCreated = 0;
    let billsSkipped = 0;
    
    for (const record of payrollRecords) {
      console.log(`\n👤 Processing ${record.firstName} ${record.lastName} - ${months[record.month-1]} 2025`);
      console.log(`   💰 Amount: $${record.grossPay} (${record.totalHours} hours)`);
      
      // Skip if no vendor ID
      if (!record.quickbooksVendorId) {
        console.log(`   ⏭️  Skipping - no QuickBooks vendor ID`);
        billsSkipped++;
        continue;
      }
      
      // Create bill description with proper format
      const description = `${months[record.month-1]} ${record.year} - ${record.firstName} ${record.lastName} Payroll`;
      
      const bill = {
        VendorRef: { value: record.quickbooksVendorId },
        TotalAmt: parseFloat(record.grossPay.toString()),
        Line: [{
          Amount: parseFloat(record.grossPay.toString()),
          Description: description,
          DetailType: "AccountBasedExpenseLineDetail",
          AccountBasedExpenseLineDetail: {
            AccountRef: { value: PROFESSIONAL_SERVICES_ACCOUNT_ID }
          }
        }]
      };
      
      console.log(`   🔨 Creating bill: ${description}`);
      
      try {
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
          await db
            .update(monthlyPayroll)
            .set({
              quickbooksBillId: billId.toString(),
              updatedAt: new Date()
            })
            .where(eq(monthlyPayroll.id, record.payrollId));
          
          console.log(`   💾 Updated database with bill ID: ${billId}`);
          billsCreated++;
          
          // Delay to avoid API rate limits
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
      } catch (error: any) {
        console.log(`   ❌ Failed to create bill: ${error?.message || error}`);
        billsSkipped++;
      }
    }
    
    console.log(`\n🎉 COMPREHENSIVE BILL CREATION COMPLETE!`);
    console.log(`✅ Bills created: ${billsCreated}`);
    console.log(`⏭️  Bills skipped: ${billsSkipped}`);
    console.log(`📊 Total processed: ${payrollRecords.length}`);
    
    // Final verification
    const finalRecords = await db
      .select({
        firstName: users.firstName,
        lastName: users.lastName,
        month: monthlyPayroll.month,
        grossPay: monthlyPayroll.grossPay,
        quickbooksBillId: monthlyPayroll.quickbooksBillId,
        quickbooksVendorId: users.quickbooksVendorId
      })
      .from(monthlyPayroll)
      .innerJoin(users, eq(monthlyPayroll.userId, users.id))
      .where(eq(monthlyPayroll.year, 2025))
      .orderBy(users.firstName, monthlyPayroll.month);
    
    console.log(`\n📋 FINAL COMPREHENSIVE VERIFICATION:`);
    console.log(`Total payroll records: ${finalRecords.length}`);
    
    const recordsWithBills = finalRecords.filter(r => r.quickbooksBillId);
    const recordsWithoutBills = finalRecords.filter(r => !r.quickbooksBillId);
    
    console.log(`✅ Records with QuickBooks bills: ${recordsWithBills.length}`);
    console.log(`❌ Records without bills: ${recordsWithoutBills.length}`);
    
    console.log(`\n🎯 SUCCESS SUMMARY:`);
    recordsWithBills.forEach(record => {
      console.log(`✅ ${record.firstName} ${record.lastName} - ${months[record.month-1]}: $${record.grossPay} - Bill ${record.quickbooksBillId}`);
    });
    
    if (recordsWithoutBills.length > 0) {
      console.log(`\n⚠️  REMAINING WITHOUT BILLS:`);
      recordsWithoutBills.forEach(record => {
        const reason = !record.quickbooksVendorId ? 'No vendor ID' : 'Unknown';
        console.log(`❌ ${record.firstName} ${record.lastName} - ${months[record.month-1]}: $${record.grossPay} - ${reason}`);
      });
    }
    
    return {
      billsCreated,
      billsSkipped,
      totalRecords: payrollRecords.length,
      recordsWithBills: recordsWithBills.length,
      recordsWithoutBills: recordsWithoutBills.length
    };
    
  } catch (error) {
    console.error('❌ Error in comprehensive bill creation:', error);
    throw error;
  }
}

createVendorsAndBills();