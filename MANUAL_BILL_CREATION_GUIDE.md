# Manual QuickBooks Bill Creation Guide

## Creating a Bill for Contractor Payment - Step by Step

Based on your QuickBooks screenshot, here's how to manually create a bill for your $60 contractor payment:

### Step 1: Navigate to Bills
1. Go to QuickBooks sandbox
2. Click "Expenses" in left menu
3. Click "Bills" 
4. Click "New Bill" or "Create"

### Step 2: Fill Bill Form
**Vendor Section:**
- **Vendor**: Choose "Pooran Rajput" (if exists) or create new vendor
  - If creating new: Name = "Pooran Rajput", Email = "pooran.rajput@gmail.com"
  - Check "Track payments for 1099" if setting up as contractor

**Bill Details:**
- **Terms**: Net 30 (default)
- **Bill date**: 07/21/2025 (today's date)
- **Due date**: 08/20/2025 (30 days from bill date)
- **Bill no.**: Leave blank (auto-generated)

### Step 3: Category Details (Line Items)
In the category details section:
- **Row 1:**
  - **Category**: "Professional Services" or "Contractors" 
  - **Description**: "July 2025 contractor payment - 4 hours wedding-invites project"
  - **Amount**: $60.00
  - **Billable**: Leave unchecked (this is an expense, not billable to customer)
  - **Tax**: Leave blank
  - **Customer**: Leave blank

### Step 4: Item Details
- **Memo**: "Contractor payment for time tracking - July 2025"
- **Attachments**: None needed

### Step 5: Save and Verify
1. Click "Save and Close"
2. Verify the bill appears in your Bills list
3. Check total shows $60.00

## Expected Result
After saving, you should see:
- New bill in Bills list
- Vendor "Pooran Rajput" created/updated
- Balance due of $60.00
- Expense recorded in "Professional Services" category

## Next Steps for API Debug
Once manual creation works, we'll compare the structure with our API calls to identify the exact issue.

## Current API Debug Status
- QuickBooks connection: ✅ Working
- Vendor sync: ✅ Working (6 contractors synced)
- Bill creation: ❌ Needs debugging

The API may be failing due to:
1. Account reference issues
2. Required fields missing
3. Date format problems
4. Vendor reference structure