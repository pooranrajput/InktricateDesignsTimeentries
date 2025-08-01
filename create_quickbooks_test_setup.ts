// QuickBooks Test Setup Script
// This script helps set up sandbox mode for testing if no production QB account is available

import { config } from 'dotenv';

// Load current environment
config();

console.log('🔍 Current QuickBooks Configuration:');
console.log('QUICKBOOKS_CLIENT_ID:', process.env.QUICKBOOKS_CLIENT_ID?.substring(0, 10) + '...');
console.log('QUICKBOOKS_SANDBOX:', process.env.QUICKBOOKS_SANDBOX);
console.log('QUICKBOOKS_REDIRECT_URI:', process.env.QUICKBOOKS_REDIRECT_URI);

console.log('\n📋 Options Available:');
console.log('1. PRODUCTION MODE (current): Requires real business QuickBooks account');
console.log('2. SANDBOX MODE: Can use demo QuickBooks company for testing');

console.log('\n💡 To switch to sandbox mode for testing:');
console.log('1. Set QUICKBOOKS_SANDBOX=true in environment');
console.log('2. Use sandbox QuickBooks app credentials');
console.log('3. Connect to demo company ID: 9341455047397094');

console.log('\n🎯 For production use:');
console.log('1. Keep QUICKBOOKS_SANDBOX=false');
console.log('2. Obtain access to real business QuickBooks Online account');
console.log('3. Use authorization URL with actual business account');

console.log('\n✅ Current authorization URL (production):');
const authUrl = `https://appcenter.intuit.com/connect/oauth2?client_id=${process.env.QUICKBOOKS_CLIENT_ID}&scope=com.intuit.quickbooks.accounting&redirect_uri=https%3A%2F%2Finkticate-time-tracker-pooranrajput.replit.app%2Fapi%2Fquickbooks%2Fcallback&response_type=code&state=timetracking-setup`;
console.log(authUrl);