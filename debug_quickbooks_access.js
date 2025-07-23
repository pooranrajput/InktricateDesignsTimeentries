// Debug QuickBooks access and company availability
import { config } from 'dotenv';

config({ path: '.env.production', override: true });

console.log('🔍 DEBUGGING QUICKBOOKS COMPANY ACCESS');
console.log('='.repeat(60));

console.log('\n📋 Current Configuration:');
console.log('Client ID:', process.env.QUICKBOOKS_CLIENT_ID?.substring(0, 15) + '...');
console.log('Sandbox Mode:', process.env.QUICKBOOKS_SANDBOX);
console.log('Target Production Company:', '9130351530529746');
console.log('Getting Sandbox Company:', '9341455047397094');

console.log('\n🤔 POSSIBLE REASONS FOR SANDBOX COMPANY ACCESS:');
console.log('1. QuickBooks app may be configured for sandbox environment');
console.log('2. Your QuickBooks account may not have access to production company 9130351530529746');
console.log('3. Production company 9130351530529746 may not exist or be accessible');
console.log('4. App permissions may be limited to sandbox companies');
console.log('5. The realmId parameter may not work with your specific app configuration');

console.log('\n🔧 DEBUGGING STEPS:');
console.log('1. Check QuickBooks Developer Dashboard - which companies are linked to your app?');
console.log('2. Verify if company 9130351530529746 exists in your QuickBooks account');
console.log('3. Check if your QuickBooks app is approved for production use');
console.log('4. Verify app permissions include production company access');

console.log('\n💡 TEMPORARY SOLUTION:');
console.log('- Allow sandbox company connection to test integration');
console.log('- Debug why production company is not accessible');
console.log('- Fix production access once connection is working');

console.log('\n🎯 NEXT ACTIONS:');
console.log('1. Temporarily accept sandbox company 9341455047397094');
console.log('2. Test QuickBooks integration functionality');
console.log('3. Investigate production company access separately');
console.log('4. Switch to production once access is resolved');