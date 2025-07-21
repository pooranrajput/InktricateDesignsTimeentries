// Direct QuickBooks bill creation using the server module
import('./server/quickbooks.js').then(async (qbModule) => {
  try {
    console.log('🔧 Initializing QuickBooks service...');
    
    const { QuickBooksService } = qbModule;
    const qbService = new QuickBooksService();
    const qbo = await qbService.initializeClient();
    
    console.log('✅ QuickBooks client initialized');
    
    // Create bill matching manual structure (Bill ID 145)
    const payrollBill = {
      VendorRef: { value: "65" }, // Pooran Rajput
      TotalAmt: 60.00,
      Line: [{
        Amount: 60.00,
        Description: "July 2025 - Pooran Rajput Payroll",
        DetailType: "AccountBasedExpenseLineDetail",
        AccountBasedExpenseLineDetail: {
          AccountRef: { value: "1" } // Professional Services or similar expense account
        }
      }]
    };
    
    console.log('💰 Creating payroll bill:', JSON.stringify(payrollBill, null, 2));
    
    // Create the bill
    const createdBill = await new Promise((resolve, reject) => {
      qbo.createBill(payrollBill, (err, bill) => {
        if (err) {
          console.error('❌ Bill creation failed:', err);
          reject(err);
        } else {
          console.log('✅ Bill created successfully!');
          resolve(bill);
        }
      });
    });
    
    console.log('🎉 SUCCESS! Created bill:');
    console.log('📋 Bill ID:', createdBill.Id);
    console.log('💰 Amount:', createdBill.TotalAmt);
    console.log('👤 Vendor:', createdBill.VendorRef);
    
    // Update the database with the new bill ID
    console.log('💾 Need to update payroll record with QB bill ID:', createdBill.Id);
    
    return createdBill;
    
  } catch (error) {
    console.error('❌ Direct bill creation failed:', error);
    process.exit(1);
  }
}).catch(error => {
  console.error('❌ Import failed:', error);
  process.exit(1);
});