// Test the frontend status issue directly
import fetch from 'node-fetch';

async function testEndpoints() {
  console.log('🔍 TESTING ALL STATUS ENDPOINTS');
  console.log('================================');
  
  const baseUrl = 'https://inkticate-time-tracker-pooranrajput.replit.app';
  const endpoints = [
    '/qb-direct-status',
    '/api/quickbooks/status',
    '/api/quickbooks/debug'
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\n📡 Testing: ${baseUrl}${endpoint}`);
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Frontend-Debug-Test'
        }
      });
      
      console.log(`   Status: ${response.status}`);
      console.log(`   Content-Type: ${response.headers.get('content-type')}`);
      
      const text = await response.text();
      console.log(`   Response length: ${text.length}`);
      console.log(`   Response preview: ${text.substring(0, 200)}...`);
      
      if (text.startsWith('{')) {
        const data = JSON.parse(text);
        console.log(`   ✅ Valid JSON:`, data);
      } else if (text.includes('<!DOCTYPE html>')) {
        console.log(`   ❌ Got HTML page instead of JSON - Vite routing issue`);
      } else {
        console.log(`   ❌ Unexpected response format`);
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
  
  console.log('\n🎯 ANALYSIS:');
  console.log('If endpoints return HTML instead of JSON, the frontend is being intercepted by Vite.');
  console.log('Solution: Use server-side rendering or bypass Vite completely for status checks.');
}

testEndpoints();