// Force bill creation script - bypassing API issues
import { quickbooksService } from './server/quickbooks';
import { db } from './server/db';
import { users, monthlyPayroll } from './shared/schema';
import { eq, and } from 'drizzle-orm';

async function forceBillCreation() {
  console.log('🚀 FORCE BILL CREATION - DIRECT APPROACH');
  console.log('=====================================');
  
  try {
    // Get payroll record directly
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
    
    console.log('✅ Found payroll record:', payrollRecord);
    
    // Get user with vendor ID
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, '43458679'));
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('✅ Found user:', user);
    console.log('✅ Vendor ID:', user.quickbooksVendorId);
    
    if (!user.quickbooksVendorId) {
      console.log('❌ No vendor ID');
      return;
    }
    
    // Initialize QuickBooks client
    const qbo = await quickbooksService.initializeClient();
    console.log('✅ QuickBooks client initialized');
    
    // Find Wages account with corrected query syntax
    const accounts = await new Promise((resolve, reject) => {
      qbo.findAccounts("SELECT * FROM Account WHERE Name = 'Wages'", (err: any, accounts: any) => {
        if (err) {
          console.log('Wages account not found, trying expense accounts...');
          qbo.findAccounts("SELECT * FROM Account WHERE AccountType = 'Expense' MAXRESULTS 5", (err2: any, accounts2: any) => {
            if (err2) reject(err2);
            else resolve(accounts2?.QueryResponse?.Account || []);
          });
        } else {
          resolve(accounts?.QueryResponse?.Account || []);
        }
      });
    });
    
    if ((accounts as any[]).length === 0) {
      console.log('❌ No accounts found');
      return;
    }
    
    const accountRef = { value: (accounts as any[])[0].Id };
    const accountName = (accounts as any[])[0].Name;
    console.log('✅ Using account:', accountName, 'ID:', accountRef.value);
    
    // Create bill object
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
          AccountRef: accountRef
        }
      }]
    };
    
    console.log('💰 Bill object:', JSON.stringify(bill, null, 2));
    
    // Create bill in QuickBooks
    const result = await new Promise((resolve, reject) => {
      console.log('💰 Creating bill...');
      qbo.createBill(bill, (err: any, createdBill: any) => {
        if (err) {
          console.log('❌ Error:', err);
          reject(err);
        } else {
          console.log('✅ Success:', createdBill);
          resolve(createdBill);
        }
      });
    });
    
    if (result && (result as any).Id) {
      const billId = (result as any).Id;
      console.log(`🎉 BILL CREATED! ID: ${billId}`);
      
      // Update database
      await db
        .update(monthlyPayroll)
        .set({
          quickbooksBillId: billId.toString(),
          updatedAt: new Date(),
        })
        .where(eq(monthlyPayroll.id, payrollRecord.id));
      
      console.log('💾 Database updated with bill ID');
      
      // Verify in QuickBooks
      setTimeout(async () => {
        const verification = await new Promise((resolve, reject) => {
          qbo.findBills(`SELECT * FROM Bill WHERE Id = '${billId}'`, (err: any, bills: any) => {
            if (err) reject(err);
            else resolve(bills?.QueryResponse?.Bill || []);
          });
        });
        console.log('🔍 Verification:', verification);
      }, 2000);
    }
    
  } catch (error) {
    console.log('❌ Error:', error);
  }
}

forceBillCreation();