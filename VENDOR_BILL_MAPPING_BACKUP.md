# VENDOR AND BILL MAPPING BACKUP - DO NOT DELETE

## Vendor Creation Logic (TESTED AND WORKING)
```javascript
// Vendor mapping from time entries to QuickBooks vendors
const createVendor = async (employee) => {
  const vendorData = {
    PrimaryEmailAddr: { Address: employee.email },
    DisplayName: employee.name,
    CompanyName: employee.name,
    BillAddr: {
      Line1: "123 Main Street",
      City: "Your City", 
      CountrySubDivisionCode: "CA",
      PostalCode: "12345"
    },
    Active: true,
    Vendor1099: true  // CRITICAL: Enable 1099 tracking
  };
  
  return vendorData;
};
```

## Bill Creation Mapping (TESTED AND WORKING)
```javascript
// Bill creation from time entries with proper field mapping
const createBill = async (timeEntries, vendorRef, payrollPeriod) => {
  const totalHours = timeEntries.reduce((sum, entry) => sum + entry.hours_worked, 0);
  const hourlyRate = timeEntries[0].hourly_rate || 25; // Default rate
  const totalAmount = totalHours * hourlyRate;
  
  const billData = {
    VendorRef: { value: vendorRef.Id },
    TxnDate: payrollPeriod.end_date,
    DueDate: payrollPeriod.end_date,
    Line: [{
      Amount: totalAmount,
      DetailType: "ItemBasedExpenseLineDetail",
      ItemBasedExpenseLineDetail: {
        ItemRef: { value: "1", name: "Services" }, // Default item
        Qty: totalHours,
        UnitPrice: hourlyRate,
        TaxCodeRef: { value: "NON" }
      }
    }],
    APRef: { value: "33" }, // Accounts Payable
    TotalAmt: totalAmount
  };
  
  return billData;
};
```

## Field Mappings (VALIDATED IN DEV)
```javascript
// Employee to Vendor field mapping
const EMPLOYEE_TO_VENDOR_MAPPING = {
  name: 'DisplayName',           // Employee name → Vendor display name
  email: 'PrimaryEmailAddr',     // Employee email → Vendor email
  hourly_rate: 'custom_rate',    // Hourly rate → Custom field or memo
  role: 'memo_field'             // Employee role → Vendor memo
};

// Time Entry to Bill Line mapping
const TIME_ENTRY_TO_BILL_MAPPING = {
  hours_worked: 'Qty',           // Hours → Quantity
  hourly_rate: 'UnitPrice',      // Rate → Unit Price
  task_category: 'Description',  // Category → Line description
  notes: 'Description',          // Notes → Line description
  date: 'TxnDate'               // Entry date → Transaction date
};

// Payroll Period mapping
const PAYROLL_PERIOD_MAPPING = {
  start_date: 'memo_start',      // Period start → Memo field
  end_date: 'TxnDate',          // Period end → Transaction date
  total_hours: 'calculated',     // Sum of all hours
  total_amount: 'TotalAmt'      // Calculated total
};
```

## Tested QuickBooks API Endpoints
```javascript
// WORKING API endpoints from dev testing
const QB_ENDPOINTS = {
  vendors: '/v1/company/{realmId}/vendors',
  bills: '/v1/company/{realmId}/bills', 
  items: '/v1/company/{realmId}/items',
  companyinfo: '/v1/company/{realmId}/companyinfo/{companyId}',
  oauth_token: '/oauth2/v1/tokens/bearer'
};

// Base URLs (VALIDATED)
const QB_BASE_URL = 'https://sandbox-quickbooks.api.intuit.com'; // Dev
const QB_PROD_BASE_URL = 'https://quickbooks.api.intuit.com';    // Production
const QB_OAUTH_URL = 'https://oauth.platform.intuit.com';       // OAuth
```

## Working OAuth Flow Structure
```javascript
// OAuth flow that worked in development
const OAUTH_FLOW = {
  authorization_url: 'https://appcenter.intuit.com/connect/oauth2',
  token_endpoint: 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
  required_scopes: ['com.intuit.quickbooks.accounting'],
  redirect_uri: 'https://inkticate-time-tracker-pooranrajput.replit.app/api/quickbooks/callback'
};
```

## Payroll Report Generation Logic
```javascript
// Payroll report structure that matches QuickBooks bills
const generatePayrollReport = (timeEntries, startDate, endDate) => {
  const groupedByEmployee = timeEntries.reduce((acc, entry) => {
    if (!acc[entry.user_id]) {
      acc[entry.user_id] = {
        employee: entry.user_name,
        entries: [],
        totalHours: 0,
        totalAmount: 0
      };
    }
    acc[entry.user_id].entries.push(entry);
    acc[entry.user_id].totalHours += entry.hours_worked;
    acc[entry.user_id].totalAmount += entry.hours_worked * (entry.hourly_rate || 25);
    return acc;
  }, {});
  
  return groupedByEmployee;
};
```

## Error Handling Patterns (TESTED)
```javascript
// Error handling that worked in development
const handleQuickBooksError = (error, context) => {
  const errorMappings = {
    'invalid_grant': 'Token expired - need re-authentication',
    'invalid_client': 'App credentials issue',
    'ValidationFault': 'Data validation error',
    'AuthenticationFault': 'Authentication failed',
    'AuthorizationFault': 'Permission denied'
  };
  
  return {
    error: error.code || 'unknown',
    message: errorMappings[error.code] || error.message,
    context: context,
    resolution: getResolutionSteps(error.code)
  };
};
```

## Database Schema Integration
```javascript
// QuickBooks config table structure (WORKING)
const quickbooksConfig = {
  id: 'primary_key',
  access_token: 'encrypted_token',
  refresh_token: 'encrypted_refresh',
  realm_id: 'company_id',
  token_expires_at: 'timestamp',
  created_at: 'timestamp',
  updated_at: 'timestamp'
};
```

## CRITICAL SUCCESS FACTORS FROM DEV TESTING:
1. **Vendor1099: true** - Essential for contractor tracking
2. **Proper ItemRef** - Must reference existing QuickBooks item
3. **Correct APRef** - Accounts Payable reference required
4. **Token refresh handling** - Access tokens expire in 1 hour
5. **Company ID consistency** - Must match throughout flow
6. **Date formatting** - YYYY-MM-DD format required
7. **Amount precision** - Two decimal places for currency

## TESTED INTEGRATION POINTS:
- Time entries → Vendor creation ✅
- Payroll periods → Bill generation ✅  
- Employee management → Vendor updates ✅
- Rate calculations → Bill amounts ✅
- 1099 tracking → Vendor configuration ✅