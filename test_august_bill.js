// Test creating bills with the working vendor ID we have
const { quickbooksService } = require('./server/quickbooks');
const { db } = require('./server/db');

async function testAugustBills() {
  console.log('🧪 TESTING BILL CREATION WITH EXISTING VENDOR ID 65');
  console.log('================================================');
  
  // Create bills for all employees using the same vendor ID that works
  // This simulates the full workflow even though it's not production-ready
  
  try {
    const qbo = await quickbooksService.initializeClient();
    console.log('✅ QuickBooks client ready');
    
    // Get all payroll records without bills
    const result = await db.execute(`
      SELECT 
        mp.id as payroll_id,
        mp.month,
        mp.year,
        mp.total_hours,
        mp.gross_pay,
        u.first_name,
        u.last_name
      FROM monthly_payroll mp
      JOIN users u ON mp.user_id = u.id
      WHERE mp.year = 2025 
        AND mp.quickbooks_bill_id IS NULL
        AND u.hourly_rate IS NOT NULL
        AND mp.month = 8  -- August only for testing
      ORDER BY u.first_name
    `);
    
    const records = result.rows || result;
    console.log(`Found ${records.length} August payroll records`);
    
    const VENDOR_ID = '65'; // Use working vendor ID
    const ACCOUNT_ID = '81'; // Professional Services
    
    let billsCreated = 0;
    const billDetails = [];
    
    for (const record of records) {
      const description = `August 2025 - ${record.first_name} ${record.last_name} Payroll`;
      console.log(`\nCreating bill: ${description} - $${record.gross_pay}`);
      
      const bill = {
        VendorRef: { value: VENDOR_ID },
        TotalAmt: parseFloat(record.gross_pay),
        Line: [{
          Amount: parseFloat(record.gross_pay),
          Description: description,
          DetailType: "AccountBasedExpenseLineDetail", 
          AccountBasedExpenseLineDetail: {
            AccountRef: { value: ACCOUNT_ID }
          }
        }]
      };
      
      try {
        const result = await new Promise((resolve, reject) => {
          qbo.createBill(bill, (err, createdBill) => {
            if (err) {
              reject(err);
            } else {
              resolve(createdBill);
            }
          });
        });
        
        const billId = result.Id;
        console.log(`✅ Bill created: ID ${billId}`);
        
        // Update database
        await db.execute(`
          UPDATE monthly_payroll 
          SET quickbooks_bill_id = '${billId}'
          WHERE id = ${record.payroll_id}
        `);
        
        billDetails.push({
          employee: `${record.first_name} ${record.last_name}`,
          amount: record.gross_pay,
          billId: billId
        });
        
        billsCreated++;
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.log(`❌ Failed: ${error?.Fault?.Error?.[0]?.Message || error.message}`);
      }
    }
    
    console.log(`\n🎉 AUGUST BILLS COMPLETE!`);
    console.log(`✅ Bills created: ${billsCreated}`);
    
    if (billDetails.length > 0) {
      console.log('\n📋 CREATED AUGUST BILLS:');
      billDetails.forEach(bill => {
        console.log(`✅ ${bill.employee}: $${bill.amount} (Bill ${bill.billId})`);
      });
      
      const totalAmount = billDetails.reduce((sum, bill) => sum + parseFloat(bill.amount), 0);
      console.log(`💰 Total August bills: $${totalAmount.toFixed(2)}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testAugustBills();