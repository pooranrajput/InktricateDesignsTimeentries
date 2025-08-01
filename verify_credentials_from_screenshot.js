// Verify credentials from screenshot against our system
console.log('🔍 CREDENTIAL VERIFICATION FROM SCREENSHOT');
console.log('='.repeat(60));

// Credentials visible in screenshot
const screenshotClientId = 'AB6HieH2iCWWSQ8jneSCittfIAKuPHIcujzio09raTAQV5EUtA';
const screenshotClientSecret = 'ezxQeCSAH2uQ3SpXAFKG0pezNOsNgFI26cIKEnDU';

// Credentials in our system
const systemClientId = 'AB6HieH2iCWWSQ8jneSCIctfIAKuPHIcujzio09raTAQV5EUtA';
const systemClientSecret = process.env.QUICKBOOKS_CLIENT_SECRET || 'NOT_SET';

console.log('\n📋 CREDENTIAL COMPARISON:');
console.log('Screenshot Client ID:', screenshotClientId);
console.log('System Client ID:    ', systemClientId);
console.log('Client IDs Match:    ', screenshotClientId === systemClientId);

console.log('\nScreenshot Secret:', screenshotClientSecret);
console.log('System Secret:    ', systemClientSecret);
console.log('Secrets Match:    ', screenshotClientSecret === systemClientSecret);

if (screenshotClientId !== systemClientId) {
  console.log('\n🚨 CLIENT ID MISMATCH DETECTED!');
  console.log('Position differences:');
  for (let i = 0; i < Math.max(screenshotClientId.length, systemClientId.length); i++) {
    if (screenshotClientId[i] !== systemClientId[i]) {
      console.log(`  Position ${i}: Screenshot='${screenshotClientId[i] || 'MISSING'}', System='${systemClientId[i] || 'MISSING'}'`);
    }
  }
}

if (screenshotClientSecret !== systemClientSecret) {
  console.log('\n🚨 CLIENT SECRET MISMATCH DETECTED!');
  console.log('This explains the "invalid_grant" error');
}

console.log('\n💡 RESOLUTION:');
if (screenshotClientId !== systemClientId) {
  console.log('1. Update system Client ID to match screenshot');
}
if (screenshotClientSecret !== systemClientSecret) {
  console.log('2. Update Replit secret QUICKBOOKS_CLIENT_SECRET to match screenshot');
}
console.log('3. Test OAuth with matching credentials');