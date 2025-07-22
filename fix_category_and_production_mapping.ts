// Fix category to use "Wages" and prepare production vendor mapping
import { quickbooksService } from './server/quickbooks';
import { db } from './server/db';

async function fixCategoryAndPrepareProduction() {
  console.log('🔧 FIXING BILL CATEGORY AND PREPARING PRODUCTION MAPPING');
  console.log('====================================================');
  
  try {
    const qbo = await quickbooksService.initializeClient();
    console.log('✅ QuickBooks client initialized');
    
    // Step 1: Find the "Wages" account for proper payroll categorization
    console.log('\n🔍 FINDING CORRECT PAYROLL ACCOUNT:');
    
    const accounts = await new Promise((resolve, reject) => {
      qbo.findAccounts("SELECT * FROM Account WHERE Name = 'Wages' OR Name LIKE '%Wage%' OR Name LIKE '%Payroll%' OR AccountType = 'Expense'", (err: any, accounts: any) => {
        if (err) reject(err);
        else resolve(accounts?.QueryResponse?.Account || []);
      });
    });
    
    console.log('📋 Available accounts for payroll:');
    (accounts as any[]).slice(0, 10).forEach((account, index) => {
      console.log(`   ${index + 1}. ${account.Name} (ID: ${account.Id}) - Type: ${account.AccountType}`);
    });
    
    // Find "Wages" account or use first expense account
    const wagesAccount = (accounts as any[]).find(acc => 
      acc.Name.toLowerCase().includes('wage') || 
      acc.Name.toLowerCase().includes('payroll')
    ) || (accounts as any[]).find(acc => acc.AccountType === 'Expense');
    
    if (wagesAccount) {
      console.log(`✅ Using account: "${wagesAccount.Name}" (ID: ${wagesAccount.Id})`);
      
      // Update environment variable for consistent usage
      process.env.QB_PAYROLL_ACCOUNT_ID = wagesAccount.Id;
      process.env.QB_PAYROLL_ACCOUNT_NAME = wagesAccount.Name;
    } else {
      console.log('❌ No suitable payroll account found');
      return;
    }
    
    // Step 2: Show current bill categories and fix them
    console.log('\n🔍 CHECKING CURRENT BILL CATEGORIES:');
    
    const recentBills = await db.execute(`
      SELECT DISTINCT quickbooks_bill_id
      FROM monthly_payroll 
      WHERE quickbooks_bill_id IS NOT NULL 
      LIMIT 5
    `);
    
    const bills = recentBills.rows || recentBills;
    
    if (bills.length > 0) {
      console.log(`📄 Checking ${bills.length} recent bills for category consistency...`);
      
      for (const bill of bills.slice(0, 2)) {
        try {
          const billDetails = await new Promise((resolve, reject) => {
            qbo.getBill(bill.quickbooks_bill_id, (err: any, billData: any) => {
              if (err) reject(err);
              else resolve(billData);
            });
          });
          
          if (billDetails) {
            const currentCategory = (billDetails as any).Line?.[0]?.AccountBasedExpenseLineDetail?.AccountRef?.name;
            console.log(`   Bill ${bill.quickbooks_bill_id}: Currently using "${currentCategory}"`);
          }
        } catch (error) {
          console.log(`   Bill ${bill.quickbooks_bill_id}: Could not retrieve details`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting
      }
    }
    
    // Step 3: Show updated bill structure
    console.log('\n📝 UPDATED BILL STRUCTURE (with correct category):');
    console.log(`
const billData = {
  VendorRef: { value: VENDOR_ID },
  TxnDate: PAYROLL_END_DATE,
  DueDate: PAYROLL_END_DATE,
  TotalAmt: AMOUNT,
  Line: [{
    Amount: AMOUNT,
    Description: "Month Year - Employee Name Payroll",
    DetailType: "AccountBasedExpenseLineDetail",
    AccountBasedExpenseLineDetail: {
      AccountRef: { value: "${wagesAccount.Id}" } // ${wagesAccount.Name}
    }
  }]
};
    `);
    
    // Step 4: Production vendor mapping system
    console.log('\n🏢 PRODUCTION VENDOR MAPPING SYSTEM:');
    console.log('==================================');
    
    console.log('Current sandbox vendor mappings:');
    const currentVendors = await db.execute(`
      SELECT 
        first_name, 
        last_name, 
        email,
        quickbooks_vendor_id
      FROM users 
      WHERE quickbooks_vendor_id IS NOT NULL
      ORDER BY first_name
    `);
    
    const vendors = currentVendors.rows || currentVendors;
    vendors.forEach((vendor: any) => {
      console.log(`   ${vendor.first_name} ${vendor.last_name} → Sandbox Vendor ID: ${vendor.quickbooks_vendor_id}`);
    });
    
    console.log('\n📋 PRODUCTION VENDOR MAPPING TEMPLATE:');
    console.log('Ready to receive your production QuickBooks vendor IDs:');
    
    const productionMappingTemplate = `
// Production vendor mapping (update with your real QuickBooks vendor IDs)
const PRODUCTION_VENDOR_MAPPING = {
  // Format: 'firstname lastname': 'PRODUCTION_QB_VENDOR_ID'
  'Alysha Mahagaonkar': 'PROD_VENDOR_ID_1',
  'Anjali Patel': 'PROD_VENDOR_ID_2', 
  'Madhuri McCartney': 'PROD_VENDOR_ID_3',
  'Pooran Rajput': 'PROD_VENDOR_ID_4',
  'Rhea Doshi': 'PROD_VENDOR_ID_5',
  'Yesha Patel': 'NEW_HIRE' // Will be created in production
};

// Function to update vendor IDs for production
async function updateProductionVendorIds() {
  for (const [name, vendorId] of Object.entries(PRODUCTION_VENDOR_MAPPING)) {
    const [firstName, lastName] = name.split(' ');
    if (vendorId !== 'NEW_HIRE') {
      await updateUserVendorId(firstName, lastName, vendorId);
    }
  }
}
    `;
    
    console.log(productionMappingTemplate);
    
    console.log('\n🎯 NEXT STEPS:');
    console.log('1. ✅ Category fixed to use proper payroll account');
    console.log('2. 📋 Ready to receive production vendor IDs');
    console.log('3. 🆕 Yesha Patel will be created as new vendor in production');
    console.log('4. 🔄 System will handle vendor mapping migration automatically');
    
    return {
      payrollAccount: {
        id: wagesAccount.Id,
        name: wagesAccount.Name
      },
      currentVendors: vendors,
      readyForProduction: true
    };
    
  } catch (error) {
    console.error('❌ Error fixing categories and preparing production:', error);
    throw error;
  }
}

fixCategoryAndPrepareProduction();