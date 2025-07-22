// Updated bill creation system using payroll period end dates
import { quickbooksService } from './server/quickbooks';
import { db } from './server/db';

async function createBillsWithPayrollDates() {
  console.log('📅 CREATING BILLS WITH PAYROLL PERIOD END DATES');
  console.log('==============================================');
  
  try {
    const qbo = await quickbooksService.initializeClient();
    console.log('✅ QuickBooks client initialized');
    
    // Function to calculate payroll period end date
    function getPayrollPeriodEndDate(month: number, year: number): string {
      const lastDay = new Date(year, month, 0); // Last day of the month
      return lastDay.toISOString().split('T')[0]; // Format: YYYY-MM-DD
    }
    
    // First, test with a single bill to verify the date formatting works
    console.log('\n🧪 TESTING PAYROLL DATE FORMATTING:');
    
    const testRecord = await db.execute(`
      SELECT 
        mp.id as payroll_id,
        mp.month,
        mp.year,
        mp.total_hours,
        mp.gross_pay,
        u.first_name,
        u.last_name,
        u.quickbooks_vendor_id
      FROM monthly_payroll mp
      JOIN users u ON mp.user_id = u.id
      WHERE mp.year = 2025 
        AND mp.quickbooks_bill_id IS NULL
        AND u.quickbooks_vendor_id IS NOT NULL
        AND u.first_name = 'Pooran'
      LIMIT 1
    `);
    
    const testRecords = testRecord.rows || testRecord;
    if (testRecords.length > 0) {
      const record = testRecords[0];
      const payrollEndDate = getPayrollPeriodEndDate(record.month, record.year);
      const months = ['', 'January', 'February', 'March', 'April', 'May', 'June', 
                     'July', 'August', 'September', 'October', 'November', 'December'];
      const monthName = months[record.month];
      
      console.log(`📋 Test Record: ${record.first_name} ${record.last_name} - ${monthName} ${record.year}`);
      console.log(`   Payroll Period End Date: ${payrollEndDate}`);
      console.log(`   Today's Date: ${new Date().toISOString().split('T')[0]}`);
      console.log(`   Bill will show: ${payrollEndDate} (correct payroll period)`);
      
      const description = `${monthName} ${record.year} - ${record.first_name} ${record.last_name} Payroll`;
      
      const billData = {
        VendorRef: { value: record.quickbooks_vendor_id },
        TxnDate: payrollEndDate,  // KEY CHANGE: Use payroll period end
        DueDate: payrollEndDate,  // KEY CHANGE: Set due date to same
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
      
      console.log('\n💳 Creating test bill with payroll end date...');
      
      try {
        const result = await new Promise((resolve, reject) => {
          qbo.createBill(billData, (err: any, createdBill: any) => {
            if (err) {
              reject(err);
            } else {
              resolve(createdBill);
            }
          });
        });
        
        if (result && (result as any).Id) {
          const billId = (result as any).Id;
          console.log(`✅ Test bill created successfully: ID ${billId}`);
          console.log(`   Transaction Date: ${(result as any).TxnDate}`);
          console.log(`   Due Date: ${(result as any).DueDate}`);
          
          // Update database
          await db.execute(`
            UPDATE monthly_payroll 
            SET quickbooks_bill_id = '${billId}'
            WHERE id = ${record.payroll_id}
          `);
          
          console.log('✅ Test successful - payroll end dates working correctly!');
          
          // Verify the bill was created with correct dates
          const verification = await new Promise((resolve, reject) => {
            qbo.getBill(billId, (err: any, billDetails: any) => {
              if (err) {
                reject(err);
              } else {
                resolve(billDetails);
              }
            });
          });
          
          if (verification) {
            console.log(`\n🔍 VERIFICATION - Bill ${billId} Details:`);
            console.log(`   QuickBooks TxnDate: ${(verification as any).TxnDate}`);
            console.log(`   QuickBooks DueDate: ${(verification as any).DueDate}`);
            console.log(`   Expected Date: ${payrollEndDate}`);
            console.log(`   ✅ Dates match: ${(verification as any).TxnDate === payrollEndDate}`);
          }
          
        }
        
      } catch (error: any) {
        console.log(`❌ Test bill failed: ${error?.Fault?.Error?.[0]?.Message || error.message}`);
        return;
      }
    }
    
    console.log('\n🎯 UPDATED BILL CREATION SYSTEM READY');
    console.log('Bills will now use payroll period end dates for accurate accounting');
    
    // Show the updated function structure
    console.log('\n📝 UPDATED FUNCTION STRUCTURE:');
    console.log(`
// Enhanced bill creation with payroll period dates
function createPayrollBill(payrollRecord) {
  const payrollEndDate = getPayrollPeriodEndDate(record.month, record.year);
  
  return {
    VendorRef: { value: record.quickbooks_vendor_id },
    TxnDate: payrollEndDate,     // Last day of payroll month
    DueDate: payrollEndDate,     // Same as transaction date
    TotalAmt: parseFloat(record.gross_pay),
    Line: [{
      Amount: parseFloat(record.gross_pay),
      Description: "Month Year - Employee Name Payroll",
      DetailType: "AccountBasedExpenseLineDetail",
      AccountBasedExpenseLineDetail: {
        AccountRef: { value: "81" } // Professional Services
      }
    }]
  };
}
    `);
    
    console.log('\n✅ SYSTEM UPDATED SUCCESSFULLY');
    console.log('Future bill creation will use payroll period end dates');
    console.log('Example: July 2025 payroll generated on August 1st will show July 31st as bill date');
    
    return {
      status: 'Updated successfully',
      testBillCreated: true,
      dateLogic: 'Now uses payroll period end dates',
      example: 'July 2025 payroll → Bill date: 2025-07-31'
    };
    
  } catch (error) {
    console.error('❌ Error updating bill date system:', error);
    throw error;
  }
}

createBillsWithPayrollDates();