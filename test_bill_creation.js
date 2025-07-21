// Direct QuickBooks bill creation test
const { QuickBooksService } = require('./server/quickbooks');

async function testBillCreation() {
  try {
    console.log('🔧 Testing direct bill creation...');
    
    const qbService = new QuickBooksService();
    const qbo = await qbService.initializeClient();
    
    // Test basic bill creation with vendor ID 65 (Pooran Rajput)
    const testBill = {
      VendorRef: { value: "65" },
      TotalAmt: 60.00,
      Line: [{
        Amount: 60.00,
        Description: "July 2025 - Pooran Rajput Payroll",
        DetailType: "AccountBasedExpenseLineDetail",
        AccountBasedExpenseLineDetail: {
          AccountRef: { value: "1" } // Using a basic expense account
        }
      }]
    };
    
    console.log('💰 Creating test bill:', JSON.stringify(testBill, null, 2));
    
    const result = await new Promise((resolve, reject) => {
      qbo.createBill(testBill, (err, bill) => {
        if (err) {
          console.error('❌ Test bill failed:', err);
          reject(err);
        } else {
          console.log('✅ Test bill created:', bill);
          resolve(bill);
        }
      });
    });
    
    console.log('🎉 SUCCESS! Bill ID:', result.Id);
    return result;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

testBillCreation().catch(console.error);