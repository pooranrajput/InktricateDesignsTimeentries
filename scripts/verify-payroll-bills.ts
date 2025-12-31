import { db } from "../server/db";
import { quickbooksConfig } from "../shared/schema";
import QuickBooks from "node-quickbooks";

async function verifyPayrollBills() {
  try {
    console.log('🔍 Verifying specific payroll bills in QuickBooks...\n');
    
    // Get QuickBooks config
    const [config] = await db.select().from(quickbooksConfig).limit(1);
    
    if (!config) {
      console.log('❌ No QuickBooks configuration found');
      process.exit(1);
    }
    
    console.log('✅ QuickBooks Connected');
    console.log(`   Company ID: ${config.companyId}`);
    console.log(`   Mode: ${config.sandbox ? 'Sandbox' : 'Production'}\n`);
    
    // Create QuickBooks instance
    const qbo = new QuickBooks(
      process.env.QUICKBOOKS_CLIENT_ID!,
      process.env.QUICKBOOKS_CLIENT_SECRET!,
      config.accessToken,
      false,
      config.companyId,
      config.sandbox || false,
      false, // no debug
      null,
      '2.0',
      config.refreshToken
    );
    
    // Bill IDs from our database
    const billIdsToCheck = ['4315', '4316', '4317', '4318', '4611', '4612', '4613', '4614'];
    
    console.log('📋 Checking bill IDs from our database:', billIdsToCheck.join(', '));
    console.log('='.repeat(80));
    
    // Query for all bills and filter
    qbo.findBills({ fetchAll: true }, (err: any, bills: any) => {
      if (err) {
        console.error('❌ Error:', err);
        process.exit(1);
      }
      
      const allBills = bills?.QueryResponse?.Bill || [];
      console.log(`\nTotal bills in QuickBooks: ${allBills.length}\n`);
      
      // Find our specific bills
      console.log('🎯 PAYROLL BILLS FROM OUR DATABASE:\n');
      
      for (const billId of billIdsToCheck) {
        const bill = allBills.find((b: any) => b.Id === billId);
        if (bill) {
          console.log(`✅ Bill #${bill.Id} FOUND in QuickBooks`);
          console.log(`   Date: ${bill.TxnDate}`);
          console.log(`   Vendor: ${bill.VendorRef?.name}`);
          console.log(`   Amount: $${bill.TotalAmt}`);
          console.log(`   Description: ${bill.Line?.[0]?.Description || bill.PrivateNote || 'N/A'}`);
          console.log('');
        } else {
          console.log(`❌ Bill #${billId} NOT FOUND in QuickBooks\n`);
        }
      }
      
      // Find recent payroll-related bills (July-Dec 2025)
      console.log('='.repeat(80));
      console.log('\n📊 ALL 2025 PAYROLL/CONTRACTOR BILLS (Jul-Dec 2025):\n');
      
      const contractors = ['Rhea Doshi', 'Alysha Mahagaonkar', 'Anjali Patel', 'Yesha Patel', 'Bindiya Rajput'];
      
      const recentBills = allBills.filter((bill: any) => {
        const txnDate = new Date(bill.TxnDate);
        const isRecent = txnDate >= new Date('2025-07-01');
        const isContractor = contractors.some(name => 
          bill.VendorRef?.name?.toLowerCase().includes(name.split(' ')[0].toLowerCase())
        );
        return isRecent && isContractor;
      });
      
      // Sort by date
      recentBills.sort((a: any, b: any) => new Date(a.TxnDate).getTime() - new Date(b.TxnDate).getTime());
      
      console.log('Bill ID | Date       | Vendor                    | Amount');
      console.log('-'.repeat(70));
      
      for (const bill of recentBills) {
        console.log(`${String(bill.Id).padEnd(7)} | ${bill.TxnDate} | ${(bill.VendorRef?.name || '').padEnd(25)} | $${bill.TotalAmt}`);
      }
      
      console.log('\n' + '='.repeat(80));
      console.log(`\nTotal contractor bills found (Jul-Dec 2025): ${recentBills.length}`);
      
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verifyPayrollBills();
