// Direct script to lookup QuickBooks bill 3858 and find the account ID
import { QuickBooksService } from './server/quickbooks.ts';

async function lookupBill3858() {
  console.log('🔍 LOOKING UP QUICKBOOKS BILL 3858 FOR ACCOUNT MAPPING');
  console.log('=======================================================');
  
  try {
    // Initialize QuickBooks connection
    console.log('🔗 Initializing QuickBooks connection...');
    const quickbooksService = new QuickBooksService();
    await quickbooksService.initializeClient();
    console.log('✅ QuickBooks connection established');
    
    // Get bill details
    console.log('\n📄 Retrieving bill 3858 details...');
    const bill = await quickbooksService.getBillById('3858');
    
    console.log('\n🎯 BILL 3858 ANALYSIS:');
    console.log('======================');
    console.log('Bill ID:', bill?.Id);
    console.log('Vendor:', bill?.VendorRef?.name, '(ID:', bill?.VendorRef?.value + ')');
    console.log('Total Amount:', bill?.TotalAmt);
    console.log('Transaction Date:', bill?.TxnDate);
    console.log('Due Date:', bill?.DueDate);
    
    if (bill?.Line && Array.isArray(bill.Line)) {
      console.log('\n💰 LINE ITEMS ANALYSIS:');
      console.log('=======================');
      
      bill.Line.forEach((line, index) => {
        console.log(`\nLine ${index + 1}:`);
        console.log('  Amount:', line.Amount);
        console.log('  Description:', line.Description);
        console.log('  Detail Type:', line.DetailType);
        
        if (line.AccountBasedExpenseLineDetail?.AccountRef) {
          const accountRef = line.AccountBasedExpenseLineDetail.AccountRef;
          console.log('  ⭐ ACCOUNT ID:', accountRef.value);
          console.log('  ⭐ ACCOUNT NAME:', accountRef.name);
          
          console.log('\n🎯 FOUND THE ACCOUNT TO USE:');
          console.log(`    Account ID: "${accountRef.value}"`);
          console.log(`    Account Name: "${accountRef.name}"`);
          console.log('    This is the account ID we should use for bill creation!');
        }
        
        if (line.ItemBasedExpenseLineDetail?.ItemRef) {
          const itemRef = line.ItemBasedExpenseLineDetail.ItemRef;
          console.log('  Item ID:', itemRef.value);
          console.log('  Item Name:', itemRef.name);
        }
      });
    }
    
    console.log('\n🔧 CURRENT MAPPING vs PRODUCTION REALITY:');
    console.log('=========================================');
    console.log('Current code uses: process.env.QB_PAYROLL_ACCOUNT || "1150040000"');
    console.log('Production bill 3858 uses: [ACCOUNT ID FOUND ABOVE]');
    console.log('We need to update our bill creation to use the production account ID');
    
    return bill;
    
  } catch (error) {
    console.error('❌ Error looking up bill:', error?.message || error);
    console.error('Full error:', error);
    return null;
  }
}

// Run the lookup
lookupBill3858()
  .then((result) => {
    if (result) {
      console.log('\n✅ Bill lookup completed successfully');
    } else {
      console.log('\n❌ Bill lookup failed');
    }
  })
  .catch((error) => {
    console.error('Script error:', error);
  });