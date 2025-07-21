# QuickBooks 1099 Setup Guide

## Overview
After syncing contractors through our time tracking system, you need to complete the 1099 setup process in QuickBooks for the "Track payments for 1099" checkboxes to appear checked.

## Why This Step Is Required
The QuickBooks API correctly sets the `Vendor1099=true` flag for all contractors, but QuickBooks only displays the checkboxes as checked after you complete the 1099 account mapping process. This is a QuickBooks workflow requirement, not a technical limitation.

## Step-by-Step Instructions

### Step 1: Access 1099 Setup
1. Log into your QuickBooks Online account
2. Navigate to **Taxes** in the left sidebar
3. Click **1099 filings** (or go to **Expenses** → **Vendors** → **Prepare 1099s**)

### Step 2: Start the 1099 Setup Wizard
1. Click **Get started** or **Set up 1099 filings**
2. You'll see a multi-step wizard for 1099 preparation

### Step 3: Complete Step 1 - Business Information
1. Review your business information
2. Make sure your Tax ID is correct
3. Click **Continue**

### Step 4: Complete Step 2 - Accounts (CRITICAL STEP)
This is the most important step that enables the contractor checkboxes:

1. You'll see "Map your accounts to 1099 categories"
2. Look for **Box 7: Nonemployee Compensation** section
3. **CRITICAL**: Check the box next to "Box 7: Nonemployee Compensation"
4. Select ALL expense accounts you use to pay contractors, such as:
   - Contractor Payments
   - Professional Services
   - Labor Costs
   - Subcontractor Expense
   - Any other accounts you use for paying independent contractors

### Step 5: Save and Complete
1. After mapping accounts, click **Save & Continue**
2. You can click **Save & Finish Later** - you don't need to complete the actual filing
3. The setup process is now complete

## Verification Steps

### Check Contractor Checkboxes
1. Go to **Expenses** → **Vendors**
2. Click on any contractor you synced
3. You should now see the "Track payments for 1099" checkbox is checked
4. The Tax ID field should also be populated if available

### Run 1099 Reports (Optional)
1. Go to **Reports** → **All Reports**
2. Search for "1099"
3. Run the **1099 Transaction Detail Report**
4. You should see transactions for your contractors (if any payments exist)

## Important Notes

### Sandbox Environment
- Since you're using QuickBooks Sandbox, you can complete this setup for testing
- No actual tax filings will be submitted
- The setup process is identical to production QuickBooks

### Account Mapping Requirements
- You MUST map at least one expense account to Box 7 for contractors to appear properly
- If you haven't made any payments to contractors yet, the reports will be empty (this is normal)
- The checkbox status depends on completing the account mapping, not on having actual payments

### Troubleshooting
- If checkboxes still don't appear checked after setup, refresh your browser
- Make sure you mapped the correct expense accounts in Step 4
- The setup wizard must be completed through "Step 2 - Accounts" at minimum

## Technical Details
- Our API correctly sets `Vendor1099: true` for all synced contractors
- We also set `TaxIdentifier` when available for better 1099 processing
- The QuickBooks UI requires the account mapping to be completed before showing checkboxes
- This is normal QuickBooks behavior, not a bug in our integration

## Next Steps
After completing this setup:
1. All synced contractors will show "Track payments for 1099" as checked
2. Any future payments to these contractors will be tracked for 1099 reporting
3. You can generate 1099 reports at year-end for tax filing