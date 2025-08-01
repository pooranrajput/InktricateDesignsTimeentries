// Serve the direct connection page

import { readFileSync } from 'fs';
import { createServer } from 'http';

const html = readFileSync('./direct_qb_connection.html', 'utf8');

const server = createServer((req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/html',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  res.end(html);
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Direct QuickBooks connection page available at:`);
  console.log(`http://localhost:${PORT}`);
  console.log('');
  console.log('This page bypasses all frontend caching issues.');
  console.log('It generates fresh OAuth URLs directly from the server.');
});

// Keep the server running
process.on('SIGINT', () => {
  console.log('\nShutting down direct connection server...');
  server.close();
  process.exit(0);
});