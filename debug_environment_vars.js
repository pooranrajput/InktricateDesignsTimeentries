// Debug all environment variables that might affect QuickBooks

console.log('🔍 DEBUGGING ALL ENVIRONMENT VARIABLES...');

// Check for any sandbox-related environment variables
console.log('\n=== SANDBOX-RELATED ENVIRONMENT VARIABLES ===');
const sandboxVars = [
  'QUICKBOOKS_SANDBOX',
  'INTUIT_SANDBOX', 
  'QB_SANDBOX',
  'SANDBOX',
  'NODE_ENV',
  'ENVIRONMENT',
  'ENV'
];

sandboxVars.forEach(varName => {
  const value = process.env[varName];
  console.log(`${varName}:`, value || 'NOT SET');
});

// Check QuickBooks-specific variables
console.log('\n=== QUICKBOOKS ENVIRONMENT VARIABLES ===');
Object.keys(process.env)
  .filter(key => key.includes('QUICKBOOKS') || key.includes('INTUIT') || key.includes('QB'))
  .forEach(key => {
    const value = process.env[key];
    if (key.includes('SECRET')) {
      console.log(`${key}:`, value ? `${value.substring(0, 10)}...` : 'NOT SET');
    } else {
      console.log(`${key}:`, value || 'NOT SET');
    }
  });

// Force production settings
console.log('\n=== FORCING PRODUCTION SETTINGS ===');
process.env.QUICKBOOKS_SANDBOX = 'false';
delete process.env.INTUIT_SANDBOX;
delete process.env.QB_SANDBOX;

console.log('QUICKBOOKS_SANDBOX after force:', process.env.QUICKBOOKS_SANDBOX);
console.log('INTUIT_SANDBOX after delete:', process.env.INTUIT_SANDBOX || 'DELETED');
console.log('QB_SANDBOX after delete:', process.env.QB_SANDBOX || 'DELETED');

console.log('\n=== PRODUCTION CONFIRMATION ===');
console.log('All sandbox variables cleared');
console.log('Production mode enforced');