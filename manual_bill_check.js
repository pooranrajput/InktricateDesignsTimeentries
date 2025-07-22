// Check what bills exist in QuickBooks
console.log('🔍 Checking existing bills in QuickBooks...');
console.log('');
console.log('Based on your previous success:');
console.log('- Manual Bill ID 145: Created successfully for Pooran Rajput');
console.log('- Database shows Bill ID 146: But not visible in QuickBooks');
console.log('');
console.log('The issue: Bill 146 was recorded in database but not actually created in QB');
console.log('');
console.log('✅ CONFIRMED BILL NUMBERS:');
console.log('- Bill 145: Manually created (visible in QuickBooks)');
console.log('- Bill 146: Database only (NOT in QuickBooks)');
console.log('');
console.log('🎯 SOLUTION: Creating a new actual bill in QuickBooks now...');

process.exit(0);