// Direct QuickBooks bill creation bypassing the query issue
import QuickBooks from 'node-quickbooks';

// Use hardcoded Professional Services account ID from successful manual bill
const ACCOUNT_ID = '81'; // Professional Services account from manual bill 145
const VENDOR_ID = '65'; // Pooran Rajput vendor ID

async function createDirectBill() {
  console.log('🚀 CREATING DIRECT BILL WITH KNOWN IDS');
  
  // Load QB credentials from environment
  const consumerKey = process.env.QB_CLIENT_ID;
  const consumerSecret = process.env.QB_CLIENT_SECRET;
  const token = process.env.QB_ACCESS_TOKEN;
  const tokenSecret = process.env.QB_TOKEN_SECRET;
  const companyId = process.env.QB_COMPANY_ID;
  const sandbox = process.env.QB_SANDBOX === 'true';
  
  if (!consumerKey || !token || !companyId) {
    console.log('❌ Missing QB credentials');
    return;
  }
  
  const qbo = new QuickBooks(
    consumerKey,
    consumerSecret,
    token,
    tokenSecret,
    companyId,
    sandbox,
    true, // debug
    null, // minorversion
    '2.0', // version
    token // realmId
  );
  
  // Create bill with known working IDs
  const bill = {
    VendorRef: { value: VENDOR_ID },
    TotalAmt: 75.00,
    Line: [{
      Amount: 75.00,
      Description: "August 2025 - Pooran Rajput Payroll",
      DetailType: "AccountBasedExpenseLineDetail",
      AccountBasedExpenseLineDetail: {
        AccountRef: { value: ACCOUNT_ID }
      }
    }]
  };
  
  console.log('💰 Creating bill with known IDs...');
  console.log('Bill object:', JSON.stringify(bill, null, 2));
  
  qbo.createBill(bill, function(err, createdBill) {
    if (err) {
      console.log('❌ Error:', err);
    } else {
      console.log('✅ SUCCESS! Bill created:', createdBill);
      console.log('Bill ID:', createdBill.Id);
      console.log('Amount:', createdBill.TotalAmt);
    }
  });
}

createDirectBill();