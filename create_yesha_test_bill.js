// Create test bill for Yesha Patel - July 2025 payroll
import { QuickBooksService } from './server/quickbooks.ts';
import { db } from './server/db.ts';
import { monthlyPayroll } from './shared/schema.ts';
import { eq } from 'drizzle-orm';

async function createYeshaTestBill() {
  console.log('🧪 CREATING TEST BILL FOR YESHA PATEL - JULY 2025');
  console.log('==================================================');
  
  try {
    // Initialize QuickBooks service
    const quickbooksService = new QuickBooksService();
    await quickbooksService.initializeClient();
    console.log('✅ QuickBooks connection established');
    
    // Create test bill data for Yesha (using her actual payroll data)
    const yeshaPayrollData = {
      id: 78, // Actual payroll record ID
      year: 2025,
      month: 7,
      totalHours: '15.00',
      grossPay: '225.00', // Actual amount: 15 hours × $15/hour
      firstName: 'Yesha',
      lastName: 'Patel',
      quickbooksVendorId: '440' // Yesha's QB vendor ID
    };
    
    const yeshaVendor = {
      vendorId: '440',
      firstName: 'Yesha',
      lastName: 'Patel'
    };
    
    console.log('\n📋 BILL CREATION DATA:');
    console.log('======================');
    console.log('Contractor:', yeshaPayrollData.firstName, yeshaPayrollData.lastName);
    console.log('Period:', 'July 2025');
    console.log('Vendor ID:', yeshaPayrollData.quickbooksVendorId);
    console.log('Amount:', yeshaPayrollData.grossPay);
    console.log('Account ID: 108 (Payroll expenses:Wages)');
    
    console.log('\n🔧 Creating QuickBooks bill...');
    const createdBill = await quickbooksService.createContractorBill(yeshaPayrollData, yeshaVendor);
    
    console.log('\n🎉 BILL CREATED SUCCESSFULLY!');
    console.log('============================');
    console.log('Bill ID:', createdBill.Id);
    console.log('Vendor:', createdBill.VendorRef?.name);
    console.log('Amount:', createdBill.TotalAmt);
    console.log('Date:', createdBill.TxnDate);
    console.log('Description:', createdBill.Line?.[0]?.Description);
    console.log('Account Used:', createdBill.Line?.[0]?.AccountBasedExpenseLineDetail?.AccountRef?.value);
    console.log('Account Name:', createdBill.Line?.[0]?.AccountBasedExpenseLineDetail?.AccountRef?.name);
    
    console.log('\n✅ TEST BILL CREATION COMPLETED');
    console.log('Ready for user validation and approval');
    
    return {
      success: true,
      billId: createdBill.Id,
      contractor: 'Yesha Patel',
      amount: createdBill.TotalAmt,
      period: 'July 2025',
      accountUsed: createdBill.Line?.[0]?.AccountBasedExpenseLineDetail?.AccountRef
    };
    
  } catch (error) {
    console.error('❌ Error creating test bill:', error?.message || error);
    console.error('Full error details:', error);
    return {
      success: false,
      error: error?.message || 'Unknown error',
      contractor: 'Yesha Patel'
    };
  }
}

// Run the test bill creation
createYeshaTestBill()
  .then((result) => {
    if (result.success) {
      console.log('\n🎯 TEST BILL RESULT: SUCCESS');
      console.log('Bill ID:', result.billId);
      console.log('Ready for user approval');
    } else {
      console.log('\n❌ TEST BILL RESULT: FAILED');
      console.log('Error:', result.error);
    }
  })
  .catch((error) => {
    console.error('Script error:', error);
  });