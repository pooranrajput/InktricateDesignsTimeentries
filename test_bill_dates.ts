// Test and demonstrate bill date configuration options
import { quickbooksService } from './server/quickbooks';
import { db } from './server/db';

async function testBillDates() {
  console.log('📅 TESTING BILL DATE CONFIGURATION OPTIONS');
  console.log('=========================================');
  
  try {
    const qbo = await quickbooksService.initializeClient();
    console.log('✅ QuickBooks client initialized');
    
    // Check what date is currently being used in existing bills
    console.log('\n🔍 Checking existing bill dates...');
    
    // Get a sample of recent bills to see current date format
    const recentBills = await db.execute(`
      SELECT 
        mp.id,
        mp.month,
        mp.year,
        mp.quickbooks_bill_id,
        u.first_name,
        u.last_name
      FROM monthly_payroll mp
      JOIN users u ON mp.user_id = u.id
      WHERE mp.quickbooks_bill_id IS NOT NULL
      LIMIT 3
    `);
    
    const bills = recentBills.rows || recentBills;
    
    if (bills.length > 0) {
      console.log('📋 Sample of existing bills:');
      
      for (const bill of bills) {
        console.log(`\n📄 Bill ID: ${bill.quickbooks_bill_id}`);
        console.log(`   Employee: ${bill.first_name} ${bill.last_name}`);
        console.log(`   Payroll Period: ${bill.month}/${bill.year}`);
        
        // Try to get the actual bill details from QuickBooks
        try {
          const billDetails = await new Promise((resolve, reject) => {
            qbo.getBill(bill.quickbooks_bill_id, (err: any, billData: any) => {
              if (err) {
                reject(err);
              } else {
                resolve(billData);
              }
            });
          });
          
          if (billDetails && (billDetails as any).TxnDate) {
            console.log(`   ✅ QuickBooks Bill Date: ${(billDetails as any).TxnDate}`);
            console.log(`   ✅ QuickBooks Due Date: ${(billDetails as any).DueDate}`);
          }
          
        } catch (error) {
          console.log(`   ❌ Could not retrieve bill details`);
        }
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // Show the current bill creation logic
    console.log('\n⚙️  CURRENT BILL DATE LOGIC:');
    console.log('   • TxnDate: Not specified → defaults to TODAY\'S DATE');
    console.log('   • DueDate: Not specified → defaults to TODAY\'S DATE');
    
    console.log('\n📝 BILL DATE OPTIONS:');
    console.log('1. Current: Use today\'s date (when bill is created)');
    console.log('   - Pro: Simple, shows when expense was recorded');
    console.log('   - Con: Doesn\'t match payroll period');
    
    console.log('\n2. Payroll Period End: Use last day of payroll month');
    console.log('   - Pro: Matches the actual payroll period');
    console.log('   - Con: May be in the past');
    
    console.log('\n3. Custom Date: Use a specific date for each payroll');
    console.log('   - Pro: Full control over accounting periods');
    console.log('   - Con: More complex to manage');
    
    // Demonstrate how to set custom bill dates
    console.log('\n💡 PROPOSED SOLUTION FOR PAYROLL PERIOD DATES:');
    
    const exampleMonth = 7; // July
    const exampleYear = 2025;
    
    // Calculate last day of payroll month
    const payrollEndDate = new Date(exampleYear, exampleMonth, 0); // Last day of July 2025
    const formattedEndDate = payrollEndDate.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    console.log(`   Example: July 2025 payroll`);
    console.log(`   • Payroll Period End: ${formattedEndDate}`);
    console.log(`   • Current Bill Date: ${new Date().toISOString().split('T')[0]} (today)`);
    
    console.log('\n📋 UPDATED BILL STRUCTURE WOULD BE:');
    console.log(`{`);
    console.log(`  VendorRef: { value: "VENDOR_ID" },`);
    console.log(`  TxnDate: "${formattedEndDate}", // Payroll period end`);
    console.log(`  DueDate: "${formattedEndDate}", // Same as transaction date`);
    console.log(`  TotalAmt: AMOUNT,`);
    console.log(`  Line: [...]`);
    console.log(`}`);
    
    // Function to calculate month end date
    function getPayrollPeriodEndDate(month: number, year: number): string {
      const lastDay = new Date(year, month, 0);
      return lastDay.toISOString().split('T')[0];
    }
    
    console.log('\n📅 PAYROLL PERIOD END DATES FOR ALL MONTHS:');
    for (let month = 6; month <= 12; month++) {
      const monthName = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                         'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][month];
      const endDate = getPayrollPeriodEndDate(month, 2025);
      console.log(`   ${monthName} 2025: ${endDate}`);
    }
    
    console.log('\n🎯 RECOMMENDATION:');
    console.log('For accurate accounting, bills should use payroll period end dates');
    console.log('This ensures bills are dated when the work was actually completed');
    
    return {
      currentLogic: 'Uses today\'s date (creation date)',
      recommendedLogic: 'Use payroll period end date',
      example: {
        payrollMonth: 'July 2025',
        currentBillDate: new Date().toISOString().split('T')[0],
        recommendedBillDate: formattedEndDate
      }
    };
    
  } catch (error) {
    console.error('❌ Error testing bill dates:', error);
    throw error;
  }
}

testBillDates();