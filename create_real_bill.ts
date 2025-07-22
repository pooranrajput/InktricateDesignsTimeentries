// Direct bill creation using known account IDs and proper QB syntax
import { quickbooksService } from './server/quickbooks';
import { db } from './server/db';
import { users, monthlyPayroll } from './shared/schema';
import { eq, and } from 'drizzle-orm';

async function createRealBill() {
  console.log('💰 CREATING REAL QUICKBOOKS BILL');
  console.log('================================');
  
  try {
    // Get payroll record
    const [payrollRecord] = await db
      .select()
      .from(monthlyPayroll)
      .where(
        and(
          eq(monthlyPayroll.userId, '43458679'),
          eq(monthlyPayroll.year, 2025),
          eq(monthlyPayroll.month, 8)
        )
      );
    
    if (!payrollRecord) {
      console.log('❌ No payroll record found');
      return;
    }
    
    console.log('✅ Payroll record found:', payrollRecord);
    
    // Get user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, '43458679'));
    
    console.log('✅ User found:', user);
    
    if (!user.quickbooksVendorId) {
      console.log('❌ No vendor ID');
      return;
    }
    
    // Initialize QB client
    const qbo = await quickbooksService.initializeClient();
    console.log('✅ QB client initialized');
    
    // Use known account ID from previous manual bills - let's find accounts first
    console.log('💰 Searching for accounts...');
    
    const allAccounts = await new Promise((resolve, reject) => {
      qbo.findAccounts("SELECT * FROM Account WHERE AccountType = 'Expense'", (err: any, accounts: any) => {
        if (err) {
          console.log('Account search error:', err);
          reject(err);
        } else {
          console.log('Accounts found:', accounts?.QueryResponse?.Account?.length || 0);
          resolve(accounts?.QueryResponse?.Account || []);
        }
      });
    });
    
    console.log('📋 Available expense accounts:');
    (allAccounts as any[]).forEach((account: any, index: number) => {
      console.log(`${index + 1}. ${account.Name} (ID: ${account.Id}) - Type: ${account.AccountType}`);
    });
    
    // Use the first expense account (or find Professional Services like previous manual bill)
    let targetAccount = (allAccounts as any[]).find((acc: any) => 
      acc.Name === 'Professional Services' || acc.Name === 'Wages'
    );
    
    if (!targetAccount) {
      targetAccount = (allAccounts as any[])[0]; // Use first available expense account
    }
    
    console.log('💰 Using account:', targetAccount.Name, 'ID:', targetAccount.Id);
    
    // Create bill with new format
    const vendorRef = { value: user.quickbooksVendorId };
    const description = `August 2025 - ${user.firstName} ${user.lastName} Payroll`;
    
    const bill = {
      VendorRef: vendorRef,
      TotalAmt: parseFloat(payrollRecord.grossPay.toString()),
      Line: [{
        Amount: parseFloat(payrollRecord.grossPay.toString()),
        Description: description,
        DetailType: "AccountBasedExpenseLineDetail",
        AccountBasedExpenseLineDetail: {
          AccountRef: { value: targetAccount.Id }
        }
      }]
    };
    
    console.log('💰 Bill object to create:');
    console.log(JSON.stringify(bill, null, 2));
    
    // Create the bill
    console.log('💰 Creating bill in QuickBooks...');
    const result = await new Promise((resolve, reject) => {
      qbo.createBill(bill, (err: any, createdBill: any) => {
        if (err) {
          console.log('❌ Bill creation error:', err);
          reject(err);
        } else {
          console.log('✅ Bill created successfully:', createdBill);
          resolve(createdBill);
        }
      });
    });
    
    if (result && (result as any).Id) {
      const billId = (result as any).Id;
      console.log(`🎉 SUCCESS! Bill created with ID: ${billId}`);
      console.log(`💰 Amount: $${(result as any).TotalAmt}`);
      console.log(`📝 Description: ${description}`);
      console.log(`🏢 Account: ${targetAccount.Name}`);
      console.log(`👤 Vendor: ${user.firstName} ${user.lastName} (ID: ${user.quickbooksVendorId})`);
      
      // Update database
      await db
        .update(monthlyPayroll)
        .set({
          quickbooksBillId: billId.toString(),
          updatedAt: new Date(),
        })
        .where(eq(monthlyPayroll.id, payrollRecord.id));
      
      console.log('💾 Database updated with bill ID');
      
      // Verify in QuickBooks after 2 seconds
      setTimeout(async () => {
        try {
          const verification = await new Promise((resolve, reject) => {
            qbo.findBills(`SELECT * FROM Bill WHERE Id = '${billId}'`, (err: any, bills: any) => {
              if (err) {
                console.log('Verification error:', err);
                reject(err);
              } else {
                resolve(bills?.QueryResponse?.Bill || []);
              }
            });
          });
          
          if ((verification as any[]).length > 0) {
            console.log('✅ VERIFICATION SUCCESS: Bill exists in QuickBooks');
            console.log('📋 Bill details:', (verification as any[])[0]);
          } else {
            console.log('⚠️ Bill not found in verification');
          }
        } catch (verifyErr) {
          console.log('⚠️ Verification failed:', verifyErr);
        }
      }, 2000);
    }
    
  } catch (error) {
    console.log('❌ Overall error:', error);
  }
}

createRealBill();