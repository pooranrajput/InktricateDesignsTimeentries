// Force bill creation by manually creating vendors with minimal data
import { quickbooksService } from './server/quickbooks';
import { db } from './server/db';

async function forceBillCreation() {
  console.log('🚀 FORCE BILL CREATION FOR ALL EMPLOYEES');
  console.log('======================================');
  
  try {
    const qbo = await quickbooksService.initializeClient();
    console.log('✅ QuickBooks client ready');
    
    // Get employees without vendor IDs
    const employeesNeedingVendors = [
      { id: 'emp_madhuri_mccartney', name: 'Madhuri McCartney' },
      { id: 'emp_rhea_doshi', name: 'Rhea Doshi' },  
      { id: 'emp_alysha_mahagaonkar', name: 'Alysha Mahagaonkar' },
      { id: 'emp_anjali_patel', name: 'Anjali Patel' },
      { id: 'emp_yeshap_1752718856030', name: 'Yesha Patel' }
    ];
    
    console.log('🏢 Creating vendors with minimal data structure...');
    
    // Create vendors with absolute minimal structure
    for (const emp of employeesNeedingVendors) {
      console.log(`\n👤 Creating vendor: ${emp.name}`);
      
      // Use only the bare minimum required fields
      const vendorData = { Name: emp.name };
      
      try {
        const vendor = await new Promise((resolve, reject) => {
          qbo.createVendor(vendorData, (err: any, createdVendor: any) => {
            if (err) {
              console.log(`   ❌ Failed:`, err?.Fault?.Error?.[0]?.Message || 'Unknown error');
              reject(err);
            } else {
              console.log(`   ✅ Success: Vendor ID ${createdVendor.Id}`);
              resolve(createdVendor);
            }
          });
        });
        
        // Update user with vendor ID
        if (vendor && (vendor as any).Id) {
          await db.execute(`
            UPDATE users 
            SET quickbooks_vendor_id = '${(vendor as any).Id}'
            WHERE id = '${emp.id}'
          `);
          console.log(`   💾 Updated database with vendor ID: ${(vendor as any).Id}`);
        }
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1500));
        
      } catch (error: any) {
        console.log(`   ❌ Vendor creation failed for ${emp.name}`);
      }
    }
    
    console.log('\n💰 NOW CREATING ALL BILLS...');
    
    // Get ALL payroll records that need bills (should include newly created vendors)
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
    console.log(`💰 Found ${records.length} payroll records ready for bills`);
    
    if (records.length === 0) {
      console.log('⚠️ No records ready - checking vendor status...');
      
      // Check vendor status
      const vendorStatus = await db.execute(`
        SELECT first_name, last_name, quickbooks_vendor_id 
        FROM users 
        WHERE is_active = true AND hourly_rate IS NOT NULL
      `);
      
      const vendors = vendorStatus.rows || vendorStatus;
      console.log('👥 Current vendor status:');
      vendors.forEach((v: any) => {
        const status = v.quickbooks_vendor_id ? `✅ ID: ${v.quickbooks_vendor_id}` : '❌ Missing';
        console.log(`   ${v.first_name} ${v.last_name}: ${status}`);
      });
      
      return { message: 'Vendor creation needed before bill generation' };
    }
    
    // Create bills for all records
    const ACCOUNT_ID = '81'; // Professional Services
    const months = ['', 'January', 'February', 'March', 'April', 'May', 'June', 
                   'July', 'August', 'September', 'October', 'November', 'December'];
    
    let created = 0;
    let failed = 0;
    const billDetails = [];
    
    for (const record of records) {
      const monthName = months[record.month];
      const description = `${monthName} ${record.year} - ${record.first_name} ${record.last_name} Payroll`;
      
      console.log(`\n💳 Creating: ${description} - $${record.gross_pay}`);
      
      const bill = {
        VendorRef: { value: record.quickbooks_vendor_id },
        TotalAmt: parseFloat(record.gross_pay),
        Line: [{
          Amount: parseFloat(record.gross_pay),
          Description: description,
          DetailType: "AccountBasedExpenseLineDetail",
          AccountBasedExpenseLineDetail: {
            AccountRef: { value: ACCOUNT_ID }
          }
        }]
      };
      
      try {
        const result = await new Promise((resolve, reject) => {
          qbo.createBill(bill, (err: any, createdBill: any) => {
            if (err) {
              reject(err);
            } else {
              resolve(createdBill);
            }
          });
        });
        
        const billId = (result as any).Id;
        
        // Update database
        await db.execute(`
          UPDATE monthly_payroll 
          SET quickbooks_bill_id = '${billId}'
          WHERE id = ${record.payroll_id}
        `);
        
        billDetails.push({
          employee: `${record.first_name} ${record.last_name}`,
          month: monthName,
          amount: record.gross_pay,
          billId: billId
        });
        
        console.log(`   ✅ Bill ${billId} created and saved`);
        created++;
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error: any) {
        console.log(`   ❌ Failed: ${error?.Fault?.Error?.[0]?.Message || 'Unknown error'}`);
        failed++;
      }
    }
    
    console.log(`\n🎉 BILL CREATION COMPLETE!`);
    console.log(`✅ Bills created: ${created}`);
    console.log(`❌ Bills failed: ${failed}`);
    
    if (created > 0) {
      console.log('\n📋 CREATED BILLS:');
      billDetails.forEach(bill => {
        console.log(`✅ ${bill.employee} - ${bill.month}: $${bill.amount} (Bill ${bill.billId})`);
      });
    }
    
    // Final summary
    const finalSummary = await db.execute(`
      SELECT 
        COUNT(*) as total_payroll_records,
        COUNT(quickbooks_bill_id) as bills_with_qb_ids,
        ROUND(SUM(CAST(gross_pay AS DECIMAL)), 2) as total_payroll_amount
      FROM monthly_payroll mp
      JOIN users u ON mp.user_id = u.id
      WHERE mp.year = 2025 AND u.hourly_rate IS NOT NULL
    `);
    
    const summary = (finalSummary.rows || finalSummary)[0];
    console.log(`\n🎯 FINAL SUMMARY:`);
    console.log(`📊 Total payroll records: ${summary.total_payroll_records}`);
    console.log(`✅ Records with QuickBooks bills: ${summary.bills_with_qb_ids}`);
    console.log(`💰 Total payroll amount: $${summary.total_payroll_amount}`);
    console.log(`📈 Completion rate: ${(summary.bills_with_qb_ids / summary.total_payroll_records * 100).toFixed(1)}%`);
    
    return {
      billsCreated: created,
      billsFailed: failed,
      totalRecords: summary.total_payroll_records,
      billsWithQBIds: summary.bills_with_qb_ids,
      totalAmount: summary.total_payroll_amount
    };
    
  } catch (error) {
    console.error('❌ Error in force bill creation:', error);
    throw error;
  }
}

forceBillCreation();