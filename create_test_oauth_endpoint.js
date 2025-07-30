// Create a test endpoint to capture the exact OAuth callback and error details
import express from 'express';

const testApp = express();
testApp.use(express.json());

// Test callback endpoint that logs everything
testApp.get('/test-callback', (req, res) => {
  console.log('🔍 TEST CALLBACK RECEIVED');
  console.log('='.repeat(50));
  console.log('Query Parameters:', req.query);
  console.log('Headers:', req.headers);
  console.log('URL:', req.url);
  
  const { code, state, realmId, error } = req.query;
  
  if (error) {
    console.log('❌ OAuth Error:', error);
    return res.json({ status: 'error', error, query: req.query });
  }
  
  if (code && realmId) {
    console.log('✅ Authorization successful');
    console.log('Code length:', code.length);
    console.log('Realm ID:', realmId);
    console.log('State:', state);
    return res.json({ status: 'success', code: code.substring(0, 10) + '...', realmId, state });
  }
  
  console.log('⚠️ Missing parameters');
  return res.json({ status: 'incomplete', query: req.query });
});

// Start test server on different port
const PORT = 3001;
testApp.listen(PORT, () => {
  console.log(`Test callback server running on port ${PORT}`);
  console.log(`Test URL: http://localhost:${PORT}/test-callback`);
});

export { testApp };