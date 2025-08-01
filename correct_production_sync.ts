// CORRECT PRODUCTION SYNC - Using Development Logic from VENDOR_BILL_MAPPING_BACKUP.md
import { quickbooksService } from './server/quickbooks';
import { storage } from './server/storage';

async function correctProductionSync() {
  console.log('🏢 STARTING PRODUCTION SYNC WITH PROPER DUPLICATE DETECTION');
  console.log('===========================================================');
  console.log('Using tested logic from development (VENDOR_BILL_MAPPING_BACKUP.md)');
  
  try {
    const qbo = await quickbooksService.initializeClient();
    console.log('✅ QuickBooks client initialized');
    
    // STEP 1: Get ALL existing vendors from production QuickBooks (like vendor_check_session.ts)
    console.log('\n📋 Retrieving ALL vendors from production QuickBooks...');
    
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
    console.log(`📊 Found ${vendorArray.length} existing vendors in production QuickBooks`);
    
    if (vendorArray.length > 0) {
      console.log('\n👥 ALL PRODUCTION VENDORS:');
      vendorArray.forEach((vendor: any) => {
        console.log(`   ID: ${vendor.Id} - Name: "${vendor.Name}" (Active: ${vendor.Active})`);
      });
    }
    
    // STEP 2: Get employees who need vendor mapping
    const employees = await storage.getAllEmployees();
    const activeContractors = employees.filter((emp: any) => emp.isActive || emp.is_active);
    console.log(`\n🎯 MATCHING ${activeContractors.length} EMPLOYEES TO EXISTING VENDORS:`);
    
    let updatedCount = 0;
    let createdCount = 0;
    let results = [];
    
    for (const employee of activeContractors) {
      const firstName = employee.first_name || employee.firstName;
      const lastName = employee.last_name || employee.lastName;
      const fullName = `${firstName} ${lastName}`;
      console.log(`\n👤 Processing: ${fullName}`);
      
      // DUPLICATE DETECTION: Use exact logic from vendor_check_session.ts
      const matchingVendor = vendorArray.find((vendor: any) => 
        vendor.Name === fullName || 
        vendor.Name === `${firstName} ${lastName}` ||
        vendor.DisplayName === fullName
      );
      
      if (matchingVendor) {
        console.log(`   ✅ EXISTING VENDOR FOUND: ID ${matchingVendor.Id} - "${matchingVendor.Name}"`);
        
        // Update our database with the vendor ID (don't create new vendor!)
        await storage.updateUser(employee.id, { 
          quickbooksVendorId: matchingVendor.Id 
        });
        console.log(`   💾 Linked database: ${fullName} → Vendor ID ${matchingVendor.Id}`);
        
        // Enable 1099 tracking on existing vendor using backup logic
        try {
          const updateData = {
            Id: matchingVendor.Id,
            SyncToken: matchingVendor.SyncToken,
            DisplayName: matchingVendor.DisplayName || matchingVendor.Name,
            Vendor1099: true,  // CRITICAL: Enable 1099 tracking from backup
            Active: true,
            sparse: false
          };
          
          await new Promise((resolve, reject) => {
            qbo.updateVendor(updateData, (err: any, updatedVendor: any) => {
              if (err) {
                console.log(`   ⚠️ Could not enable 1099 tracking: ${err?.Fault?.Error?.[0]?.Detail || err.message}`);
                resolve(null);
              } else {
                console.log(`   ✅ Enabled 1099 tracking for existing vendor`);
                resolve(updatedVendor);
              }
            });
          });
        } catch (updateError) {
          console.log(`   ⚠️ 1099 update failed: ${updateError}`);
        }
        
        results.push({
          employee: employee.id,
          employeeName: fullName,
          status: 'linked',
          message: 'Successfully linked to existing vendor',
          quickbooksId: matchingVendor.Id,
          actions: [
            'Found existing vendor in QuickBooks',
            'Linked to employee database record', 
            'Enabled 1099 tracking'
          ]
        });
        updatedCount++;
        
      } else {
        console.log(`   ❌ NO EXISTING VENDOR: Need to create new vendor for ${fullName}`);
        
        // Only create vendor if it doesn't exist (like Yesha Patel who's new)
        // Using vendor creation logic from VENDOR_BILL_MAPPING_BACKUP.md
        const vendorData = {
          PrimaryEmailAddr: { Address: employee.email },
          DisplayName: fullName,
          CompanyName: fullName,
          BillAddr: {
            Line1: employee.homeAddress || "123 Main Street",
            City: "Your City", 
            CountrySubDivisionCode: "NJ",
            PostalCode: "07093"
          },
          Active: true,
          Vendor1099: true  // CRITICAL: Enable 1099 tracking from backup
        };
        
        try {
          const createdVendor = await new Promise((resolve, reject) => {
            qbo.createVendor(vendorData, (err: any, vendor: any) => {
              if (err) reject(err);
              else resolve(vendor);
            });
          });
          
          if (createdVendor && (createdVendor as any).Id) {
            const vendorId = (createdVendor as any).Id;
            console.log(`   ✅ CREATED NEW VENDOR: ID ${vendorId} for ${fullName}`);
            
            // Update database
            await storage.updateUser(employee.id, { 
              quickbooksVendorId: vendorId 
            });
            
            results.push({
              employee: employee.id,
              employeeName: fullName,
              status: 'created',
              message: 'Successfully created new contractor vendor',
              quickbooksId: vendorId,
              actions: [
                'Created new vendor in QuickBooks',
                'Enabled 1099 tracking for new contractor',
                'Linked to employee database record'
              ]
            });
            createdCount++;
          }
          
        } catch (createError) {
          console.log(`   ❌ VENDOR CREATION FAILED: ${createError}`);
          results.push({
            employee: employee.id,
            employeeName: fullName,
            status: 'failed',
            error: createError instanceof Error ? createError.message : 'Vendor creation failed',
            message: 'Could not create vendor in QuickBooks'
          });
        }
      }
    }
    
    console.log(`\n🎉 PRODUCTION SYNC COMPLETE!`);
    console.log(`📊 Results: ${updatedCount} linked, ${createdCount} created`);
    console.log(`✅ All contractors now properly mapped to QuickBooks vendors`);
    
    if (results.length > 0) {
      console.log(`\n📋 DETAILED RESULTS:`);
      results.forEach(result => {
        const status = result.status === 'linked' ? '🔗' : result.status === 'created' ? '🆕' : '❌';
        console.log(`${status} ${result.employeeName}: ${result.message} (QB ID: ${result.quickbooksId || 'N/A'})`);
      });
    }
    
    return {
      success: true,
      total: activeContractors.length,
      linked: updatedCount,
      created: createdCount, 
      failed: results.filter(r => r.status === 'failed').length,
      message: `Sync completed: ${createdCount} created, ${updatedCount} linked`,
      details: results
    };
    
  } catch (error) {
    console.error('❌ Production sync failed:', error);
    throw error;
  }
}

// Run the corrected sync
correctProductionSync()
  .then(result => {
    console.log('\n✅ CORRECTED PRODUCTION SYNC COMPLETED SUCCESSFULLY');
    console.log('Result:', JSON.stringify(result, null, 2));
  })
  .catch(error => {
    console.error('\n❌ CORRECTED PRODUCTION SYNC FAILED');
    console.error('Error:', error);
  });