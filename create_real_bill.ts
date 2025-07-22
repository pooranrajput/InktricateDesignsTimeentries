// Create actual QuickBooks bill for Pooran Rajput
import { QuickBooksService } from './server/quickbooks.js';

async function createRealBill() {
  try {
    console.log('🔧 Creating REAL QuickBooks bill...');
    
    const qbService = new QuickBooksService();
    const qbo = await qbService.initializeClient();
    console.log('✅ QuickBooks connected');
    
    // Create bill for Pooran Rajput (vendor ID 65)
    const billData = {
      VendorRef: { value: "65" },
      TotalAmt: 60.00,
      Line: [{
        Amount: 60.00,
        Description: "July 2025 - Pooran Rajput Payroll",
        DetailType: "AccountBasedExpenseLineDetail",
        AccountBasedExpenseLineDetail: {
          AccountRef: { value: "1" }
        }
      }]
    };
    
    console.log('💰 Creating bill with data:', JSON.stringify(billData, null, 2));
    
    // Create the bill with proper error handling
    const createdBill = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Bill creation timed out after 15 seconds'));
      }, 15000);
      
      qbo.createBill(billData, (err: any, bill: any) => {
        clearTimeout(timeout);
        if (err) {
          console.error('❌ Bill creation error:', err);
          reject(err);
        } else {
          console.log('✅ Bill created successfully:', bill);
          resolve(bill);
        }
      });
    });
    
    const billId = (createdBill as any).Id;
    console.log('🎉 REAL BILL CREATED! Bill ID:', billId);
    console.log('💰 Amount:', (createdBill as any).TotalAmt);
    
    return {
      success: true,
      billId: billId,
      amount: (createdBill as any).TotalAmt,
      vendor: 'Pooran Rajput (ID: 65)',
      description: 'July 2025 - Pooran Rajput Payroll'
    };
    
  } catch (error) {
    console.error('❌ Failed to create real bill:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

createRealBill().then(result => {
  if (result.success) {
    console.log('🎉 SUCCESS! Your QuickBooks bill number is:', result.billId);
    console.log('💰 Amount: $' + result.amount);
    console.log('👤 Vendor:', result.vendor);
    console.log('📝 Description:', result.description);
  } else {
    console.log('❌ Bill creation failed:', result.error);
  }
  process.exit(result.success ? 0 : 1);
}).catch(error => {
  console.error('❌ Script error:', error);
  process.exit(1);
});