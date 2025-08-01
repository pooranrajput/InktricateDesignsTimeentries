// Test bypass routes directly on server port
import { exec } from 'child_process';

const testRoutes = [
  '/health',
  '/qb-direct-status',
  '/api/debug-test',
  '/api/quickbooks/status'
];

console.log('🧪 Testing bypass routes...');

// Test each route
testRoutes.forEach((route, index) => {
  setTimeout(() => {
    const curlCmd = `curl -s "http://localhost:5000${route}" -H "Accept: application/json"`;
    console.log(`\n${index + 1}. Testing ${route}:`);
    
    exec(curlCmd, (error, stdout, stderr) => {
      if (error) {
        console.log(`❌ Error: ${error.message}`);
        return;
      }
      
      if (stderr) {
        console.log(`⚠️  Stderr: ${stderr}`);
        return;
      }
      
      const output = stdout.trim();
      if (output.startsWith('{')) {
        console.log('✅ JSON response received');
        try {
          const data = JSON.parse(output);
          console.log('📋 Data:', JSON.stringify(data, null, 2));
        } catch (e) {
          console.log('❌ Invalid JSON:', output.substring(0, 100));
        }
      } else if (output.includes('<!DOCTYPE html>')) {
        console.log('❌ HTML response (Vite interception)');
      } else {
        console.log('❓ Unknown response:', output.substring(0, 100));
      }
    });
  }, index * 1000);
});