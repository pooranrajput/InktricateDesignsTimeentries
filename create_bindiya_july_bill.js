// Create QuickBooks vendor bill for Bindiya Rajput - July 2025 payroll
const apiUrl = process.env.NODE_ENV === 'production' 
  ? 'https://inkticate-time-tracker-pooranrajput.replit.app'
  : 'http://localhost:5000';

async function createBindiyaJulyBill() {
  console.log('💰 CREATING QUICKBOOKS BILL FOR BINDIYA RAJPUT - JULY 2025');
  console.log('=======================================================');
  
  try {
    // Prepare bill data for Bindiya's July 2025 payroll
    const billData = {
      vendorId: '399', // Bindiya's QuickBooks vendor ID
      month: 7,
      year: 2025,
      vendorRef: 'founder_bindiya_rajput',
      amount: 4000.00,
      description: 'Monthly salary - July 2025 (160 hours @ $25/hr)',
      accountId: '108' // Payroll expenses:Wages account
    };
    
    console.log('📋 Bill Details:');
    console.log(`   Vendor: Bindiya Rajput (ID: ${billData.vendorId})`);
    console.log(`   Period: July 2025`);
    console.log(`   Amount: $${billData.amount.toFixed(2)}`);
    console.log(`   Account: Payroll expenses:Wages (${billData.accountId})`);
    
    // Create the bill using the direct API endpoint
    console.log('\n🔄 Creating bill in QuickBooks...');
    
    const response = await fetch(`${apiUrl}/api/quickbooks/create-payroll-bill`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(billData)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const result = await response.json();
    
    console.log('✅ BILL CREATION SUCCESSFUL!');
    console.log('===========================');
    console.log(`   Bill ID: ${result.billId}`);
    console.log(`   Amount: $${result.amount}`);
    console.log(`   Date: ${result.txnDate}`);
    console.log(`   Status: ${result.status || 'Created'}`);
    
    if (result.docNumber) {
      console.log(`   Document Number: ${result.docNumber}`);
    }
    
    console.log('\n📊 BINDIYA JULY 2025 PAYROLL SUMMARY:');
    console.log('=====================================');
    console.log('✓ QuickBooks vendor bill created successfully');
    console.log('✓ $4,000 monthly salary processed');
    console.log('✓ Proper account mapping applied');
    console.log('✓ Ready for payment processing');
    
    return {
      success: true,
      billId: result.billId,
      amount: result.amount,
      vendor: 'Bindiya Rajput',
      period: 'July 2025'
    };
    
  } catch (error) {
    console.error('❌ BILL CREATION FAILED:', error.message);
    console.log('\n🔍 TROUBLESHOOTING STEPS:');
    console.log('1. Verify QuickBooks connection is active');
    console.log('2. Check vendor ID 399 exists for Bindiya');
    console.log('3. Ensure account ID 108 is accessible');
    console.log('4. Verify API credentials are valid');
    
    return {
      success: false,
      error: error.message,
      vendor: 'Bindiya Rajput',
      period: 'July 2025'
    };
  }
}

// Execute the bill creation
createBindiyaJulyBill()
  .then((result) => {
    if (result.success) {
      console.log(`\n🎉 SUCCESS! Bill ${result.billId} created for ${result.vendor} - ${result.period}`);
    } else {
      console.log(`\n💥 FAILED to create bill for ${result.vendor} - ${result.period}`);
      console.log(`Error: ${result.error}`);
    }
  })
  .catch((error) => {
    console.error('❌ Script execution failed:', error);
  });