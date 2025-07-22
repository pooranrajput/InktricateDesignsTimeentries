# Manual Vendor Creation & Bill Mapping Fix Guide

## Issue Identified ✅
- All 34 bills (IDs 153-186) were incorrectly created under Pooran Rajput's vendor ID (65)
- Each employee needs their own vendor in QuickBooks for proper contractor tracking
- QuickBooks sandbox API is rejecting automated vendor creation attempts

## Current Status:
- **Pooran Rajput**: Has vendor ID 65 and 6 correct bills (147-152) ✅
- **Other 5 employees**: No vendor IDs, bills incorrectly mapped to Pooran ❌

## Solution: Manual Vendor Creation Required

### Step 1: Create Vendors Manually in QuickBooks
You'll need to log into your QuickBooks sandbox and manually create vendors for:

1. **Alysha Mahagaonkar**
   - Email: alyshamaha@gmail.com
   - Needed for: 7 bills totaling $12,164.75

2. **Anjali Patel** 
   - Email: anjalipatel0074@gmail.com
   - Needed for: 7 bills totaling $7,318.84

3. **Madhuri McCartney**
   - Email: madhuri.mccartney@gmail.com
   - Needed for: 7 bills totaling $7,528.28

4. **Rhea Doshi**
   - Email: rheadoshi94@gmail.com
   - Needed for: 7 bills totaling $13,171.00

5. **Yesha Patel**
   - Email: Yeshap031@gmail.com
   - Needed for: 6 bills totaling $6,795.30

### Step 2: Manual Vendor Creation Process
In QuickBooks sandbox:
1. Go to Expenses → Vendors
2. Click "New Vendor"
3. Enter:
   - **Display Name**: Full employee name (e.g., "Alysha Mahagaonkar")
   - **Company**: Full employee name
   - **Email**: Employee email address
   - **Vendor Type**: Contractor (if available)
4. Save vendor
5. Note the Vendor ID assigned

### Step 3: Update Our Database
Once you create vendors, run this command to update our database with vendor IDs:

```sql
-- Update with actual vendor IDs from QuickBooks
UPDATE users SET quickbooks_vendor_id = 'NEW_VENDOR_ID_1' WHERE first_name = 'Alysha' AND last_name = 'Mahagaonkar';
UPDATE users SET quickbooks_vendor_id = 'NEW_VENDOR_ID_2' WHERE first_name = 'Anjali' AND last_name = 'Patel';
UPDATE users SET quickbooks_vendor_id = 'NEW_VENDOR_ID_3' WHERE first_name = 'Madhuri' AND last_name = 'McCartney';
UPDATE users SET quickbooks_vendor_id = 'NEW_VENDOR_ID_4' WHERE first_name = 'Rhea' AND last_name = 'Doshi';
UPDATE users SET quickbooks_vendor_id = 'NEW_VENDOR_ID_5' WHERE first_name = 'Yesha' AND last_name = 'Patel';
```

### Step 4: Automated Bill Creation
Once vendors are created and database is updated, I can run the automated script to:
1. Clear incorrect bill mappings (bills 153-186)
2. Create new bills with correct vendor assignments
3. Update database with proper bill tracking

## Expected Result
- **40 total bills** properly mapped to individual vendors
- **Complete audit trail** for each contractor's payments
- **Proper 1099 tracking** capability for each vendor

## Alternative Quick Fix
If manual vendor creation is too time-consuming, we could:
1. Delete the incorrectly mapped bills (153-186) from QuickBooks
2. Keep only Pooran's 6 correct bills (147-152)
3. Demonstrate the workflow with Pooran's data as proof of concept

Would you like me to proceed with either approach?