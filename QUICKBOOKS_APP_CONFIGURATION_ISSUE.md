# QuickBooks App Configuration Issue - Login Page Error

## The Problem
QuickBooks login page is showing an error, which indicates an app configuration mismatch between our OAuth URL and your QuickBooks Developer Dashboard settings.

## Exact Configuration Needed

### In Your QuickBooks Developer Dashboard:

**1. Redirect URI (CRITICAL):**
```
https://inkticate-time-tracker-pooranrajput.replit.app/api/quickbooks/callback
```
This MUST be exactly as shown above in your app's redirect URI settings.

**2. App Environment:**
- Must be set to **Production** (not Sandbox)
- App must be **Active/Enabled**

**3. Client ID Verification:**
- Your dashboard should show Client ID: `AB6HieH2iCWWSQ8jneSCittfIAKuPHIcujzio09raTAQV5EUtA`
- If it doesn't match, we're using the wrong credentials

**4. Scopes/Permissions:**
- **Accounting** scope must be enabled
- App must have accounting permissions

## Troubleshooting Steps

### Step 1: Check Redirect URI
1. Go to QuickBooks Developer Dashboard
2. Select your app
3. Go to "Keys & Credentials" or "App Settings"
4. Under "Redirect URIs", ensure this exact URL is listed:
   `https://inkticate-time-tracker-pooranrajput.replit.app/api/quickbooks/callback`

### Step 2: Verify App Status
1. Check app is in **Production** mode (not Development/Sandbox)
2. Verify app status is **Active** (not suspended/disabled)
3. Confirm app has passed any required reviews

### Step 3: Test with Correct Settings
Once the redirect URI is correctly configured in QB dashboard:
1. Try authorization in incognito browser
2. Should reach QuickBooks login successfully
3. Complete login and company selection

## Common Causes of Login Page Errors

1. **Redirect URI mismatch** (most common)
2. **App in wrong environment** (sandbox vs production)
3. **App disabled or suspended**
4. **Client ID doesn't exist** in QuickBooks system
5. **App not approved for production use**

## Next Steps

Please check your QuickBooks Developer Dashboard and verify the redirect URI matches exactly. The login page error will resolve once the configuration is aligned.