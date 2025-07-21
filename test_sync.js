// Quick test to debug contractor sync issue
const axios = require('axios');

async function testSync() {
  try {
    console.log('Testing contractor sync...');
    
    // Login first
    const loginResponse = await axios.post('http://localhost:5000/api/login', {
      username: 'admin',
      password: 'admin123'
    });
    
    const cookies = loginResponse.headers['set-cookie'];
    console.log('Login successful');
    
    // Test sync
    const syncResponse = await axios.post('http://localhost:5000/api/quickbooks/sync-contractors', {}, {
      headers: {
        'Cookie': cookies.join('; ')
      }
    });
    
    console.log('Sync response:', syncResponse.data);
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testSync();