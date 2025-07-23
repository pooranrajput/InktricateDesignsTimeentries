// Debug production QuickBooks configuration
import { config } from 'dotenv';

// Load production environment
config({ path: '.env.production', override: true });

console.log('🔍 PRODUCTION vs DEVELOPMENT QuickBooks Analysis');
console.log('='.repeat(60));

console.log('\n📋 Environment Variables:');
console.log('QUICKBOOKS_SANDBOX:', process.env.QUICKBOOKS_SANDBOX);
console.log('REPLIT_DOMAINS:', process.env.REPLIT_DOMAINS);
console.log('CLIENT_ID ends with:', process.env.QUICKBOOKS_CLIENT_ID?.slice(-10));

console.log('\n🌐 Domain Analysis:');
const currentDomain = process.env.REPLIT_DOMAINS;
const expectedProduction = 'inkticate-time-tracker-pooranrajput.replit.app';

console.log('Current domain:', currentDomain);
console.log('Expected production:', expectedProduction);
console.log('Domain matches production:', currentDomain === expectedProduction);

console.log('\n🔧 Callback URL Analysis:');
const developmentCallback = `https://${currentDomain}/api/quickbooks/callback`;
const productionCallback = `https://${expectedProduction}/api/quickbooks/callback`;

console.log('Development callback:', developmentCallback);
console.log('Production callback:', productionCallback);
console.log('URLs match:', developmentCallback === productionCallback);

console.log('\n⚠️  POTENTIAL ISSUES:');
if (currentDomain !== expectedProduction) {
  console.log('❌ DOMAIN MISMATCH: System using dev domain instead of production');
  console.log('❌ QuickBooks app might be configured for different callback URL');
  console.log('❌ This could cause "redirect_uri_mismatch" errors');
}

if (process.env.QUICKBOOKS_SANDBOX === 'true') {
  console.log('❌ SANDBOX MODE: Using sandbox credentials with production QuickBooks');
  console.log('❌ This will cause authentication failures');
}

console.log('\n✅ REQUIRED FIXES:');
console.log('1. Ensure REPLIT_DOMAINS = inkticate-time-tracker-pooranrajput.replit.app');
console.log('2. Ensure QUICKBOOKS_SANDBOX = false (or not set)');
console.log('3. Verify QuickBooks app callback URL matches production domain');
console.log('4. Use production Client ID and Secret');

console.log('\n🎯 CORRECT PRODUCTION SETUP:');
console.log('Domain:', expectedProduction);
console.log('Callback:', productionCallback);
console.log('Sandbox:', false);
console.log('Company ID expected:', '9130351530529746');