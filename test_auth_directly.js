// Direct test of the auth endpoint to get authorization URL
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/quickbooks/auth',
  method: 'GET',
  headers: {
    'Cookie': 'connect.sid=s%3A7txdzFjABOH5KWV6H2kZSx1ewdwNmsZC.CCcD2QV3YtODp0BghQ446WdjJKMjXa3KJUbFItWHxoc',
    'Content-Type': 'application/json'
  },
  timeout: 5000
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers)}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:', data);
  });
});

req.on('error', (error) => {
  console.error('Request error:', error);
});

req.on('timeout', () => {
  console.error('Request timeout');
  req.destroy();
});

req.end();