# END-TO-END UI TESTING WORKFLOW GUIDE

## Complete Workflow: From Timesheets to QuickBooks Bills

### Phase 1: Timesheet Entry ✅
**Status**: Fresh timesheet data loaded (July-December 2025)
- All employees have realistic timesheet entries
- 15-25 entries per month per employee
- Ready for payroll generation

### Phase 2: Generate Monthly Payroll 📋
**UI Steps to Follow**:

1. **Login as Admin**
   - Username: `admin`  
   - Password: `admin123`

2. **Navigate to Admin Dashboard**
   - Click "Reports" or "Admin Panel"
   - Look for "Monthly Payroll" or "Generate Payroll" section

3. **Generate Payroll for July 2025**
   - Select Month: July
   - Select Year: 2025
   - Click "Generate Monthly Payroll" button
   - System will calculate total hours and gross pay for each employee

4. **Verify Payroll Data**
   - Check that payroll records show correct hours and amounts
   - Verify all employees have payroll entries for July

### Phase 3: Sync Contractors to QuickBooks 🔄
**UI Steps**:

1. **QuickBooks Integration Section**
   - Look for "QuickBooks" tab or section
   - Click "Sync Contractors" or "Create Vendors"

2. **Create QuickBooks Vendors**
   - System will create vendor accounts for each employee in QB
   - Wait for confirmation that all vendors are created
   - Note the vendor IDs assigned

### Phase 4: Create QuickBooks Bills 💰
**UI Steps**:

1. **Generate Bills Section**  
   - Look for "Create Payroll Bills" or "Generate QB Bills"
   - Select Month: July, Year: 2025

2. **Create Bills**
   - Click "Create QuickBooks Bills" 
   - System will create individual bills for each employee
   - Bills will use:
     - ✅ Payroll period end date (July 31, 2025)
     - ✅ "Wages" category
     - ✅ Individual vendor mapping
     - ✅ Format: "July 2025 - Employee Name Payroll"

3. **Verify in QuickBooks**
   - Log into QuickBooks Sandbox
   - Check Bills section
   - Verify each employee has their own bill
   - Confirm dates show July 31, 2025 (not creation date)

### Phase 5: Repeat for Other Months 🔁
**Test August-December**:

1. Repeat Phase 2-4 for each month:
   - August 2025
   - September 2025  
   - October 2025
   - November 2025
   - December 2025

2. **Verification Checklist per Month**:
   - ✅ Payroll generated with correct totals
   - ✅ Each employee has individual QuickBooks vendor
   - ✅ Bills created with correct dates (month-end)
   - ✅ Bills use "Wages" category
   - ✅ Bills tracked in database

### Expected Results 📊

**After Complete Testing**:
- **36 payroll records** (6 employees × 6 months)
- **36 QuickBooks bills** (one per employee per month)
- **6 QuickBooks vendors** (one per employee)
- **Bills dated**: July 31, Aug 31, Sep 30, Oct 31, Nov 30, Dec 31
- **Categories**: All using "Wages" account

### UI Buttons to Look For 🔍

In the admin interface, look for these buttons/sections:
- **"Generate Monthly Payroll"**
- **"Sync Contractors to QuickBooks"** 
- **"Create Payroll Bills"**
- **"QuickBooks Integration"**
- **Reports → Monthly Payroll**

### Troubleshooting 🔧

If buttons are missing, check:
1. Logged in as admin user
2. QuickBooks connection is active  
3. Server is running properly
4. Check browser console for errors

### What to Watch in QuickBooks 👀

1. **Vendors Section**: Each employee should appear as individual vendor
2. **Bills Section**: Individual bills per employee per month
3. **Bill Dates**: Should show month-end dates, not creation dates
4. **Categories**: Should use "Wages" or proper expense account
5. **Amounts**: Should match calculated payroll amounts

This workflow will demonstrate the complete end-to-end process from timesheet entry to QuickBooks bill creation!