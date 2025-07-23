# Step-by-Step QuickBooks Fix Instructions

## Step 1: Find Your App's Real URL

**Action:** Look at your browser address bar right now while you're using the app.

**What to look for:** The URL should look something like:
- `https://something-something-replit.dev` 
- Copy this EXACT URL (everything before any `/` after the domain)

**Example:** If you see `https://xyz123-replit.dev/dashboard`, copy just `https://xyz123-replit.dev`

---

## Step 2: Update QuickBooks App Settings

**Action:** Go to https://developer.intuit.com

**Steps:**
1. Click "Sign In" (top right)
2. Sign in with your QuickBooks account
3. Click "My Apps" 
4. Find your app (should show the Client ID: AB6HieH2iCWWSQ8jneSClcttlAKuPHIcujzio09raTAQV5EUtA)
5. Click on your app name
6. Click "Keys & OAuth" (left sidebar)
7. Scroll down to "Redirect URIs"
8. Click "Add URI" or edit existing URI
9. Enter: `[YOUR_REAL_URL]/api/quickbooks/callback`
   - Replace [YOUR_REAL_URL] with what you copied in Step 1
   - Example: `https://xyz123-replit.dev/api/quickbooks/callback`
10. Click "Save"

---

## Step 3: Tell Me Your Real URL

**Action:** Reply with the exact URL you copied from Step 1

**Format:** Just paste the URL like: `https://your-real-url.replit.dev`

**I will then:** Update our system to match your real URL

---

## Why This Fixes It

QuickBooks is very strict - the redirect URL in their system must match exactly where your app is actually running. Right now there's a mismatch causing the authentication to fail.

**Next:** Please do Step 1 first and tell me your real URL.