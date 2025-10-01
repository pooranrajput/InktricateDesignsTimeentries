import { db } from '../server/db';
import { monthlyPayroll, quickbooksConfig, users } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import 'dotenv/config';

async function createSeptemberBills() {
  const QuickBooks = (await import('node-quickbooks')).default;
  const OAuthClient = (await import('intuit-oauth')).default;
  
  try {
    console.log('💰 Creating September 2025 QuickBooks Bills...\n');

    // Get QuickBooks config
    let [qbConfig] = await db.select().from(quickbooksConfig).limit(1);
    if (!qbConfig) {
      console.error('❌ QuickBooks not connected');
      process.exit(1);
    }

    console.log(`✅ QuickBooks connected: Company ${qbConfig.companyId}`);

    // Check if token is expired and refresh if needed
    const tokenExpiry = new Date(qbConfig.tokenExpiry);
    const now = new Date();
    
    if (tokenExpiry < now) {
      console.log('⏰ Token expired, refreshing...');
      
      const oauthClient = new OAuthClient({
        clientId: process.env.QUICKBOOKS_CLIENT_ID,
        clientSecret: process.env.QUICKBOOKS_CLIENT_SECRET,
        environment: qbConfig.sandbox ? 'sandbox' : 'production',
        redirectUri: 'https://inkticate-time-tracker-pooranrajput.replit.app/api/quickbooks/callback',
      });

      oauthClient.setToken({
        access_token: qbConfig.accessToken,
        refresh_token: qbConfig.refreshToken,
        expires_in: Math.floor((tokenExpiry.getTime() - Date.now()) / 1000),
      });

      const authResponse = await oauthClient.refresh();
      const newToken = authResponse.getToken();

      // Update database with new tokens
      await db
        .update(quickbooksConfig)
        .set({
          accessToken: newToken.access_token,
          refreshToken: newToken.refresh_token,
          tokenExpiry: new Date(Date.now() + (newToken.expires_in * 1000)),
        })
        .where(eq(quickbooksConfig.id, qbConfig.id));

      // Get updated config
      [qbConfig] = await db.select().from(quickbooksConfig).limit(1);
      console.log('✅ Token refreshed successfully');
    } else {
      console.log('✅ Token still valid');
    }

    // Initialize QuickBooks client
    const qbo = new QuickBooks(
      process.env.QUICKBOOKS_CLIENT_ID,
      process.env.QUICKBOOKS_CLIENT_SECRET,
      qbConfig.accessToken,
      false,
      qbConfig.companyId,
      !qbConfig.sandbox,
      true,
      null,
      '2.0',
      qbConfig.refreshToken
    );

    // Get paid payroll records for September 2025
    const payrollRecords = await db
      .select()
      .from(monthlyPayroll)
      .where(and(
        eq(monthlyPayroll.year, 2025),
        eq(monthlyPayroll.month, 9),
        eq(monthlyPayroll.status, 'paid')
      ));

    console.log(`\n📋 Found ${payrollRecords.length} paid payroll records\n`);

    const results = [];
    for (const record of payrollRecords) {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, record.userId))
        .limit(1);

      if (!user || !user.quickbooksVendorId) {
        console.log(`⚠️  Skipping ${user?.firstName} ${user?.lastName} - no QB vendor ID`);
        continue;
      }

      console.log(`\n💰 Creating bill for ${user.firstName} ${user.lastName}`);
      console.log(`   Amount: $${record.grossPay}`);
      console.log(`   Vendor ID: ${user.quickbooksVendorId}`);

      // Create bill in QuickBooks
      const bill = {
        VendorRef: { value: user.quickbooksVendorId },
        TxnDate: '2025-09-01',
        DueDate: '2025-09-15',
        Line: [{
          DetailType: 'AccountBasedExpenseLineDetail',
          Amount: parseFloat(record.grossPay),
          AccountBasedExpenseLineDetail: {
            AccountRef: { value: '108' } // Payroll expenses:Wages
          },
          Description: `September 2025 Payroll - ${user.firstName} ${user.lastName}`
        }]
      };

      const createdBill = await new Promise((resolve, reject) => {
        qbo.createBill(bill, (err: any, bill: any) => {
          if (err) reject(err);
          else resolve(bill);
        });
      });

      const billId = (createdBill as any).Id;
      console.log(`   ✅ Bill created: ${billId}`);

      // Update payroll record with QB bill ID
      await db
        .update(monthlyPayroll)
        .set({ quickbooksBillId: billId })
        .where(eq(monthlyPayroll.id, record.id));

      results.push({
        employee: `${user.firstName} ${user.lastName}`,
        amount: record.grossPay,
        billId,
        success: true
      });
    }

    console.log(`\n\n✅ Successfully created ${results.length} bills in QuickBooks!\n`);
    console.log('Summary:');
    results.forEach(r => {
      console.log(`   • ${r.employee}: $${r.amount} (Bill #${r.billId})`);
    });

  } catch (error: any) {
    console.error('❌ Error creating bills:', error.message);
    console.error(error);
    process.exit(1);
  }
}

createSeptemberBills();
