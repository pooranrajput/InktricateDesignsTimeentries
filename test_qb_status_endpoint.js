// Direct test of QuickBooks status endpoints
const testUrls = [
  'https://inkticate-time-tracker-pooranrajput.replit.app/qb-direct-status',
  'https://inkticate-time-tracker-pooranrajput.replit.app/api/quickbooks/status'
];

async function testEndpoint(url) {
  try {
    console.log(`\n🔍 Testing: ${url}`);
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' }
    });
    
    console.log(`Status: ${response.status}`);
    console.log(`Headers:`, Object.fromEntries(response.headers.entries()));
    
    const text = await response.text();
    console.log(`Response length: ${text.length}`);
    console.log(`Response preview: ${text.substring(0, 200)}`);
    
    if (text.trim().startsWith('{')) {
      try {
        const json = JSON.parse(text);
        console.log(`JSON parsed:`, json);
      } catch (e) {
        console.log(`JSON parse failed: ${e.message}`);
      }
    } else {
      console.log(`Not JSON - appears to be HTML`);
    }
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

async function runTests() {
  console.log('🚀 Testing QuickBooks Status Endpoints');
  console.log('=====================================');
  
  for (const url of testUrls) {
    await testEndpoint(url);
  }
  
  console.log('\n✅ All tests completed');
}

runTests();