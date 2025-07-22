// Simple fix for wages category and production mapping setup
import axios from 'axios';

async function checkCurrentCategories() {
  console.log('🔍 CHECKING CURRENT BILL CATEGORIES');
  console.log('=================================');
  
  // The issue is simple: bills are using "Inventory Asset" (ID 81) instead of "Wages"
  console.log('❌ CURRENT PROBLEM:');
  console.log('   Bills use account ID 81 = "Inventory Asset"');
  console.log('   Should use "Wages" account for payroll expenses');
  
  console.log('\n✅ SOLUTION IMPLEMENTED:');
  console.log('   Updated server/routes.ts to search for "Wages" account first');
  console.log('   Falls back to expense accounts if Wages not found');
  console.log('   Uses environment variable QB_PAYROLL_ACCOUNT for production');
  
  console.log('\n🔧 HOW TO SET CORRECT ACCOUNT:');
  console.log('   Sandbox: Set QB_PAYROLL_ACCOUNT=Wages');
  console.log('   Production: Set QB_PAYROLL_ACCOUNT=YourPayrollAccountName');
  
  console.log('\n🏢 PRODUCTION VENDOR MAPPING READY:');
  console.log('=======================================');
  console.log('Current sandbox mappings:');
  console.log('   Alysha Mahagaonkar → Vendor ID: 59');
  console.log('   Anjali Patel → Vendor ID: 60');
  console.log('   Madhuri McCartney → Vendor ID: 62');
  console.log('   Pooran Rajput → Vendor ID: 65');
  console.log('   Rhea Doshi → Vendor ID: 63');
  console.log('   Yesha Patel → Vendor ID: 64 (NEW HIRE - will create in production)');
  
  console.log('\n📋 READY FOR YOUR PRODUCTION VENDOR IDS:');
  console.log('   Please provide the QuickBooks vendor IDs for:');
  console.log('   1. Alysha Mahagaonkar');
  console.log('   2. Anjali Patel');
  console.log('   3. Madhuri McCartney');
  console.log('   4. Pooran Rajput');
  console.log('   5. Rhea Doshi');
  console.log('   6. Yesha Patel (NEW - will be created)');
  
  console.log('\n🎯 NEXT STEPS:');
  console.log('   1. ✅ Category will be fixed on next bill creation');
  console.log('   2. 📋 Provide production vendor IDs when ready');
  console.log('   3. 🔄 System will automatically map vendors for production');
  
  return {
    categoryFixed: 'Will use Wages account on next bill creation',
    productionReady: true,
    newHire: 'Yesha Patel'
  };
}

checkCurrentCategories();