import { db } from "../server/db";
import { quickbooksConfig, monthlyPayroll, timeEntries, users } from "../shared/schema";
import { eq, and, gte, lt, sql } from "drizzle-orm";
import QuickBooks from "node-quickbooks";

const PAYROLL_ACCOUNT_ID = "108";

async function generateJanuary2026Payroll() {
  try {
    console.log('🚀 Generating January 2026 Payroll & QuickBooks Bills...\n');
    
    const [config] = await db.select().from(quickbooksConfig).limit(1);
    if (!config) {
      console.log('❌ No QuickBooks configuration found');
      process.exit(1);
    }
    
    console.log('✅ QuickBooks Connected - Company ID:', config.companyId);
    
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
    
    const vendors = await new Promise<any[]>((resolve, reject) => {
      qbo.findVendors({ fetchAll: true }, (err: any, data: any) => {
        if (err) reject(err);
        else resolve(data?.QueryResponse?.Vendor || []);
      });
    });
    
    const employees = await db.select().from(users).where(eq(users.isActive, true));
    
    const entries = await db.select({
      userId: timeEntries.userId,
      totalHours: sql<string>`SUM(${timeEntries.totalHours})`,
    })
      .from(timeEntries)
      .where(and(
        gte(timeEntries.date, '2026-01-01'),
        lt(timeEntries.date, '2026-02-01')
      ))
      .groupBy(timeEntries.userId);
    
    console.log('\n' + '='.repeat(60));
    console.log('JANUARY 2026 PAYROLL');
    console.log('='.repeat(60) + '\n');
    
    const results: any[] = [];
    
    for (const employee of employees) {
      const entry = entries.find(e => e.userId === employee.id);
      const hours = parseFloat(entry?.totalHours || '0');
      const hourlyRate = parseFloat(employee.hourlyRate || '15');
      
      let grossPay = 0;
      let description = '';
      
      if (employee.firstName === 'Bindiya') {
        grossPay = 4000.00;
        description = `January 2026 Payroll - ${employee.firstName} ${employee.lastName}`;
      } else {
        if (hours === 0) {
          console.log(`⏭️  Skipping ${employee.firstName} ${employee.lastName} - no hours`);
          continue;
        }
        grossPay = hours * hourlyRate;
        description = `January 2026 Payroll - ${employee.firstName} ${employee.lastName}`;
      }
      
      const vendor = vendors.find((v: any) => 
        v.DisplayName?.toLowerCase().includes(employee.firstName?.toLowerCase())
      );
      
      if (!vendor) {
        console.log(`⚠️  No vendor found for ${employee.firstName} ${employee.lastName}`);
        continue;
      }
      
      // Create/update payroll record
      const existingPayroll = await db.select()
        .from(monthlyPayroll)
        .where(and(
          eq(monthlyPayroll.userId, employee.id),
          eq(monthlyPayroll.year, 2026),
          eq(monthlyPayroll.month, 1)
        ))
        .limit(1);
      
      let payrollId;
      if (existingPayroll.length > 0) {
        await db.update(monthlyPayroll)
          .set({ 
            totalHours: String(hours),
            grossPay: String(grossPay.toFixed(2)),
            status: 'paid',
            paidAt: new Date(),
            updatedAt: new Date()
          })
          .where(eq(monthlyPayroll.id, existingPayroll[0].id));
        payrollId = existingPayroll[0].id;
      } else {
        const [newPayroll] = await db.insert(monthlyPayroll)
          .values({
            userId: employee.id,
            year: 2026,
            month: 1,
            totalHours: String(hours),
            grossPay: String(grossPay.toFixed(2)),
            status: 'paid',
            paidAt: new Date()
          })
          .returning();
        payrollId = newPayroll.id;
      }
      
      // Create QuickBooks bill
      const bill = await new Promise<any>((resolve) => {
        qbo.createBill({
          VendorRef: { value: vendor.Id, name: vendor.DisplayName },
          TxnDate: '2026-01-31',
          Line: [{
            Amount: grossPay,
            DetailType: 'AccountBasedExpenseLineDetail',
            Description: description,
            AccountBasedExpenseLineDetail: {
              AccountRef: { value: PAYROLL_ACCOUNT_ID, name: 'Payroll expenses:Wages' }
            }
          }]
        }, (err: any, bill: any) => {
          if (err) {
            console.error(`❌ Bill error for ${employee.firstName}:`, err?.Fault?.Error?.[0]?.Detail || err);
            resolve(null);
          } else {
            resolve(bill);
          }
        });
      });
      
      if (bill) {
        await db.update(monthlyPayroll)
          .set({ quickbooksBillId: bill.Id })
          .where(eq(monthlyPayroll.id, payrollId));
        
        results.push({
          name: `${employee.firstName} ${employee.lastName}`,
          hours,
          rate: hourlyRate,
          amount: grossPay,
          billId: bill.Id
        });
        
        console.log(`✅ Bill #${bill.Id}: ${employee.firstName} ${employee.lastName} - ${hours}h @ $${hourlyRate}/hr = $${grossPay.toFixed(2)}`);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('SUMMARY');
    console.log('='.repeat(60));
    
    let total = 0;
    for (const r of results) {
      console.log(`Bill #${r.billId}: ${r.name.padEnd(25)} $${r.amount.toFixed(2)}`);
      total += r.amount;
    }
    console.log('-'.repeat(60));
    console.log(`TOTAL: $${total.toFixed(2)}`);
    console.log('='.repeat(60));
    
    console.log('\n✅ All January 2026 payroll bills created in QuickBooks!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

generateJanuary2026Payroll();
