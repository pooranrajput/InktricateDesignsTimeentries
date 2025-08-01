# MANUAL QUICKBOOKS SETUP - FINAL SOLUTION

## Problem: No Redirect URIs Configured
Your QuickBooks app has no redirect URIs configured in the Intuit Developer Portal, causing all OAuth attempts to fail with "redirect_uri query parameter value is invalid" error.

## IMMEDIATE SOLUTION: Manual Token Generation

### Step 1: Access QuickBooks Developer Portal
1. Go to: https://developer.intuit.com/
2. Sign in with your QuickBooks developer account
3. Navigate to your app (Client ID: AB6HieH2iC...)

### Step 2: Use Built-in OAuth Playground
1. Look for **"Test connect to app (OAuth)"** link in your app dashboard
2. Click it to open the OAuth 2.0 Playground
3. This playground has pre-configured redirect URIs that work automatically

### Step 3: Generate Tokens
1. In the playground:
   - Select scope: `com.intuit.quickbooks.accounting`
   - Click **"Get Authorization Code"**
   - Click **"Get tokens"**
2. Copy both:
   - `access_token` (valid for 1 hour)
   - `refresh_token` (valid for 101 days)

### Step 4: Provide Tokens
Give me these three pieces of information:
1. **Access Token**: `eyJlbmMiOiJBMTI4Q0JDLUhTMjU2Iiwia2lkIjoi...` (long string)
2. **Refresh Token**: `Q01162xxxxxxxxxxxxxxxxxxxxxxxxxx...` (long string)  
3. **Company ID**: `9130351530529746` (should be this)

### Step 5: I'll Store Tokens Immediately
Once you provide the tokens, I'll:
1. Store them securely in your database
2. Test the QuickBooks connection
3. Enable payroll bill creation
4. Your integration will be live in under 2 minutes

## Alternative: Fix Redirect URI Configuration
If the playground doesn't work, you can add this exact URL to your app's redirect URIs:
```
https://inkticate-time-tracker-pooranrajput.replit.app/api/quickbooks/callback
```

**This manual method bypasses all OAuth redirect issues and will work immediately.**