// Create all missing QuickBooks vendors and generate bills for everyone
import { quickbooksService } from './server/quickbooks';
import { db } from './server/db';

async function createAllVendorsAndBills() {
  console.log('🏢 CREATING ALL VENDORS AND BILLS FOR COMPLETE WORKFLOW');
  console.log('=====================================================');
  
  try {
    const qbo = await quickbooksService.initializeClient();
    console.log('✅ QuickBooks client initialized');
    
    // Get employees needing vendors (those with hourly rates but no vendor ID)
    const employeesNeedingVendors = await db.execute(`
      SELECT id, first_name, last_name, email
      FROM users 
      WHERE is_active = true 
        AND hourly_rate IS NOT NULL 
        AND quickbooks_vendor_id IS NULL
    `);
    
    const employeesToCreate = employeesNeedingVendors.rows || employeesNeedingVendors;
    console.log(`👥 Creating vendors for ${employeesToCreate.length} employees`);
    
    // Create vendors for each employee
    for (const employee of employeesToCreate) {
      console.log(`\n🏢 Creating vendor: ${employee.first_name} ${employee.last_name}`);
      
      const vendorData = {
        Name: `${employee.first_name} ${employee.last_name}`,
        Active: true,
        PrimaryEmailAddr: {
          Address: employee.email
        }
      };
      
      try {
        const vendor = await new Promise((resolve, reject) => {
          qbo.createVendor(vendorData, (err: any, createdVendor: any) => {
            if (err) {
              console.log(`   ❌ Vendor creation failed:`, err?.message || err);
              reject(err);
            } else {
              console.log(`   ✅ Vendor created successfully: ID ${createdVendor.Id}`);
              resolve(createdVendor);
            }
          });
        });
        
        if (vendor && (vendor as any).Id) {
          // Update user with vendor ID
          await db.execute(`
            UPDATE users 
            SET quickbooks_vendor_id = '${(vendor as any).Id}', updated_at = NOW()
            WHERE id = '${employee.id}'
          `);
          console.log(`   💾 Updated ${employee.first_name} with vendor ID: ${(vendor as any).Id}`);
          
          // Rate limiting delay
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
      } catch (error: any) {
        console.log(`   ❌ Failed to create vendor: ${error?.message || error}`);
      }
    }
    
    console.log(`\n💰 NOW CREATING BILLS FOR ALL PAYROLL RECORDS...`);
    
    // Get all payroll records that need bills (now including newly created vendors)
    const payrollRecords = await db.execute(`
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
      ORDER BY u.first_name, mp.month
    `);
    
    const recordsToProcess = payrollRecords.rows || payrollRecords;
    console.log(`💰 Found ${recordsToProcess.length} payroll records ready for bill creation`);
    
    if (recordsToProcess.length === 0) {
      console.log('✅ All payroll records already have bills or are missing vendor IDs!');
      return;
    }
    
    const PROFESSIONAL_SERVICES_ACCOUNT_ID = '81';
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                   'July', 'August', 'September', 'October', 'November', 'December'];
    
    let billsCreated = 0;
    let billsSkipped = 0;
    
    for (const record of recordsToProcess) {
      const monthName = months[record.month - 1];
      console.log(`\n👤 Creating bill: ${record.first_name} ${record.last_name} - ${monthName} 2025`);
      console.log(`   💰 Amount: $${record.gross_pay} (${record.total_hours} hours)`);
      
      const description = `${monthName} ${record.year} - ${record.first_name} ${record.last_name} Payroll`;
      
      const bill = {
        VendorRef: { value: record.quickbooks_vendor_id },
        TotalAmt: parseFloat(record.gross_pay.toString()),
        Line: [{
          Amount: parseFloat(record.gross_pay.toString()),
          Description: description,
          DetailType: "AccountBasedExpenseLineDetail",
          AccountBasedExpenseLineDetail: {
            AccountRef: { value: PROFESSIONAL_SERVICES_ACCOUNT_ID }
          }
        }]
      };
      
      try {
        const result = await new Promise((resolve, reject) => {
          qbo.createBill(bill, (err: any, createdBill: any) => {
            if (err) {
              console.log(`   ❌ Bill creation failed:`, err?.message || err);
              reject(err);
            } else {
              console.log(`   ✅ Bill created: ID ${createdBill.Id}`);
              resolve(createdBill);
            }
          });
        });
        
        if (result && (result as any).Id) {
          // Update payroll record with bill ID
          await db.execute(`
            UPDATE monthly_payroll 
            SET quickbooks_bill_id = '${(result as any).Id}', updated_at = NOW()
            WHERE id = ${record.payroll_id}
          `);
          console.log(`   💾 Database updated with bill ID: ${(result as any).Id}`);
          billsCreated++;
          
          // Rate limiting delay
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
      } catch (error: any) {
        console.log(`   ❌ Failed to create bill: ${error?.message || error}`);
        billsSkipped++;
      }
    }
    
    // Final summary
    console.log(`\n🎉 COMPREHENSIVE BILL CREATION COMPLETE!`);
    console.log(`✅ New bills created: ${billsCreated}`);
    console.log(`⏭️  Bills skipped: ${billsSkipped}`);
    
    // Get final status
    const finalStatus = await db.execute(`
      SELECT 
        u.first_name,
        u.last_name,
        COUNT(*) as total_payroll_records,
        COUNT(mp.quickbooks_bill_id) as bills_created,
        ROUND(SUM(CAST(mp.gross_pay AS DECIMAL)), 2) as total_amount
      FROM users u
      JOIN monthly_payroll mp ON u.id = mp.user_id
      WHERE u.hourly_rate IS NOT NULL AND mp.year = 2025
      GROUP BY u.first_name, u.last_name
      ORDER BY u.first_name
    `);
    
    const statusRecords = finalStatus.rows || finalStatus;
    console.log(`\n📊 FINAL STATUS BY EMPLOYEE:`);
    
    let grandTotalBills = 0;
    let grandTotalAmount = 0;
    
    statusRecords.forEach((emp: any) => {
      const status = emp.bills_created === emp.total_payroll_records ? '✅' : '⚠️';
      console.log(`${status} ${emp.first_name} ${emp.last_name}: ${emp.bills_created}/${emp.total_payroll_records} bills = $${emp.total_amount}`);
      grandTotalBills += parseInt(emp.bills_created);
      grandTotalAmount += parseFloat(emp.total_amount);
    });
    
    console.log(`\n🎯 GRAND TOTAL: ${grandTotalBills} QuickBooks bills worth $${grandTotalAmount.toFixed(2)}`);
    console.log(`\n✅ END-TO-END WORKFLOW COMPLETE FOR ALL EMPLOYEES!`);
    
    return {
      vendorsCreated: employeesToCreate.length,
      billsCreated,
      billsSkipped,
      totalBills: grandTotalBills,
      totalAmount: grandTotalAmount
    };
    
  } catch (error) {
    console.error('❌ Error in comprehensive workflow:', error);
    throw error;
  }
}

createAllVendorsAndBills();