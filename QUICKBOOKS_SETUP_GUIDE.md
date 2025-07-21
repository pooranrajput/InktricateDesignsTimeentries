# QuickBooks Integration Setup Guide

## Step 1: Create QuickBooks Developer Account

1. Go to **https://developer.intuit.com**
2. Click "Get started" or "Sign in" 
3. Use your existing QuickBooks/Intuit account or create a new one
4. Accept the developer terms and conditions

## Step 2: Create a New App

1. Once logged in, click **"Create an app"**
2. Choose **"QuickBooks Online Accounting API"**
3. Fill out the app details:
   - **App name**: "Inktricate Time Tracking" (or any name you prefer)
   - **Description**: "Time tracking and contractor billing integration"
   - **Category**: Select "Productivity" or "Business Management"

## Step 3: Get Your App Credentials

After creating the app, you'll see your **App Dashboard**:

### Required Information:

**QUICKBOOKS_CLIENT_ID**: 
- Found under "Keys & OAuth" tab
- Copy the "Client ID" value

**QUICKBOOKS_CLIENT_SECRET**: 
- Found under "Keys & OAuth" tab  
- Copy the "Client Secret" value

**QUICKBOOKS_SANDBOX**: 
- Set to `true` for testing (recommended to start)
- Set to `false` only when ready for production

**QUICKBOOKS_REDIRECT_URI**: 
- Go to "Keys & OAuth" tab
- Under "Redirect URIs", add: `https://your-replit-domain.replit.app/api/quickbooks/callback`
- Replace `your-replit-domain` with your actual Replit domain
- Click "Save"

## Step 4: Configure Scopes

In your app settings, make sure these scopes are enabled:
- ✅ **com.intuit.quickbooks.accounting** (for invoices, vendors, etc.)

## Step 5: Test Environment Setup

1. In the "Sandbox" section, you can create test company data
2. Use sandbox mode first to test the integration
3. Switch to production mode only after everything works

## Important Notes:

- **Sandbox vs Production**: Always test in sandbox first
- **Token Expiration**: Access tokens expire every 60 hours (auto-refreshed)
- **Rate Limits**: 500 API calls per minute
- **Security**: Keep your Client Secret secure and never share it

## What This Integration Will Do:

✅ **Connect your timesheet to QuickBooks Online**
✅ **Create employees as contractors/vendors in QuickBooks** 
✅ **Generate monthly contractor bills automatically**
✅ **Track billable vs non-billable time**
✅ **Sync time entries for accurate billing**
✅ **Handle 1099 contractor reporting**

## Next Steps:

Once you have all four credentials:
1. Add them to your Replit secrets
2. The admin dashboard will show "Connected" status
3. You can start setting up contractors and generating bills

Need help with any of these steps? Let me know!