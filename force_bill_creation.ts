// Force bill creation using TypeScript and direct QB API call
import { QuickBooksService } from './server/quickbooks.js';
import { PostgreSQLStorage } from './server/storage.js';

async function forceBillCreation() {
  try {
    console.log('🔧 Force creating QuickBooks bill for Pooran Rajput...');
    
    // Initialize QuickBooks service
    const qbService = new QuickBooksService();
    const qbo = await qbService.initializeClient();
    console.log('✅ QuickBooks client ready');
    
    // Initialize storage
    const storage = new PostgreSQLStorage();
    console.log('✅ Storage ready');
    
    // Create bill for Pooran Rajput (vendor ID 65) - $60 July payroll
    const billToCreate = {
      VendorRef: { value: "65" },
      TotalAmt: 60.00,
      Line: [{
        Amount: 60.00,
        Description: "July 2025 - Pooran Rajput Payroll",
        DetailType: "AccountBasedExpenseLineDetail",
        AccountBasedExpenseLineDetail: {
          AccountRef: { value: "1" } // Using expense account
        }
      }]
    };
    
    console.log('💰 Creating bill:', JSON.stringify(billToCreate, null, 2));
    
    // Create the bill
    const createdBill = await new Promise((resolve, reject) => {
      console.log('🔄 Calling QB createBill...');
      qbo.createBill(billToCreate, (err: any, bill: any) => {
        if (err) {
          console.error('❌ QB API Error:', err);
          reject(err);
        } else {
          console.log('✅ QB Bill Created:', bill);
          resolve(bill);
        }
      });
    });
    
    const billId = (createdBill as any).Id;
    console.log('🎉 SUCCESS! Bill created with ID:', billId);
    
    // Update the payroll record with the new bill ID
    await storage.updateMonthlyPayroll('11', {
      quickbooksBillId: billId.toString()
    });
    console.log('💾 Updated payroll record with QB bill ID:', billId);
    
    // Verify bill in QuickBooks
    const verification = await new Promise((resolve, reject) => {
      qbo.findBills(`SELECT * FROM Bill WHERE Id = '${billId}'`, (err: any, bills: any) => {
        if (err) reject(err);
        else resolve(bills?.QueryResponse?.Bill || []);
      });
    });
    
    console.log('✅ BILL VERIFICATION:', JSON.stringify(verification, null, 2));
    
    return {
      billId,
      amount: (createdBill as any).TotalAmt,
      verification: verification
    };
    
  } catch (error) {
    console.error('❌ Force bill creation failed:', error);
    throw error;
  }
}

// Execute force bill creation
forceBillCreation()
  .then(result => {
    console.log('🎉 BILL CREATION COMPLETE!');
    console.log('📋 Bill ID:', result.billId);
    console.log('💰 Amount:', result.amount);
    console.log('✅ Successfully created and verified QuickBooks bill for Pooran Rajput!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Final error:', error);
    process.exit(1);
  });