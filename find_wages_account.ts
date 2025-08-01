// Find and set up proper "Wages" account for payroll bills
import { quickbooksService } from './server/quickbooks';

async function findWagesAccount() {
  console.log('🔍 FINDING WAGES ACCOUNT FOR PAYROLL BILLS');
  console.log('========================================');
  
  try {
    const qbo = await quickbooksService.initializeClient();
    console.log('✅ QuickBooks client initialized');
    
    // Search for all expense accounts first
    console.log('\n📋 Searching for expense accounts...');
    
    const expenseAccounts = await new Promise((resolve, reject) => {
      qbo.findAccounts("SELECT * FROM Account WHERE AccountType = 'Expense'", (err: any, accounts: any) => {
        if (err) reject(err);
        else resolve(accounts?.QueryResponse?.Account || []);
      });
    });
    
    console.log(`Found ${(expenseAccounts as any[]).length} expense accounts:`);
    
    // Look for wages/payroll accounts
    const payrollAccounts = (expenseAccounts as any[]).filter(account => 
      account.Name.toLowerCase().includes('wage') ||
      account.Name.toLowerCase().includes('payroll') ||
      account.Name.toLowerCase().includes('salary')
    );
    
    console.log('\n💰 PAYROLL-RELATED ACCOUNTS:');
    if (payrollAccounts.length > 0) {
      payrollAccounts.forEach((account, index) => {
        console.log(`   ${index + 1}. "${account.Name}" (ID: ${account.Id})`);
      });
      
      // Use the first wages/payroll account found
      const selectedAccount = payrollAccounts[0];
      console.log(`\n✅ RECOMMENDED: Use "${selectedAccount.Name}" (ID: ${selectedAccount.Id})`);
      
      return {
        accountId: selectedAccount.Id,
        accountName: selectedAccount.Name,
        found: true
      };
      
    } else {
      console.log('❌ No specific wages/payroll accounts found');
      console.log('\n📋 ALL EXPENSE ACCOUNTS:');
      (expenseAccounts as any[]).slice(0, 10).forEach((account, index) => {
        console.log(`   ${index + 1}. "${account.Name}" (ID: ${account.Id})`);
      });
      
      // Use first expense account as fallback
      if ((expenseAccounts as any[]).length > 0) {
        const fallbackAccount = (expenseAccounts as any[])[0];
        console.log(`\n⚠️  FALLBACK: Using "${fallbackAccount.Name}" (ID: ${fallbackAccount.Id})`);
        
        return {
          accountId: fallbackAccount.Id,
          accountName: fallbackAccount.Name,
          found: false,
          fallback: true
        };
      }
    }
    
    throw new Error('No expense accounts found');
    
  } catch (error) {
    console.error('❌ Error finding wages account:', error);
    throw error;
  }
}

findWagesAccount().then(result => {
  console.log('\n🎯 RESULT:');
  console.log(`Account ID: ${result.accountId}`);
  console.log(`Account Name: ${result.accountName}`);
  if (result.found) {
    console.log('✅ Perfect: Found dedicated payroll account');
  } else if (result.fallback) {
    console.log('⚠️  Using fallback expense account');
  }
});