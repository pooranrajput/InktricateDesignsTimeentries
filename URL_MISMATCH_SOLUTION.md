# QuickBooks Redirect URI Mismatch - SOLUTION REQUIRED

## The Problem
You're getting connection errors when clicking the authorization URL. This is almost certainly because the redirect URI configured in your QuickBooks app doesn't match what our system is using.

## Current System Configuration
- **Our Redirect URI:** `https://inkticate-time-tracker-pooranrajput.replit.app/api/quickbooks/callback`
- **Client ID:** `AB6HieH2iCWWSQ8jneSClcttlAKuPHIcujzio09raTAQV5EUtA`

## REQUIRED ACTION: Update QuickBooks App Configuration

You need to log into the QuickBooks Developer Dashboard and update the redirect URI:

### Steps:
1. **Go to:** https://developer.intuit.com/
2. **Sign in** with your QuickBooks developer account
3. **Find your app** (the one with Client ID: AB6HieH2iC...)
4. **Go to** "App Settings" or "Keys & OAuth"
5. **Update Redirect URI to:** 
   ```
   https://inkticate-time-tracker-pooranrajput.replit.app/api/quickbooks/callback
   ```
6. **Save** the changes

## Alternative Quick Fix
If you want to test immediately, tell me what redirect URI is currently configured in your QuickBooks app, and I can temporarily update our system to match it.

## Common Redirect URI Patterns
Check if your app is configured with one of these:
- `https://inkticate-time-tracker-pooranrajput.replit.app/callback`
- `https://inkticate-time-tracker-pooranrajput.replit.app/auth/callback`
- `https://inkticate-time-tracker-pooranrajput.replit.app/oauth/callback`

## Why This Happens
QuickBooks requires exact matching between:
- The redirect URI in the authorization URL
- The redirect URI configured in the QuickBooks app dashboard

Even a small difference (like missing `/api/` or different path) will cause the connection to fail.

**This is a one-time setup issue that needs to be fixed in the QuickBooks app configuration.**