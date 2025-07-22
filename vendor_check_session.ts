// Check QuickBooks for existing vendors and update our database
import { quickbooksService } from './server/quickbooks';
import { db } from './server/db';

async function checkAndUpdateVendors() {
  console.log('🔍 CHECKING QUICKBOOKS FOR EXISTING VENDORS');
  console.log('==========================================');
  
  try {
    const qbo = await quickbooksService.initializeClient();
    console.log('✅ QuickBooks client initialized');
    
    // Query all vendors from QuickBooks
    console.log('📋 Retrieving all vendors from QuickBooks...');
    
    const vendors = await new Promise((resolve, reject) => {
      qbo.findVendors((err: any, vendorList: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(vendorList);
        }
      });
    });
    
    const vendorArray = (vendors as any)?.QueryResponse?.Vendor || [];
    console.log(`📊 Found ${vendorArray.length} total vendors in QuickBooks`);
    
    if (vendorArray.length > 0) {
      console.log('\n👥 ALL QUICKBOOKS VENDORS:');
      vendorArray.forEach((vendor: any) => {
        console.log(`   ID: ${vendor.Id} - Name: "${vendor.Name}" (Active: ${vendor.Active})`);
      });
    }
    
    // Get our employees who need vendor mapping
    const employees = await db.execute(`
      SELECT id, first_name, last_name, email, quickbooks_vendor_id
      FROM users 
      WHERE is_active = true AND hourly_rate IS NOT NULL
      ORDER BY first_name
    `);
    
    const employeeList = employees.rows || employees;
    console.log(`\n🎯 MATCHING EMPLOYEES TO VENDORS:`);
    
    let updatedCount = 0;
    
    for (const employee of employeeList) {
      const fullName = `${employee.first_name} ${employee.last_name}`;
      console.log(`\n👤 Looking for: ${fullName}`);
      
      // Find matching vendor by name
      const matchingVendor = vendorArray.find((vendor: any) => 
        vendor.Name === fullName || 
        vendor.Name === `${employee.first_name} ${employee.last_name}` ||
        vendor.DisplayName === fullName
      );
      
      if (matchingVendor) {
        console.log(`   ✅ FOUND: Vendor ID ${matchingVendor.Id} - "${matchingVendor.Name}"`);
        
        if (!employee.quickbooks_vendor_id) {
          // Update our database with the vendor ID
          await db.execute(`
            UPDATE users 
            SET quickbooks_vendor_id = '${matchingVendor.Id}'
            WHERE id = '${employee.id}'
          `);
          console.log(`   💾 Updated database: ${fullName} → Vendor ID ${matchingVendor.Id}`);
          updatedCount++;
        } else {
          console.log(`   ℹ️  Already mapped: ${fullName} → Vendor ID ${employee.quickbooks_vendor_id}`);
        }
      } else {
        console.log(`   ❌ NOT FOUND: No vendor found for ${fullName}`);
        // Show similar names for reference
        const similarNames = vendorArray
          .filter((v: any) => v.Name.includes(employee.first_name) || v.Name.includes(employee.last_name))
          .map((v: any) => `"${v.Name}" (ID: ${v.Id})`);
        
        if (similarNames.length > 0) {
          console.log(`      Similar names found: ${similarNames.join(', ')}`);
        }
      }
    }
    
    console.log(`\n📈 VENDOR MAPPING UPDATE COMPLETE:`);
    console.log(`✅ Database updated: ${updatedCount} employees`);
    
    // Show final status
    const finalStatus = await db.execute(`
      SELECT first_name, last_name, quickbooks_vendor_id
      FROM users 
      WHERE is_active = true AND hourly_rate IS NOT NULL
      ORDER BY first_name
    `);
    
    const finalList = finalStatus.rows || finalStatus;
    console.log(`\n📊 FINAL VENDOR MAPPING STATUS:`);
    
    let employeesWithVendors = 0;
    finalList.forEach((emp: any) => {
      const status = emp.quickbooks_vendor_id ? '✅' : '❌';
      console.log(`${status} ${emp.first_name} ${emp.last_name}: ${emp.quickbooks_vendor_id || 'No vendor ID'}`);
      if (emp.quickbooks_vendor_id) employeesWithVendors++;
    });
    
    console.log(`\n🎯 SUMMARY: ${employeesWithVendors}/${finalList.length} employees have QuickBooks vendor IDs`);
    
    if (employeesWithVendors === finalList.length) {
      console.log('\n🎉 SUCCESS: All employees now have vendor IDs!');
      console.log('   Ready to create properly mapped bills');
    } else {
      console.log('\n⚠️  Some employees still missing vendor IDs');
      console.log('   May need manual vendor creation for remaining employees');
    }
    
    return {
      totalVendorsFound: vendorArray.length,
      employeesUpdated: updatedCount,
      employeesWithVendors: employeesWithVendors,
      totalEmployees: finalList.length
    };
    
  } catch (error) {
    console.error('❌ Error checking vendors:', error);
    throw error;
  }
}

checkAndUpdateVendors();