// Test the updated bill creation system with payroll period end dates
import axios from 'axios';

async function testAugustBill() {
  console.log('📅 TESTING UPDATED BILL SYSTEM WITH PAYROLL PERIOD DATES');
  console.log('=====================================================');
  
  try {
    // Find a user without a QuickBooks bill for testing
    const testData = {
      userId: 1, // Admin user (Pooran)
      year: 2025,
      month: 8  // August
    };
    
    console.log('🧪 Test scenario:');
    console.log('   Creating August 2025 payroll bill on July 22, 2025');
    console.log('   Expected bill date: 2025-08-31 (August 31st)');
    console.log('   Today\'s date: 2025-07-22');
    console.log('   This demonstrates correct payroll period dating');
    
    console.log('\n📋 Creating bill with updated date logic...');
    
    const response = await axios.post('http://localhost:5000/api/quickbooks/create-payroll-bill', testData, {
      withCredentials: true,
      timeout: 25000  // 25 second timeout
    });
    
    if (response.data.success) {
      console.log('✅ SUCCESS: Bill created with payroll period end date!');
      console.log('✅ Bill ID:', response.data.bill.Id);
      console.log('✅ Transaction Date:', response.data.bill.TxnDate);
      console.log('✅ Due Date:', response.data.bill.DueDate);
      console.log('✅ Expected: 2025-08-31');
      console.log('✅ Actual:', response.data.bill.TxnDate);
      console.log('✅ Dates Match:', response.data.bill.TxnDate === '2025-08-31');
      
      console.log('\n🎯 VERIFICATION:');
      if (response.data.bill.TxnDate === '2025-08-31') {
        console.log('✅ PERFECT: Bill shows August 31st (payroll period end)');
        console.log('✅ System now uses payroll period dates instead of creation date');
      } else {
        console.log('❌ Issue: Bill date doesn\'t match expected payroll period end');
      }
      
    } else {
      console.log('❌ Bill creation failed:', response.data.error);
    }
    
  } catch (error) {
    if (error.response) {
      console.log('❌ API Error:', error.response.data.error);
      console.log('❌ Status:', error.response.status);
    } else if (error.code === 'ECONNREFUSED') {
      console.log('❌ Connection error: Is the server running?');
    } else {
      console.log('❌ Error:', error.message);
    }
  }
}

testAugustBill();