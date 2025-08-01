// Direct production lookup for Rhea Doshi
const { quickbooksService } = require('./server/quickbooks.ts');

async function findRheaInProduction() {
  console.log('🔍 Searching production QuickBooks for Rhea Doshi...');
  
  try {
    const qbo = await quickbooksService.initializeClient();
    
    const vendors = await new Promise((resolve, reject) => {
      qbo.findVendors((err, vendorList) => {
        if (err) reject(err);
        else resolve(vendorList);
      });
    });
    
    const vendorArray = vendors?.QueryResponse?.Vendor || [];
    console.log(\`📊 Searching \${vendorArray.length} production vendors\`);
    
    // Look for Rhea Doshi
    const rheaMatches = vendorArray.filter(v => 
      v.Name && (
        v.Name.toLowerCase().includes('rhea') ||
        v.Name.toLowerCase().includes('doshi') ||
        v.Name === 'Rhea Doshi'
      )
    );
    
    if (rheaMatches.length > 0) {
      console.log('🎯 FOUND MATCHES FOR RHEA:');
      rheaMatches.forEach(vendor => {
        console.log(\`   ID: \${vendor.Id} - Name: "\${vendor.Name}" (Active: \${vendor.Active})\`);
        if (vendor.Name.toLowerCase() === 'rhea doshi') {
          console.log(\`   ✅ EXACT MATCH: Rhea Doshi has vendor ID \${vendor.Id}\`);
        }
      });
      return rheaMatches;
    } else {
      console.log('❌ No matches found for Rhea');
      // Show some sample vendors
      console.log('Sample vendors:');
      vendorArray.slice(0, 10).forEach(v => {
        console.log(\`   ID: \${v.Id} - Name: "\${v.Name}"\`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

findRheaInProduction();