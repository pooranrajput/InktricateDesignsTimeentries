import { db } from "../server/db";
import { quickbooksConfig } from "../shared/schema";
import QuickBooks from "node-quickbooks";

async function checkQuickBooksBills() {
  try {
    console.log('🔍 Checking QuickBooks for existing bills...\n');
    
    // Get QuickBooks config
    const [config] = await db.select().from(quickbooksConfig).limit(1);
    
    if (!config) {
      console.log('❌ No QuickBooks configuration found');
      process.exit(1);
    }
    
    console.log('✅ QuickBooks Connected');
    console.log(`   Company ID: ${config.companyId}`);
    console.log(`   Mode: ${config.sandbox ? 'Sandbox' : 'Production'}`);
    console.log(`   Token Expiry: ${config.tokenExpiry}\n`);
    
    // Create QuickBooks instance
    const qbo = new QuickBooks(
      process.env.QUICKBOOKS_CLIENT_ID!,
      process.env.QUICKBOOKS_CLIENT_SECRET!,
      config.accessToken,
      false, // no token secret for OAuth2
      config.companyId,
      config.sandbox || false, // sandbox mode
      true, // debug
      null, // minor version
      '2.0', // OAuth version
      config.refreshToken
    );
    
    // Query for all bills (vendor bills)
    console.log('📋 Querying QuickBooks for recent bills...\n');
    
    qbo.findBills(
      { 
        fetchAll: true
      },
      (err: any, bills: any) => {
        if (err) {
          console.error('❌ Error querying bills:', err);
          process.exit(1);
        }
        
        const billList = bills?.QueryResponse?.Bill || [];
        console.log(`Found ${billList.length} bills in QuickBooks:\n`);
        
        // Sort by date descending
        billList.sort((a: any, b: any) => new Date(b.TxnDate).getTime() - new Date(a.TxnDate).getTime());
        
        // Show recent bills
        console.log('='.repeat(80));
        console.log('Bill ID | Date       | Vendor                    | Amount    | Memo');
        console.log('='.repeat(80));
        
        for (const bill of billList.slice(0, 30)) {
          const vendorName = bill.VendorRef?.name || 'Unknown';
          const amount = parseFloat(bill.TotalAmt || 0).toFixed(2);
          const memo = bill.PrivateNote || bill.Line?.[0]?.Description || '';
          const truncatedMemo = memo.length > 30 ? memo.substring(0, 30) + '...' : memo;
          
          console.log(
            `${String(bill.Id).padEnd(7)} | ${bill.TxnDate} | ${vendorName.padEnd(25)} | $${amount.padStart(8)} | ${truncatedMemo}`
          );
        }
        
        console.log('='.repeat(80));
        
        // Look for payroll-related bills
        console.log('\n📊 Payroll Bills (containing "Payroll" in description):\n');
        
        const payrollBills = billList.filter((bill: any) => {
          const memo = bill.PrivateNote || '';
          const lineDesc = bill.Line?.[0]?.Description || '';
          return memo.toLowerCase().includes('payroll') || lineDesc.toLowerCase().includes('payroll');
        });
        
        if (payrollBills.length === 0) {
          console.log('No bills found with "Payroll" in description');
        } else {
          for (const bill of payrollBills) {
            console.log(`Bill #${bill.Id}: ${bill.TxnDate} - ${bill.VendorRef?.name} - $${bill.TotalAmt}`);
            console.log(`   Memo: ${bill.PrivateNote || 'N/A'}`);
          }
        }
        
        process.exit(0);
      }
    );
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkQuickBooksBills();
