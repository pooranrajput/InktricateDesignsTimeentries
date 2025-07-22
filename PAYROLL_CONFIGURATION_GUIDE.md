# Payroll Bill Configuration Guide

## Updated Bill Creation Format

Your payroll bill creation system has been updated with the following improvements:

### ✅ Description Format
Bills now use the standardized format:
**"Month Year - Employee Name Payroll"**

Examples:
- "August 2025 - Pooran Rajput Payroll"
- "September 2025 - Alysha Patel Payroll" 
- "October 2025 - Rhea Patel Payroll"

### ✅ Account Category
Bills are now created under the **"Wages"** category by default.

### 🔧 Production Configuration

To change the account category for production:

1. **Environment Variable Method:**
   Set `QB_PAYROLL_ACCOUNT` environment variable:
   ```
   QB_PAYROLL_ACCOUNT="Your Production Account Name"
   ```

2. **Examples for Production:**
   - `QB_PAYROLL_ACCOUNT="Payroll Expenses"`
   - `QB_PAYROLL_ACCOUNT="Contractor Payments"`
   - `QB_PAYROLL_ACCOUNT="Wages"`

3. **Fallback Behavior:**
   If the specified account isn't found, the system will:
   - Search for any expense account
   - Use the first available expense account
   - Log which account is being used

### 📊 Current System Status

- **Sandbox**: Using "Wages" account
- **Description**: Proper "Month Year - Name Payroll" format
- **Vendor IDs**: All contractors stored and optimized
- **Ready for Production**: Just update the account name variable

### 🎯 Next Steps for Production

1. Identify the correct account name in your production QuickBooks
2. Set the `QB_PAYROLL_ACCOUNT` environment variable 
3. Test with one payroll bill to verify the account category
4. Process all pending payroll records

The system maintains all optimization benefits while using your preferred account structure.