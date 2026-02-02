import { db } from "../server/db";
import { quickbooksConfig, monthlyPayroll } from "../shared/schema";
import { eq, and } from "drizzle-orm";
import QuickBooks from "node-quickbooks";

const PAYROLL_ACCOUNT_ID = "108";

async function fixRheaBill() {
  console.log('🔧 Fixing Rhea\'s January 2026 bill...\n');
  
  const [config] = await db.select().from(quickbooksConfig).limit(1);
  
  const qbo = new QuickBooks(
    process.env.QUICKBOOKS_CLIENT_ID!,
    process.env.QUICKBOOKS_CLIENT_SECRET!,
    config.accessToken,
    false,
    config.companyId,
    config.sandbox || false,
    false,
    null,
    '2.0',
    config.refreshToken
  );
  
  // Get the incorrect bill
  const incorrectBillId = '5547';
  
  console.log(`1. Getting incorrect bill #${incorrectBillId}...`);
  
  const bill = await new Promise<any>((resolve, reject) => {
    qbo.getBill(incorrectBillId, (err: any, bill: any) => {
      if (err) reject(err);
      else resolve(bill);
    });
  });
  
  console.log(`   Found: ${bill.VendorRef.name} - $${bill.TotalAmt}`);
  
  // Delete/void the bill
  console.log(`\n2. Deleting incorrect bill #${incorrectBillId}...`);
  
  await new Promise<void>((resolve, reject) => {
    qbo.deleteBill({ Id: bill.Id, SyncToken: bill.SyncToken }, (err: any) => {
      if (err) {
        console.error('Delete error:', err?.Fault?.Error?.[0]?.Detail || err);
        reject(err);
      } else {
        console.log('   ✅ Bill deleted');
        resolve();
      }
    });
  });
  
  // Create correct bill with line items for each task rate
  console.log('\n3. Creating correct bill with task-specific rates...');
  
  const correctAmount = 918.75 + 195.00; // Design + Production
  
  const vendors = await new Promise<any[]>((resolve, reject) => {
    qbo.findVendors({ fetchAll: true }, (err: any, data: any) => {
      if (err) reject(err);
      else resolve(data?.QueryResponse?.Vendor || []);
    });
  });
  
  const rheaVendor = vendors.find((v: any) => v.DisplayName?.toLowerCase().includes('rhea'));
  
  const newBill = await new Promise<any>((resolve, reject) => {
    qbo.createBill({
      VendorRef: { value: rheaVendor.Id, name: rheaVendor.DisplayName },
      TxnDate: '2026-01-31',
      Line: [
        {
          Amount: 918.75,
          DetailType: 'AccountBasedExpenseLineDetail',
          Description: 'January 2026 Payroll - Rhea Doshi (Design: 36.75h @ $25/hr)',
          AccountBasedExpenseLineDetail: {
            AccountRef: { value: PAYROLL_ACCOUNT_ID, name: 'Payroll expenses:Wages' }
          }
        },
        {
          Amount: 195.00,
          DetailType: 'AccountBasedExpenseLineDetail',
          Description: 'January 2026 Payroll - Rhea Doshi (Production: 13h @ $15/hr)',
          AccountBasedExpenseLineDetail: {
            AccountRef: { value: PAYROLL_ACCOUNT_ID, name: 'Payroll expenses:Wages' }
          }
        }
      ]
    }, (err: any, bill: any) => {
      if (err) reject(err);
      else resolve(bill);
    });
  });
  
  console.log(`   ✅ Created Bill #${newBill.Id} for $${newBill.TotalAmt}`);
  
  // Update payroll record
  console.log('\n4. Updating payroll record...');
  
  await db.update(monthlyPayroll)
    .set({ 
      quickbooksBillId: newBill.Id,
      grossPay: String(correctAmount.toFixed(2)),
      updatedAt: new Date()
    })
    .where(and(
      eq(monthlyPayroll.userId, 'emp_rhea_doshi'),
      eq(monthlyPayroll.year, 2026),
      eq(monthlyPayroll.month, 1)
    ));
  
  console.log('   ✅ Payroll record updated');
  
  console.log('\n' + '='.repeat(50));
  console.log('CORRECTION COMPLETE');
  console.log('='.repeat(50));
  console.log(`Old Bill #5547: $1,243.75 (DELETED)`);
  console.log(`New Bill #${newBill.Id}: $${correctAmount.toFixed(2)}`);
  console.log(`Difference: -$130.00`);
  console.log('='.repeat(50));
  
  process.exit(0);
}

fixRheaBill().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
