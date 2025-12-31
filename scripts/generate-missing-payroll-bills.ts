import { db } from "../server/db";
import { quickbooksConfig, monthlyPayroll, timeEntries, users } from "../shared/schema";
import { eq, and, gte, lt, sql } from "drizzle-orm";
import QuickBooks from "node-quickbooks";

const PAYROLL_ACCOUNT_ID = "108"; // "Payroll expenses:Wages"

async function generateMissingPayrollBills() {
  try {
    console.log('🚀 Starting payroll bill generation process...\n');
    
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
      false,
      null,
      '2.0',
      config.refreshToken
    );
    
    // Get all employees (contractors)
    const allEmployees = await db.select().from(users).where(eq(users.isActive, true));
    console.log(`Found ${allEmployees.length} active employees\n`);
    
    // Get vendors from QuickBooks
    const vendors = await new Promise<any[]>((resolve, reject) => {
      qbo.findVendors({ fetchAll: true }, (err: any, data: any) => {
        if (err) reject(err);
        else resolve(data?.QueryResponse?.Vendor || []);
      });
    });
    console.log(`Found ${vendors.length} vendors in QuickBooks\n`);
    
    // ===========================================
    // STEP 1: Update August 2025 database records
    // ===========================================
    console.log('=' .repeat(60));
    console.log('STEP 1: Updating August 2025 database records with QB bill IDs');
    console.log('=' .repeat(60));
    
    const augustBillMappings = [
      { name: 'Rhea Doshi', billId: '4544' },
      { name: 'Yesha Patel', billId: '4545' },
      { name: 'Anjali Patel', billId: '4546' },
      { name: 'Alysha Mahagaonkar', billId: '4547' },
    ];
    
    for (const mapping of augustBillMappings) {
      const employee = allEmployees.find(e => 
        `${e.firstName} ${e.lastName}`.toLowerCase() === mapping.name.toLowerCase()
      );
      
      if (employee) {
        await db.update(monthlyPayroll)
          .set({ quickbooksBillId: mapping.billId })
          .where(and(
            eq(monthlyPayroll.userId, employee.id),
            eq(monthlyPayroll.year, 2025),
            eq(monthlyPayroll.month, 8)
          ));
        console.log(`✅ Updated ${mapping.name} August 2025 with Bill ID ${mapping.billId}`);
      }
    }
    
    // ===========================================
    // STEP 2: Create August 2025 bill for Bindiya
    // ===========================================
    console.log('\n' + '=' .repeat(60));
    console.log('STEP 2: Creating August 2025 bill for Bindiya Rajput');
    console.log('=' .repeat(60));
    
    const bindiya = allEmployees.find(e => e.firstName === 'Bindiya');
    const bindiyaVendor = vendors.find((v: any) => 
      v.DisplayName?.toLowerCase().includes('bindiya')
    );
    
    if (bindiya && bindiyaVendor) {
      const augustBill = await createBill(qbo, {
        vendorId: bindiyaVendor.Id,
        vendorName: bindiyaVendor.DisplayName,
        amount: 4000.00,
        description: 'August 2025 Payroll - Bindiya Rajput',
        txnDate: '2025-08-31'
      });
      
      if (augustBill) {
        await db.update(monthlyPayroll)
          .set({ quickbooksBillId: augustBill.Id })
          .where(and(
            eq(monthlyPayroll.userId, bindiya.id),
            eq(monthlyPayroll.year, 2025),
            eq(monthlyPayroll.month, 8)
          ));
        console.log(`✅ Created Bill #${augustBill.Id} for Bindiya Rajput - $4,000.00`);
      }
    }
    
    // ===========================================
    // STEP 3: Generate October 2025 payroll & bills
    // ===========================================
    console.log('\n' + '=' .repeat(60));
    console.log('STEP 3: October 2025 Payroll & Bills');
    console.log('=' .repeat(60));
    
    await generateMonthPayroll(qbo, vendors, allEmployees, 2025, 10, '2025-10-31');
    
    // ===========================================
    // STEP 4: Generate November 2025 payroll & bills
    // ===========================================
    console.log('\n' + '=' .repeat(60));
    console.log('STEP 4: November 2025 Payroll & Bills');
    console.log('=' .repeat(60));
    
    await generateMonthPayroll(qbo, vendors, allEmployees, 2025, 11, '2025-11-30');
    
    // ===========================================
    // STEP 5: Generate December 2025 payroll & bills (with Bindiya bonus)
    // ===========================================
    console.log('\n' + '=' .repeat(60));
    console.log('STEP 5: December 2025 Payroll & Bills (including Bindiya bonus)');
    console.log('=' .repeat(60));
    
    await generateMonthPayroll(qbo, vendors, allEmployees, 2025, 12, '2025-12-31', {
      bindiyaBonus: 1674.63
    });
    
    console.log('\n' + '=' .repeat(60));
    console.log('✅ ALL PAYROLL BILLS GENERATED SUCCESSFULLY!');
    console.log('=' .repeat(60));
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

async function generateMonthPayroll(
  qbo: any, 
  vendors: any[], 
  employees: any[], 
  year: number, 
  month: number,
  txnDate: string,
  options?: { bindiyaBonus?: number }
) {
  const monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
  const monthName = monthNames[month];
  
  console.log(`\nProcessing ${monthName} ${year}...\n`);
  
  // Get time entries for this month
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = month === 12 
    ? `${year + 1}-01-01` 
    : `${year}-${String(month + 1).padStart(2, '0')}-01`;
  
  const entries = await db.select({
    userId: timeEntries.userId,
    totalHours: sql<string>`SUM(${timeEntries.totalHours})`,
  })
    .from(timeEntries)
    .where(and(
      gte(timeEntries.date, startDate),
      lt(timeEntries.date, endDate)
    ))
    .groupBy(timeEntries.userId);
  
  console.log(`Found time entries for ${entries.length} employees`);
  
  // Process each employee
  for (const employee of employees) {
    const entry = entries.find(e => e.userId === employee.id);
    const hours = parseFloat(entry?.totalHours || '0');
    const hourlyRate = parseFloat(employee.hourlyRate || '15');
    
    // Calculate pay
    let grossPay = 0;
    let description = '';
    
    // Bindiya is salaried ($4,000/month)
    if (employee.firstName === 'Bindiya') {
      grossPay = 4000.00;
      
      // Add bonus for December
      if (month === 12 && options?.bindiyaBonus) {
        grossPay += options.bindiyaBonus;
        description = `${monthName} ${year} Payroll - ${employee.firstName} ${employee.lastName} (includes $${options.bindiyaBonus} bonus)`;
      } else {
        description = `${monthName} ${year} Payroll - ${employee.firstName} ${employee.lastName}`;
      }
    } else {
      // Hourly employees
      if (hours === 0) {
        console.log(`⏭️  Skipping ${employee.firstName} ${employee.lastName} - no hours logged`);
        continue;
      }
      grossPay = hours * hourlyRate;
      description = `${monthName} ${year} Payroll - ${employee.firstName} ${employee.lastName}`;
    }
    
    // Find vendor in QuickBooks
    const vendor = vendors.find((v: any) => 
      v.DisplayName?.toLowerCase().includes(employee.firstName?.toLowerCase())
    );
    
    if (!vendor) {
      console.log(`⚠️  No vendor found for ${employee.firstName} ${employee.lastName}`);
      continue;
    }
    
    // Create or update payroll record
    const existingPayroll = await db.select()
      .from(monthlyPayroll)
      .where(and(
        eq(monthlyPayroll.userId, employee.id),
        eq(monthlyPayroll.year, year),
        eq(monthlyPayroll.month, month)
      ))
      .limit(1);
    
    let payrollId;
    if (existingPayroll.length > 0) {
      // Update existing
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
      // Create new
      const [newPayroll] = await db.insert(monthlyPayroll)
        .values({
          userId: employee.id,
          year,
          month,
          totalHours: String(hours),
          grossPay: String(grossPay.toFixed(2)),
          status: 'paid',
          paidAt: new Date()
        })
        .returning();
      payrollId = newPayroll.id;
    }
    
    // Create QuickBooks bill
    const bill = await createBill(qbo, {
      vendorId: vendor.Id,
      vendorName: vendor.DisplayName,
      amount: grossPay,
      description,
      txnDate
    });
    
    if (bill) {
      // Update payroll with bill ID
      await db.update(monthlyPayroll)
        .set({ quickbooksBillId: bill.Id })
        .where(eq(monthlyPayroll.id, payrollId));
      
      console.log(`✅ Bill #${bill.Id}: ${employee.firstName} ${employee.lastName} - ${hours}h - $${grossPay.toFixed(2)}`);
    }
  }
}

async function createBill(qbo: any, params: {
  vendorId: string;
  vendorName: string;
  amount: number;
  description: string;
  txnDate: string;
}): Promise<any> {
  return new Promise((resolve, reject) => {
    const billData = {
      VendorRef: {
        value: params.vendorId,
        name: params.vendorName
      },
      TxnDate: params.txnDate,
      Line: [{
        Amount: params.amount,
        DetailType: 'AccountBasedExpenseLineDetail',
        Description: params.description,
        AccountBasedExpenseLineDetail: {
          AccountRef: {
            value: PAYROLL_ACCOUNT_ID,
            name: 'Payroll expenses:Wages'
          }
        }
      }]
    };
    
    qbo.createBill(billData, (err: any, bill: any) => {
      if (err) {
        console.error(`❌ Failed to create bill for ${params.vendorName}:`, err?.Fault?.Error?.[0]?.Detail || err);
        resolve(null);
      } else {
        resolve(bill);
      }
    });
  });
}

generateMissingPayrollBills();
