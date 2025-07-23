# QuickBooks Update Instructions - EXACT STEPS

## Step 1: Go to QuickBooks Developer Dashboard

**Click this link:** https://developer.intuit.com

**Sign in** with your QuickBooks account

---

## Step 2: Find Your App

**Click:** "My Apps" (should be visible after signing in)

**Look for your app** with Client ID: `AB6HieH2iCWWSQ8jneSClcttlAKuPHIcujzio09raTAQV5EUtA`

**Click** on your app name

---

## Step 3: Update Redirect URI

**Click:** "Keys & OAuth" (in the left sidebar)

**Scroll down** to find "Redirect URIs" section

**Look for existing URI** (probably shows the old long URL)

**Click "Edit"** next to the existing URI OR **Click "Add URI"** if no URI exists

**Replace with this EXACT text:**
```
https://inkticate-time-tracker-pooranrajput.replit.app/api/quickbooks/callback
```

**Click "Save"**

---

## Step 4: Test the Connection

**Come back here** and I'll give you a fresh authorization link to test

**The authorization should now work** because the URLs will match exactly

---

**Important:** Copy and paste that URL exactly - no extra spaces or characters.

Let me know when you've completed Step 3 (updating the redirect URI).