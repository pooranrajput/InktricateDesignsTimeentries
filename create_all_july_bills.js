// Create QuickBooks bills for all remaining July 2025 contractors
import { QuickBooksService } from './server/quickbooks.ts';
import { db } from './server/db.ts';
import { monthlyPayroll } from './shared/schema.ts';
import { eq } from 'drizzle-orm';

async function createAllJulyBills() {
  console.log('🚀 CREATING QUICKBOOKS BILLS FOR ALL JULY 2025 CONTRACTORS');
  console.log('=========================================================');
  
  // Payroll data for remaining contractors (excluding Yesha who already has bill 4315)
  const contractorsToProcess = [
    {
      payroll_id: 75,
      first_name: 'Alysha',
      last_name: 'Mahagaonkar', 
      quickbooks_vendor_id: '437',
      total_hours: '20.17',
      gross_pay: '504.25',
      hourly_rate: '25.00'
    },
    {
      payroll_id: 76,
      first_name: 'Anjali',
      last_name: 'Patel',
      quickbooks_vendor_id: '175', 
      total_hours: '26.49',
      gross_pay: '450.33',
      hourly_rate: '17.00'
    },
    {
      payroll_id: 77,
      first_name: 'Rhea', 
      last_name: 'Doshi',
      quickbooks_vendor_id: '370',
      total_hours: '54.92',
      gross_pay: '1373.00',
      hourly_rate: '25.00'
    }
  ];
  
  try {
    // Initialize QuickBooks service
    console.log('🔗 Initializing QuickBooks connection...');
    const quickbooksService = new QuickBooksService();
    await quickbooksService.initializeClient();
    console.log('✅ QuickBooks connection established');
    
    const results = [];
    let billsCreated = 0;
    let billsFailed = 0;
    
    console.log(`\n📋 Processing ${contractorsToProcess.length} contractors:`);
    
    for (const contractor of contractorsToProcess) {
      console.log(`\n👤 Creating bill for ${contractor.first_name} ${contractor.last_name}...`);
      console.log(`   💰 Amount: $${contractor.gross_pay} (${contractor.total_hours} hours @ $${contractor.hourly_rate}/hr)`);
      console.log(`   🏢 Vendor ID: ${contractor.quickbooks_vendor_id}`);
      
      try {
        // Prepare payroll data for QuickBooks
        const payrollData = {
          id: contractor.payroll_id,
          year: 2025,
          month: 7,
          totalHours: contractor.total_hours,
          grossPay: contractor.gross_pay,
          firstName: contractor.first_name,
          lastName: contractor.last_name,
          quickbooksVendorId: contractor.quickbooks_vendor_id
        };
        
        const vendor = {
          vendorId: contractor.quickbooks_vendor_id,
          firstName: contractor.first_name,
          lastName: contractor.last_name
        };
        
        // Create the bill in QuickBooks
        const createdBill = await quickbooksService.createContractorBill(payrollData, vendor);
        console.log(`   ✅ Bill ${createdBill.Id} created successfully`);
        
        // Update database with QuickBooks bill ID
        await db.update(monthlyPayroll)
          .set({ quickbooksBillId: createdBill.Id.toString() })
          .where(eq(monthlyPayroll.id, contractor.payroll_id));
        console.log(`   💾 Database updated with bill ID ${createdBill.Id}`);
        
        results.push({
          contractor: `${contractor.first_name} ${contractor.last_name}`,
          billId: createdBill.Id,
          amount: createdBill.TotalAmt,
          hours: contractor.total_hours,
          success: true
        });
        
        billsCreated++;
        
        // Rate limiting - wait 2 seconds between bill creations
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error(`   ❌ Failed to create bill for ${contractor.first_name} ${contractor.last_name}:`, error?.message || error);
        
        results.push({
          contractor: `${contractor.first_name} ${contractor.last_name}`,
          error: error?.message || 'Unknown error',
          success: false
        });
        
        billsFailed++;
      }
    }
    
    console.log('\n🎉 JULY 2025 BILL CREATION COMPLETE!');
    console.log('====================================');
    console.log(`✅ Bills Created: ${billsCreated}`);
    console.log(`❌ Bills Failed: ${billsFailed}`);
    
    console.log('\n📊 DETAILED RESULTS:');
    console.log('====================');
    results.forEach((result, index) => {
      if (result.success) {
        console.log(`${index + 1}. ✅ ${result.contractor} - Bill #${result.billId} - $${result.amount}`);
      } else {
        console.log(`${index + 1}. ❌ ${result.contractor} - Error: ${result.error}`);
      }
    });
    
    console.log('\n🎯 SUMMARY:');
    console.log(`   Total contractors processed: ${contractorsToProcess.length}`);
    console.log(`   Successful bill creations: ${billsCreated}`);
    console.log(`   Failed bill creations: ${billsFailed}`);
    console.log(`   All bills use Account ID: 108 (Payroll expenses:Wages)`);
    console.log(`   All bills dated: July 31, 2025`);
    
    return {
      success: billsFailed === 0,
      totalProcessed: contractorsToProcess.length,
      billsCreated,
      billsFailed,
      details: results
    };
    
  } catch (error) {
    console.error('❌ Critical error in bill creation process:', error?.message || error);
    return {
      success: false,
      error: error?.message || 'Unknown error'
    };
  }
}

// Run the bill creation process
createAllJulyBills()
  .then((result) => {
    if (result.success) {
      console.log('\n🚀 ALL JULY 2025 BILLS CREATED SUCCESSFULLY!');
    } else {
      console.log('\n⚠️ Some bills failed to create. Check results above.');
    }
  })
  .catch((error) => {
    console.error('Script execution error:', error);
  });