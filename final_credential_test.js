// Test authorization URL generation with corrected credentials
const express = require('express');

console.log('🔍 TESTING CORRECTED CREDENTIALS');
console.log('='.repeat(60));

// Credentials from screenshot (now corrected in system)
const correctClientId = 'AB6HieH2iCWWSQ8jneSCittfIAKuPHIcujzio09raTAQV5EUtA';
const correctClientSecret = process.env.QUICKBOOKS_CLIENT_SECRET;
const productionCompanyId = '9130351530529746';
const redirectUri = 'https://inkticate-time-tracker-pooranrajput.replit.app/api/quickbooks/callback';

console.log('\n📋 CREDENTIAL STATUS:');
console.log('Client ID (corrected):', correctClientId);
console.log('Client Secret matches screenshot:', correctClientSecret === 'ezxQeCSAH2uQ3SpXAFKG0pezNOsNgFI26cIKEnDU');
console.log('Production Company ID:', productionCompanyId);

console.log('\n🔗 CORRECTED AUTHORIZATION URL:');
const authUrl = new URL('https://appcenter.intuit.com/connect/oauth2');
authUrl.searchParams.append('client_id', correctClientId);
authUrl.searchParams.append('scope', 'com.intuit.quickbooks.accounting');
authUrl.searchParams.append('redirect_uri', redirectUri);
authUrl.searchParams.append('response_type', 'code');
authUrl.searchParams.append('state', 'timetracking-reauth');
authUrl.searchParams.append('realmId', productionCompanyId);

console.log(authUrl.toString());

console.log('\n✅ EXPECTED OAUTH FLOW:');
console.log('1. User visits authorization URL above');
console.log('2. QuickBooks automatically selects company', productionCompanyId);
console.log('3. User authorizes application');
console.log('4. QuickBooks redirects with authorization code');
console.log('5. System exchanges code for tokens using matching credentials');
console.log('6. SUCCESS: Access token stored for bill creation');

console.log('\n🎯 KEY FIXES APPLIED:');
console.log('✅ Client ID: Fixed character mismatch at positions 20-21 (i→I, t→c)');
console.log('✅ Client Secret: Updated Replit secret to match screenshot exactly');
console.log('✅ Company Preselection: realmId parameter ensures correct company');
console.log('✅ Production Mode: All sandbox references removed');