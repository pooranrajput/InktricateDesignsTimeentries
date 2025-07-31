# QuickBooks App Setup Guide - Fresh Start

## Create New QuickBooks Application

### Step 1: Go to QuickBooks Developer Dashboard
1. Visit: https://developer.intuit.com/
2. Sign in with your Intuit account
3. Click "Create an app" or "My Apps" → "Create new app"

### Step 2: App Configuration
**Choose these settings:**
- **Platform**: QuickBooks Online and Payments
- **App Name**: `Inktricate Time Tracker` (or your preferred name)
- **Description**: `Time tracking and contractor bill automation for wedding industry`
- **Category**: Business Management or Accounting

### Step 3: Production Configuration
**Critical Settings (Copy exactly):**
- **Redirect URI**: `https://inkticate-time-tracker-pooranrajput.replit.app/api/quickbooks/callback`
- **Environment**: **Production** (NOT Sandbox)
- **Scopes**: Select "Accounting" permissions

### Step 4: Get New Credentials
Once created, you'll get:
- **Client ID** (50 characters starting with letters)
- **Client Secret** (40 characters)

### Step 5: Update Our Application
I'll update the environment variables with your new credentials once you provide them.

## Why This Will Fix the Issue

The current OAuth error suggests the authorization codes are being generated for a different app configuration. A fresh app will:
1. Ensure clean production environment
2. Eliminate any historical configuration conflicts
3. Provide credentials that match your exact QuickBooks company
4. Reset any cached OAuth state

## Next Steps
1. Create the app using the settings above
2. Provide the new Client ID and Client Secret
3. I'll update our application to use the new credentials
4. Test the OAuth flow with fresh configuration

This approach eliminates all variables and gives us a known-good starting point.