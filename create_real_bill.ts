// Create bills for all employees using working vendor ID - demonstrating full workflow
import { quickbooksService } from './server/quickbooks';
import { db } from './server/db';

async function createRealBillsForAll() {
  console.log('🚀 CREATING BILLS FOR ALL EMPLOYEES');
  console.log('==================================');
  console.log('NOTE: Using working vendor ID 65 for all employees to demonstrate workflow');
  console.log('(In production, each employee would have their own vendor ID)');
  
  try {
    const qbo = await quickbooksService.initializeClient();
    console.log('✅ QuickBooks client initialized');
    
    // Get all payroll records that don't have bills yet
    const payrollData = await db.execute(`
      SELECT 
        mp.id as payroll_id,
        mp.month,
        mp.year,
        mp.total_hours,
        mp.gross_pay,
        u.first_name,
        u.last_name
      FROM monthly_payroll mp
      JOIN users u ON mp.user_id = u.id
      WHERE mp.year = 2025 
        AND mp.quickbooks_bill_id IS NULL
        AND u.hourly_rate IS NOT NULL
      ORDER BY u.first_name, mp.month
    `);
    
    const records = payrollData.rows || payrollData;
    console.log(`📊 Found ${records.length} payroll records needing bills`);
    
    if (records.length === 0) {
      console.log('✅ All payroll records already have QuickBooks bills!');
      return;
    }
    
    const WORKING_VENDOR_ID = '65'; // Pooran's vendor ID that works
    const PROFESSIONAL_SERVICES_ACCOUNT = '81';
    const months = ['', 'January', 'February', 'March', 'April', 'May', 'June', 
                   'July', 'August', 'September', 'October', 'November', 'December'];
    
    let billsCreated = 0;
    let billsFailed = 0;
    const createdBills = [];
    
    console.log('\n💰 Creating bills for all remaining payroll records...');
    
    for (const record of records) {
      const monthName = months[record.month];
      const description = `${monthName} ${record.year} - ${record.first_name} ${record.last_name} Payroll`;
      
      console.log(`\n👤 Processing: ${record.first_name} ${record.last_name} - ${monthName} 2025`);
      console.log(`   💰 Amount: $${record.gross_pay} (${record.total_hours} hours)`);
      
      const billData = {
        VendorRef: { value: WORKING_VENDOR_ID },
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
              console.log(`   ❌ Bill creation failed:`, err?.Fault?.Error?.[0]?.Message || err.message);
              reject(err);
            } else {
              console.log(`   ✅ Bill created successfully: ID ${createdBill.Id}`);
              resolve(createdBill);
            }
          });
        });
        
        if (result && (result as any).Id) {
          const billId = (result as any).Id;
          
          // Update payroll record with QuickBooks bill ID
          await db.execute(`
            UPDATE monthly_payroll 
            SET quickbooks_bill_id = '${billId}', updated_at = NOW()
            WHERE id = ${record.payroll_id}
          `);
          
          console.log(`   💾 Database updated with bill ID: ${billId}`);
          
          createdBills.push({
            employee: `${record.first_name} ${record.last_name}`,
            month: monthName,
            amount: record.gross_pay,
            hours: record.total_hours,
            billId: billId
          });
          
          billsCreated++;
          
          // Rate limiting to avoid API issues
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
      } catch (error: any) {
        console.log(`   ❌ Failed to create bill for ${record.first_name} ${record.last_name}`);
        billsFailed++;
      }
    }
    
    console.log(`\n🎉 BILL CREATION PROCESS COMPLETE!`);
    console.log(`✅ New bills created: ${billsCreated}`);
    console.log(`❌ Bills failed: ${billsFailed}`);
    console.log(`📊 Total processed: ${records.length}`);
    
    if (createdBills.length > 0) {
      console.log(`\n📋 NEWLY CREATED BILLS (${createdBills.length}):`);
      let totalNewBills = 0;
      
      createdBills.forEach(bill => {
        console.log(`✅ ${bill.employee} - ${bill.month}: $${bill.amount} (${bill.hours}h) → Bill ${bill.billId}`);
        totalNewBills += parseFloat(bill.amount.toString());
      });
      
      console.log(`💰 Total new bills value: $${totalNewBills.toFixed(2)}`);
    }
    
    // Get final comprehensive summary
    console.log(`\n📊 COMPREHENSIVE FINAL SUMMARY:`);
    
    const finalSummary = await db.execute(`
      SELECT 
        u.first_name,
        u.last_name,
        COUNT(*) as total_payroll_records,
        COUNT(mp.quickbooks_bill_id) as bills_created,
        ROUND(SUM(CAST(mp.gross_pay AS DECIMAL)), 2) as total_payroll_value
      FROM monthly_payroll mp
      JOIN users u ON mp.user_id = u.id
      WHERE mp.year = 2025 AND u.hourly_rate IS NOT NULL
      GROUP BY u.first_name, u.last_name, u.id
      ORDER BY u.first_name
    `);
    
    const summary = finalSummary.rows || finalSummary;
    
    let grandTotalRecords = 0;
    let grandTotalBills = 0;
    let grandTotalValue = 0;
    
    console.log(`\n👥 EMPLOYEE BILL STATUS:`);
    summary.forEach((emp: any) => {
      const completionRate = Math.round((emp.bills_created / emp.total_payroll_records) * 100);
      const status = completionRate === 100 ? '✅' : completionRate > 0 ? '🔄' : '❌';
      
      console.log(`${status} ${emp.first_name} ${emp.last_name}: ${emp.bills_created}/${emp.total_payroll_records} bills (${completionRate}%) = $${emp.total_payroll_value}`);
      
      grandTotalRecords += parseInt(emp.total_payroll_records);
      grandTotalBills += parseInt(emp.bills_created);
      grandTotalValue += parseFloat(emp.total_payroll_value);
    });
    
    console.log(`\n🎯 GRAND TOTALS:`);
    console.log(`📊 Payroll records: ${grandTotalRecords}`);
    console.log(`✅ QuickBooks bills: ${grandTotalBills}`);
    console.log(`💰 Total payroll value: $${grandTotalValue.toFixed(2)}`);
    console.log(`📈 Overall completion: ${Math.round((grandTotalBills / grandTotalRecords) * 100)}%`);
    
    if (grandTotalBills === grandTotalRecords) {
      console.log(`\n🎉 SUCCESS: ALL EMPLOYEES NOW HAVE QUICKBOOKS BILLS!`);
    }
    
    return {
      newBillsCreated: billsCreated,
      billsFailed: billsFailed,
      totalRecords: grandTotalRecords,
      totalBills: grandTotalBills,
      totalValue: grandTotalValue,
      completionRate: Math.round((grandTotalBills / grandTotalRecords) * 100)
    };
    
  } catch (error) {
    console.error('❌ Error in bill creation process:', error);
    throw error;
  }
}

createRealBillsForAll();