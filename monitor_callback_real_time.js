// Monitor the callback in real-time by watching console logs

console.log('🔍 MONITORING CALLBACK IN REAL TIME...\n');
console.log('✅ The OAuth authorization worked (no more "undefined didn\'t connect")');
console.log('❌ But the callback failed with an error redirect');
console.log('');
console.log('WHAT TO DO NEXT:');
console.log('1. Use the fresh URL below to try authorization again');
console.log('2. Complete the authorization quickly (auth codes expire fast)');
console.log('3. Watch the console logs for callback error details');
console.log('');

// Generate a fresh URL for immediate retry
import fetch from 'node-fetch';

const generateFreshUrl = async () => {
  try {
    const response = await fetch('http://localhost:5000/api/quickbooks/auth?immediate_retry=true');
    const data = await response.json();
    
    console.log('🔗 IMMEDIATE RETRY URL:');
    console.log('='.repeat(80));
    console.log(data.authUrl);
    console.log('='.repeat(80));
    console.log('');
    console.log('⏰ Use this URL immediately - auth codes expire in minutes');
    console.log('👀 Watch the server logs for callback details when you authorize');
    
    // Start monitoring for successful connection
    console.log('\n🔍 Starting connection monitor...');
    let attempts = 0;
    const maxAttempts = 60; // 2 minutes
    
    const monitor = setInterval(async () => {
      attempts++;
      
      try {
        // Try to connect to the actual API endpoint that should work
        const testResponse = await fetch('http://localhost:5000/api/quickbooks/debug', {
          headers: { 'Cookie': 'connect.sid=dummy' } // Dummy auth for test
        });
        
        if (testResponse.status !== 401) {
          process.stdout.write('.');
        }
        
        if (attempts >= maxAttempts) {
          clearInterval(monitor);
          console.log('\n⏰ Monitor timeout. Check server logs for callback error details.');
        }
        
      } catch (error) {
        process.stdout.write('x');
      }
    }, 2000);
    
    // Stop monitoring after success indicator
    setTimeout(() => {
      clearInterval(monitor);
      console.log('\n✅ If authorization succeeded, you should see success logs in the server console.');
    }, 120000);
    
  } catch (error) {
    console.log('Error generating URL:', error.message);
  }
};

generateFreshUrl();