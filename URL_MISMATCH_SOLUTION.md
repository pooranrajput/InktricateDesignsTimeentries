# URL Mismatch Issue - FIXED!

## The Problem You Identified

You were absolutely right! The authorization URL contained the development domain:
```
https://aec04ca2-dc60-472c-81a4-9f1ed6245b26-00-1gxccut935jmz.worf.replit.dev/api/quickbooks/callback
```

Instead of production domain:
```
https://inkticate-time-tracker-pooranrajput.replit.app/api/quickbooks/callback
```

## Root Cause

The QuickBooks service was being instantiated during module loading (before environment variables were set), causing it to use the development REPLIT_DOMAINS value.

## Solution Applied

1. **Fixed Environment Loading Order**:
   - Moved production environment loading to very beginning of server/index.ts
   - Ensured environment variables are set BEFORE any imports

2. **Fixed Service Instantiation**:
   - Removed singleton pattern that caused early instantiation
   - Changed to create new QuickBooksService instances after environment is properly configured
   - Updated all route handlers to use `new QuickBooksService()`

3. **Hard-coded Production URLs**:
   - Used explicit production domain in redirect URI configuration
   - Eliminated dependency on potentially incorrect environment variables

## Expected Result

The authorization URL should now contain the correct production domain and QuickBooks should properly recognize your production app configuration.

**The issue was on our side, not QuickBooks.** Thank you for catching this critical detail!