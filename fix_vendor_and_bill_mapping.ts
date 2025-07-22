// Fix the vendor mapping issue - create individual vendors and recreate bills correctly
import { quickbooksService } from './server/quickbooks';
import { db } from './server/db';

async function fixVendorAndBillMapping() {
  console.log('🔧 FIXING VENDOR MAPPING AND RECREATING BILLS CORRECTLY');
  console.log('=====================================================');
  console.log('ISSUE: All bills were created under Pooran Rajput vendor ID 65');
  console.log('SOLUTION: Create individual vendors for each employee and map bills correctly');
  
  try {
    const qbo = await quickbooksService.initializeClient();
    console.log('✅ QuickBooks client initialized');
    
    // First, get all employees who need individual vendors
    const employees = await db.execute(`
      SELECT id, first_name, last_name, email, quickbooks_vendor_id
      FROM users 
      WHERE is_active = true AND hourly_rate IS NOT NULL
      ORDER BY first_name
    `);
    
    const employeeList = employees.rows || employees;
    console.log(`\n👥 Found ${employeeList.length} employees needing proper vendor setup:`);
    
    employeeList.forEach((emp: any) => {
      const vendorStatus = emp.quickbooks_vendor_id ? `✅ ID: ${emp.quickbooks_vendor_id}` : '❌ Missing';
      console.log(`   ${emp.first_name} ${emp.last_name}: ${vendorStatus}`);
    });
    
    // Create vendors for employees who don't have them
    console.log('\n🏢 Creating missing vendors...');
    
    for (const employee of employeeList) {
      if (!employee.quickbooks_vendor_id) {
        console.log(`\n👤 Creating vendor for: ${employee.first_name} ${employee.last_name}`);
        
        // Try different vendor creation approaches
        const vendorAttempts = [
          // Attempt 1: Minimal structure
          { Name: `${employee.first_name} ${employee.last_name}` },
          // Attempt 2: With email
          { 
            Name: `${employee.first_name} ${employee.last_name}`,
            CompanyName: `${employee.first_name} ${employee.last_name}`,
            PrimaryEmailAddr: { Address: employee.email }
          },
          // Attempt 3: Even more minimal
          { CompanyName: `${employee.first_name} ${employee.last_name}` }
        ];
        
        let vendorCreated = false;
        
        for (let i = 0; i < vendorAttempts.length && !vendorCreated; i++) {
          const vendorData = vendorAttempts[i];
          console.log(`   Attempt ${i + 1}: ${JSON.stringify(vendorData)}`);
          
          try {
            const vendor = await new Promise((resolve, reject) => {
              qbo.createVendor(vendorData, (err: any, createdVendor: any) => {
                if (err) {
                  console.log(`   ❌ Attempt ${i + 1} failed:`, err?.Fault?.Error?.[0]?.Message || 'Unknown error');
                  reject(err);
                } else {
                  console.log(`   ✅ Vendor created successfully: ID ${createdVendor.Id}`);
                  resolve(createdVendor);
                }
              });
            });
            
            if (vendor && (vendor as any).Id) {
              // Update employee with vendor ID
              await db.execute(`
                UPDATE users 
                SET quickbooks_vendor_id = '${(vendor as any).Id}'
                WHERE id = '${employee.id}'
              `);
              
              console.log(`   💾 Updated ${employee.first_name} with vendor ID: ${(vendor as any).Id}`);
              vendorCreated = true;
              
              // Rate limiting
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
            
          } catch (error) {
            // Continue to next attempt
            continue;
          }
        }
        
        if (!vendorCreated) {
          console.log(`   ❌ Failed to create vendor for ${employee.first_name} ${employee.last_name} after all attempts`);
        }
      }
    }
    
    // Now check updated vendor status
    console.log('\n📊 UPDATED VENDOR STATUS:');
    const updatedEmployees = await db.execute(`
      SELECT id, first_name, last_name, quickbooks_vendor_id
      FROM users 
      WHERE is_active = true AND hourly_rate IS NOT NULL
      ORDER BY first_name
    `);
    
    const updatedList = updatedEmployees.rows || updatedEmployees;
    let employeesWithVendors = 0;
    
    updatedList.forEach((emp: any) => {
      const vendorStatus = emp.quickbooks_vendor_id ? '✅' : '❌';
      console.log(`${vendorStatus} ${emp.first_name} ${emp.last_name}: ${emp.quickbooks_vendor_id || 'No vendor ID'}`);
      if (emp.quickbooks_vendor_id) employeesWithVendors++;
    });
    
    console.log(`\n📈 Vendor creation summary: ${employeesWithVendors}/${updatedList.length} employees have vendor IDs`);
    
    if (employeesWithVendors === 0) {
      console.log('\n⚠️ VENDOR CREATION WORKAROUND NEEDED');
      console.log('QuickBooks sandbox appears to be rejecting vendor creation');
      console.log('Manual vendor creation in QuickBooks UI may be required');
      return;
    }
    
    // Step 2: Now delete incorrectly mapped bills and recreate them properly
    console.log('\n🗑️ CLEANING UP INCORRECTLY MAPPED BILLS');
    console.log('Note: Bills created under wrong vendor (Pooran Rajput ID 65)');
    
    // Clear QuickBooks bill IDs for bills that were mapped to wrong vendor
    await db.execute(`
      UPDATE monthly_payroll mp
      SET quickbooks_bill_id = NULL
      FROM users u
      WHERE mp.user_id = u.id 
        AND mp.year = 2025 
        AND u.first_name != 'Pooran'
        AND mp.quickbooks_bill_id IS NOT NULL
    `);
    
    console.log('✅ Cleared incorrect bill mappings from database');
    
    // Step 3: Recreate bills with correct vendor mapping
    console.log('\n💰 RECREATING BILLS WITH CORRECT VENDOR MAPPING');
    
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
        AND u.hourly_rate IS NOT NULL
      ORDER BY u.first_name, mp.month
    `);
    
    const recordsToProcess = payrollRecords.rows || payrollRecords;
    console.log(`📊 Found ${recordsToProcess.length} payroll records for proper bill creation`);
    
    if (recordsToProcess.length === 0) {
      console.log('✅ No records to process - either all mapped or vendors missing');
      return;
    }
    
    const months = ['', 'January', 'February', 'March', 'April', 'May', 'June', 
                   'July', 'August', 'September', 'October', 'November', 'December'];
    const PROFESSIONAL_SERVICES_ACCOUNT = '81';
    
    let billsCreated = 0;
    let billsFailed = 0;
    const correctBills = [];
    
    for (const record of recordsToProcess) {
      const monthName = months[record.month];
      const description = `${monthName} ${record.year} - ${record.first_name} ${record.last_name} Payroll`;
      
      console.log(`\n👤 Creating bill: ${description}`);
      console.log(`   💰 Amount: $${record.gross_pay} → Vendor ID: ${record.quickbooks_vendor_id}`);
      
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
          
          console.log(`   ✅ Bill ${billId} created and mapped correctly`);
          
          correctBills.push({
            employee: `${record.first_name} ${record.last_name}`,
            month: monthName,
            amount: record.gross_pay,
            vendorId: record.quickbooks_vendor_id,
            billId: billId
          });
          
          billsCreated++;
          
          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
      } catch (error: any) {
        console.log(`   ❌ Failed: ${error?.Fault?.Error?.[0]?.Message || 'Unknown error'}`);
        billsFailed++;
      }
    }
    
    console.log(`\n🎉 VENDOR MAPPING FIX COMPLETE!`);
    console.log(`✅ Correctly mapped bills created: ${billsCreated}`);
    console.log(`❌ Bills failed: ${billsFailed}`);
    
    if (correctBills.length > 0) {
      console.log(`\n📋 CORRECTLY MAPPED BILLS:`);
      correctBills.forEach(bill => {
        console.log(`✅ ${bill.employee} - ${bill.month}: $${bill.amount} → Vendor ${bill.vendorId}, Bill ${bill.billId}`);
      });
    }
    
    // Final verification
    const finalStatus = await db.execute(`
      SELECT 
        u.first_name,
        u.last_name,
        u.quickbooks_vendor_id,
        COUNT(*) as total_payroll,
        COUNT(mp.quickbooks_bill_id) as bills_created
      FROM users u
      JOIN monthly_payroll mp ON u.id = mp.user_id
      WHERE u.hourly_rate IS NOT NULL AND mp.year = 2025
      GROUP BY u.first_name, u.last_name, u.quickbooks_vendor_id
      ORDER BY u.first_name
    `);
    
    const status = finalStatus.rows || finalStatus;
    console.log(`\n📊 FINAL VENDOR MAPPING STATUS:`);
    
    status.forEach((emp: any) => {
      const completion = emp.bills_created === emp.total_payroll ? '✅' : '⚠️';
      console.log(`${completion} ${emp.first_name} ${emp.last_name} (Vendor: ${emp.quickbooks_vendor_id}): ${emp.bills_created}/${emp.total_payroll} bills`);
    });
    
    return {
      vendorsCreated: employeesWithVendors,
      billsCreated,
      billsFailed
    };
    
  } catch (error) {
    console.error('❌ Error in vendor mapping fix:', error);
    throw error;
  }
}

fixVendorAndBillMapping();