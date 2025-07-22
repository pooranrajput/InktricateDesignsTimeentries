# Production QuickBooks Integration Setup Guide

## Overview
The QuickBooks integration code has been deployed to production, but it's currently configured for sandbox/development. You need to set up the production QuickBooks connection with your real company's QuickBooks Online account.

## Prerequisites
✅ Time tracking application deployed to production  
✅ QuickBooks Online subscription (Plus or higher recommended)  
✅ Admin access to your company's QuickBooks Online account  
❌ Production QuickBooks app credentials (need to obtain)  
❌ Production OAuth tokens (will generate during setup)  

## Step 1: Create Production QuickBooks App

1. **Go to QuickBooks Developer Console**
   - Visit: https://developer.intuit.com/
   - Sign in with your Intuit account (same as QuickBooks account)

2. **Create New App**
   - Click "Create an app"
   - Choose "QuickBooks Online Accounting"
   - App Name: "Inktricate Designs Time Tracker"
   - Description: "Time tracking and payroll management for Inktricate Designs"

3. **Configure App Settings**
   - **Redirect URI**: `https://[YOUR-PRODUCTION-URL]/api/quickbooks/callback`
   - **Scope**: Accounting
   - **Development vs Production**: Switch to PRODUCTION mode

4. **Get Production Credentials**
   - Copy the **Client ID** (production)
   - Copy the **Client Secret** (production)
   - Save these securely

## Step 2: Update Production Environment Variables

In your production Replit environment, set these variables:

```bash
QUICKBOOKS_CLIENT_ID=your_production_client_id
QUICKBOOKS_CLIENT_SECRET=your_production_client_secret
QUICKBOOKS_SANDBOX=false
QUICKBOOKS_REDIRECT_URI=https://your-production-url/api/quickbooks/callback
```

## Step 3: Connect to Your Real QuickBooks Company

1. **Access Production Admin Dashboard**
   - Log into your production app: admin / 11111111
   - Go to QuickBooks Integration section

2. **Connect to QuickBooks**
   - Click "Connect to QuickBooks"
   - You'll be redirected to QuickBooks Online
   - Sign in with your company's QuickBooks account
   - Authorize the app to access your company data

3. **Verify Connection**
   - Should see your real company name instead of "Sandbox Company"
   - Test connection should show your actual company info

## Step 4: Sync Your Real Employees as Vendors

1. **In Production Admin Dashboard**
   - Go to QuickBooks Integration
   - Click "Sync Contractors to QuickBooks"
   - This creates vendor records for each employee in your real QB

2. **Verify in QuickBooks Online**
   - Go to Expenses > Vendors
   - Should see your employees listed as vendors
   - Each should be marked for 1099 tracking

## Step 5: Test Payroll Bill Creation

1. **Generate Test Payroll**
   - In admin dashboard, generate payroll for a test period
   - Click "Create QuickBooks Bills" for a small test amount

2. **Verify in QuickBooks Online**
   - Go to Expenses > Bills
   - Should see bills created for your employees
   - Bills should be categorized as "Wages" or appropriate payroll account

## Step 6: Configure Chart of Accounts (If Needed)

Your QuickBooks should have these accounts for proper payroll tracking:
- **Wages** (Expense account for contractor payments)
- **Payroll Liabilities** (if applicable)
- **1099 Contractors** (for tax reporting)

## Security Notes

⚠️ **Important Security Considerations:**
- Never share your production Client ID/Secret
- Production tokens have access to real financial data
- Test with small amounts first
- Keep backup of your QuickBooks data
- Monitor all transactions created by the app

## Troubleshooting

**"Connection Failed"**
- Check environment variables are set correctly
- Verify redirect URI matches exactly
- Ensure QuickBooks app is in production mode

**"No Accounts Found"**
- Your QuickBooks may need expense accounts set up
- Contact your accountant to configure proper chart of accounts

**"Vendor Creation Failed"**
- Check employee data has required fields (name, email)
- Ensure QuickBooks subscription supports vendor features

## Final Verification Checklist

Before going live:
- [ ] Connected to real QuickBooks company (not sandbox)
- [ ] All employees synced as vendors with 1099 tracking
- [ ] Test bill created successfully
- [ ] Bills appear in correct expense category
- [ ] Company financial data is accurate
- [ ] Backup of QuickBooks data taken

## Support

If you encounter issues:
1. Check the QuickBooks Integration status in admin dashboard
2. Verify all environment variables are correct
3. Test connection shows your real company name
4. Contact Intuit support for QuickBooks-specific issues

---

**Next Steps After Setup:**
- Train employees on time entry system
- Set up regular payroll processing schedule
- Configure 1099 reporting for tax season
- Monitor QuickBooks integration for accuracy