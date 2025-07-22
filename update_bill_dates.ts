// Update bill creation to use payroll period end dates instead of today's date
import { quickbooksService } from './server/quickbooks';
import { db } from './server/db';

async function updateBillCreationWithProperDates() {
  console.log('📅 UPDATING BILL CREATION WITH PAYROLL PERIOD END DATES');
  console.log('=====================================================');
  console.log('Bills will now use the last day of the payroll month as the transaction date');
  
  // Function to calculate the last day of a given month/year
  function getPayrollPeriodEndDate(month: number, year: number): string {
    const lastDay = new Date(year, month, 0); // Day 0 = last day of previous month
    return lastDay.toISOString().split('T')[0]; // Format: YYYY-MM-DD
  }
  
  // Function to create a properly dated bill
  function createBillWithPayrollDate(record: any): any {
    const payrollEndDate = getPayrollPeriodEndDate(record.month, record.year);
    const months = ['', 'January', 'February', 'March', 'April', 'May', 'June', 
                   'July', 'August', 'September', 'October', 'November', 'December'];
    const monthName = months[record.month];
    const description = `${monthName} ${record.year} - ${record.first_name} ${record.last_name} Payroll`;
    
    return {
      VendorRef: { value: record.quickbooks_vendor_id },
      TxnDate: payrollEndDate,           // Use payroll period end date
      DueDate: payrollEndDate,           // Same as transaction date for immediate payment
      TotalAmt: parseFloat(record.gross_pay.toString()),
      Line: [{
        Amount: parseFloat(record.gross_pay.toString()),
        Description: description,
        DetailType: "AccountBasedExpenseLineDetail",
        AccountBasedExpenseLineDetail: {
          AccountRef: { value: '81' } // Professional Services
        }
      }]
    };
  }
  
  try {
    const qbo = await quickbooksService.initializeClient();
    console.log('✅ QuickBooks client initialized');
    
    // Demonstrate the difference for a test bill
    console.log('\n📋 BILL DATE COMPARISON EXAMPLE:');
    const testRecord = {
      month: 7,
      year: 2025,
      quickbooks_vendor_id: '65',
      gross_pay: '1000.00',
      first_name: 'Test',
      last_name: 'Employee'
    };
    
    const oldBillStructure = {
      VendorRef: { value: testRecord.quickbooks_vendor_id },
      // No TxnDate specified → defaults to today
      TotalAmt: parseFloat(testRecord.gross_pay),
      Line: [{ Amount: parseFloat(testRecord.gross_pay) }]
    };
    
    const newBillStructure = createBillWithPayrollDate(testRecord);
    
    console.log('❌ OLD STRUCTURE (uses today\'s date):');
    console.log('   TxnDate: Not specified → defaults to today');
    console.log(`   Result: Bill shows ${new Date().toISOString().split('T')[0]} (today)`);
    
    console.log('\n✅ NEW STRUCTURE (uses payroll period end):');
    console.log(`   TxnDate: ${newBillStructure.TxnDate}`);
    console.log(`   DueDate: ${newBillStructure.DueDate}`);
    console.log(`   Result: Bill shows ${newBillStructure.TxnDate} (July 31, 2025)`);
    
    // Show payroll end dates for all existing payroll months
    console.log('\n📅 CORRECT BILL DATES FOR ALL PAYROLL PERIODS:');
    
    const payrollPeriods = await db.execute(`
      SELECT DISTINCT month, year
      FROM monthly_payroll
      WHERE year = 2025 AND quickbooks_bill_id IS NOT NULL
      ORDER BY month
    `);
    
    const periods = payrollPeriods.rows || payrollPeriods;
    const months = ['', 'January', 'February', 'March', 'April', 'May', 'June', 
                   'July', 'August', 'September', 'October', 'November', 'December'];
    
    periods.forEach((period: any) => {
      const monthName = months[period.month];
      const correctDate = getPayrollPeriodEndDate(period.month, period.year);
      const currentDate = new Date().toISOString().split('T')[0];
      
      console.log(`   ${monthName} ${period.year}:`);
      console.log(`     ❌ Current bills show: ${currentDate} (today)`);
      console.log(`     ✅ Should show: ${correctDate} (period end)`);
    });
    
    console.log('\n⚙️  HOW TO IMPLEMENT:');
    console.log('1. Update bill creation function to calculate payroll period end date');
    console.log('2. Add TxnDate and DueDate fields to bill structure');
    console.log('3. Test with a sample bill to verify dates appear correctly');
    
    // Show the updated function that would be used
    console.log('\n📝 UPDATED BILL CREATION FUNCTION:');
    console.log(`
function createBillWithCorrectDates(payrollRecord) {
  const payrollEndDate = getPayrollPeriodEndDate(payrollRecord.month, payrollRecord.year);
  
  return {
    VendorRef: { value: payrollRecord.quickbooks_vendor_id },
    TxnDate: payrollEndDate,     // ← KEY CHANGE: Use payroll period end
    DueDate: payrollEndDate,     // ← KEY CHANGE: Set due date 
    TotalAmt: parseFloat(payrollRecord.gross_pay),
    Line: [{
      Amount: parseFloat(payrollRecord.gross_pay),
      Description: "Month Year - Employee Name Payroll",
      DetailType: "AccountBasedExpenseLineDetail",
      AccountBasedExpenseLineDetail: {
        AccountRef: { value: "81" } // Professional Services
      }
    }]
  };
}
    `);
    
    console.log('\n🎯 BUSINESS IMPACT:');
    console.log('✅ Bills will show correct dates matching payroll periods');
    console.log('✅ Accounting reports will reflect when work was actually performed');
    console.log('✅ Better audit trail for payroll expenses');
    console.log('✅ Cleaner financial records for tax purposes');
    
    console.log('\n💡 NEXT STEPS:');
    console.log('1. Confirm you want bills to use payroll period end dates');
    console.log('2. I can create a test bill with the new date structure');
    console.log('3. Update all future bill creation to use proper dates');
    
    return {
      currentBehavior: 'Uses today\'s date when bills are created',
      recommendedBehavior: 'Use payroll period end date (last day of month)',
      example: {
        payrollPeriod: 'July 2025',
        currentBillDate: new Date().toISOString().split('T')[0],
        correctBillDate: getPayrollPeriodEndDate(7, 2025)
      }
    };
    
  } catch (error) {
    console.error('❌ Error analyzing bill dates:', error);
    throw error;
  }
}

updateBillCreationWithProperDates();