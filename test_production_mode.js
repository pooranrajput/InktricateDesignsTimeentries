// Test server in production mode to bypass Vite
process.env.NODE_ENV = 'production';

import('./server/index.js').then(() => {
  console.log('✅ Production mode server started');
}).catch(error => {
  console.error('❌ Production mode failed:', error);
  process.exit(1);
});