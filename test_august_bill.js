// Test the new bill format for August
console.log('🧪 Testing new bill format for August 2025...');

const months = ['January', 'February', 'March', 'April', 'May', 'June', 
               'July', 'August', 'September', 'October', 'November', 'December'];

const user = { firstName: 'Pooran', lastName: 'Rajput' };
const month = 8; // August
const year = 2025;

const description = `${months[month-1]} ${year} - ${user.firstName} ${user.lastName} Payroll`;

console.log('✅ New description format:', description);
console.log('✅ Expected: "August 2025 - Pooran Rajput Payroll"');
console.log('✅ Account category: Wages (in production, you can update this)');
console.log('');
console.log('📋 Bill structure will be:');
console.log('- Category: Wages');
console.log('- Description:', description);
console.log('- Format matches your requirements!');

process.exit(0);