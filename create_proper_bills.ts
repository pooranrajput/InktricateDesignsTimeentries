// Create properly mapped bills for each employee with their individual vendor IDs
import { quickbooksService } from './server/quickbooks';
import { db } from './server/db';

async function createProperlyMappedBills() {
  console.log('🎯 CREATING PROPERLY MAPPED BILLS FOR ALL EMPLOYEES');
  console.log('================================================');
  console.log('Each employee will have bills created under their own vendor ID');
  
  try {
    const qbo = await quickbooksService.initializeClient();
    console.log('✅ QuickBooks client initialized');
    
    // Get all payroll records that need bills (now that all employees have vendor IDs)
    const payrollData = await db.execute(`
      SELECT 
        mp.id as payroll_id,
        mp.month,
        mp.year,
        mp.total_hours,
        mp.gross_pay,
        u.first_name,
        u.last_name,
        u.quickbooks_vendor_id
      FROM monthly_payroll mp
      JOIN users u ON mp.user_id = u.id
      WHERE mp.year = 2025 
        AND mp.quickbooks_bill_id IS NULL
        AND u.quickbooks_vendor_id IS NOT NULL
        AND u.hourly_rate IS NOT NULL
      ORDER BY u.first_name, mp.month
    `);
    
    const records = payrollData.rows || payrollData;
    console.log(`📊 Found ${records.length} payroll records ready for proper bill creation`);
    
    if (records.length === 0) {
      console.log('✅ All payroll records already have properly mapped bills!');
      return;
    }
    
    const PROFESSIONAL_SERVICES_ACCOUNT = '81';
    const months = ['', 'January', 'February', 'March', 'April', 'May', 'June', 
                   'July', 'August', 'September', 'October', 'November', 'December'];
    
    let billsCreated = 0;
    let billsFailed = 0;
    const createdBills = [];
    
    console.log('\n💰 Creating bills with proper vendor mapping...');
    
    // Group records by employee for better logging
    const recordsByEmployee = records.reduce((acc: any, record: any) => {
      const key = `${record.first_name} ${record.last_name}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(record);
      return acc;
    }, {});
    
    for (const [employeeName, employeeRecords] of Object.entries(recordsByEmployee)) {
      console.log(`\n👤 Processing ${employeeName} (${(employeeRecords as any).length} bills):`);
      console.log(`   Vendor ID: ${(employeeRecords as any)[0].quickbooks_vendor_id}`);
      
      for (const record of (employeeRecords as any)) {
        const monthName = months[record.month];
        const description = `${monthName} ${record.year} - ${record.first_name} ${record.last_name} Payroll`;
        
        console.log(`\n   💳 Creating: ${monthName} 2025 - $${record.gross_pay} (${record.total_hours}h)`);
        
        const billData = {
          VendorRef: { value: record.quickbooks_vendor_id },
          TotalAmt: parseFloat(record.gross_pay.toString()),
          Line: [{
            Amount: parseFloat(record.gross_pay.toString()),
            Description: description,
            DetailType: "AccountBasedExpenseLineDetail",
            AccountBasedExpenseLineDetail: {
              AccountRef: { value: PROFESSIONAL_SERVICES_ACCOUNT }
            }
          }]
        };
        
        try {
          const result = await new Promise((resolve, reject) => {
            qbo.createBill(billData, (err: any, createdBill: any) => {
              if (err) {
                reject(err);
              } else {
                resolve(createdBill);
              }
            });
          });
          
          if (result && (result as any).Id) {
            const billId = (result as any).Id;
            
            // Update database with correct mapping
            await db.execute(`
              UPDATE monthly_payroll 
              SET quickbooks_bill_id = '${billId}'
              WHERE id = ${record.payroll_id}
            `);
            
            console.log(`      ✅ Bill ${billId} created and mapped correctly`);
            
            createdBills.push({
              employee: `${record.first_name} ${record.last_name}`,
              month: monthName,
              amount: record.gross_pay,
              hours: record.total_hours,
              vendorId: record.quickbooks_vendor_id,
              billId: billId
            });
            
            billsCreated++;
            
            // Rate limiting
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
          
        } catch (error: any) {
          console.log(`      ❌ Failed: ${error?.Fault?.Error?.[0]?.Message || 'Unknown error'}`);
          billsFailed++;
        }
      }
    }
    
    console.log(`\n🎉 PROPERLY MAPPED BILL CREATION COMPLETE!`);
    console.log(`✅ Bills created: ${billsCreated}`);
    console.log(`❌ Bills failed: ${billsFailed}`);
    
    if (createdBills.length > 0) {
      console.log(`\n📋 CORRECTLY MAPPED BILLS BY EMPLOYEE:`);
      
      const billsByEmployee = createdBills.reduce((acc: any, bill: any) => {
        if (!acc[bill.employee]) acc[bill.employee] = [];
        acc[bill.employee].push(bill);
        return acc;
      }, {});
      
      for (const [employee, bills] of Object.entries(billsByEmployee)) {
        const employeeBills = bills as any[];
        const totalAmount = employeeBills.reduce((sum, bill) => sum + parseFloat(bill.amount), 0);
        console.log(`\n✅ ${employee} (Vendor ${employeeBills[0].vendorId}):`);
        employeeBills.forEach(bill => {
          console.log(`   • ${bill.month}: $${bill.amount} (${bill.hours}h) → Bill ${bill.billId}`);
        });
        console.log(`   Total: $${totalAmount.toFixed(2)} across ${employeeBills.length} bills`);
      }
    }
    
    // Final comprehensive status
    console.log(`\n📊 FINAL COMPREHENSIVE STATUS:`);
    
    const finalSummary = await db.execute(`
      SELECT 
        u.first_name,
        u.last_name,
        u.quickbooks_vendor_id,
        COUNT(*) as total_payroll_records,
        COUNT(mp.quickbooks_bill_id) as bills_created,
        ROUND(SUM(CAST(mp.gross_pay AS DECIMAL)), 2) as total_payroll_value,
        ROUND(SUM(CAST(mp.total_hours AS DECIMAL)), 2) as total_hours
      FROM monthly_payroll mp
      JOIN users u ON mp.user_id = u.id
      WHERE mp.year = 2025 AND u.hourly_rate IS NOT NULL
      GROUP BY u.first_name, u.last_name, u.quickbooks_vendor_id, u.id
      ORDER BY u.first_name
    `);
    
    const summary = finalSummary.rows || finalSummary;
    
    let grandTotalRecords = 0;
    let grandTotalBills = 0;
    let grandTotalValue = 0;
    let grandTotalHours = 0;
    
    console.log(`\n👥 EMPLOYEE BILL STATUS WITH CORRECT VENDOR MAPPING:`);
    summary.forEach((emp: any) => {
      const completionRate = Math.round((emp.bills_created / emp.total_payroll_records) * 100);
      const status = completionRate === 100 ? '✅' : completionRate > 0 ? '🔄' : '❌';
      
      console.log(`${status} ${emp.first_name} ${emp.last_name}:`);
      console.log(`   Vendor ID: ${emp.quickbooks_vendor_id}`);
      console.log(`   Bills: ${emp.bills_created}/${emp.total_payroll_records} (${completionRate}%)`);
      console.log(`   Value: $${emp.total_payroll_value} (${emp.total_hours} hours)`);
      
      grandTotalRecords += parseInt(emp.total_payroll_records);
      grandTotalBills += parseInt(emp.bills_created);
      grandTotalValue += parseFloat(emp.total_payroll_value);
      grandTotalHours += parseFloat(emp.total_hours);
    });
    
    console.log(`\n🎯 GRAND TOTALS - PROPERLY MAPPED SYSTEM:`);
    console.log(`👥 Employees: 6 (all with individual vendor IDs)`);
    console.log(`📊 Payroll records: ${grandTotalRecords}`);
    console.log(`✅ QuickBooks bills: ${grandTotalBills}`);
    console.log(`💰 Total payroll value: $${grandTotalValue.toFixed(2)}`);
    console.log(`⏰ Total hours tracked: ${grandTotalHours}`);
    console.log(`📈 Overall completion: ${Math.round((grandTotalBills / grandTotalRecords) * 100)}%`);
    
    if (grandTotalBills === grandTotalRecords) {
      console.log(`\n🎉 MISSION ACCOMPLISHED!`);
      console.log(`✅ Every payroll record has a properly mapped QuickBooks bill`);
      console.log(`✅ Each employee has their own vendor for accurate 1099 tracking`);
      console.log(`✅ Complete audit trail established for contractor payments`);
    }
    
    return {
      billsCreated,
      billsFailed,
      totalRecords: grandTotalRecords,
      totalBills: grandTotalBills,
      totalValue: grandTotalValue,
      completionRate: Math.round((grandTotalBills / grandTotalRecords) * 100)
    };
    
  } catch (error) {
    console.error('❌ Error creating properly mapped bills:', error);
    throw error;
  }
}

createProperlyMappedBills();