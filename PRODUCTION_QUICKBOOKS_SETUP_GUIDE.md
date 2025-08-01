# Production QuickBooks Setup Guide

## System Configuration

I've switched the system back to production mode for your real business QuickBooks account:

- QUICKBOOKS_SANDBOX=false (production mode)
- Production app credentials active
- All URL configurations optimized for production

## Authorization URL for Production

Use this URL to connect to your real business QuickBooks account:

```
https://appcenter.intuit.com/connect/oauth2?client_id=AB6HieH2iCWWSQ8jneSClcttlAKuPHIcujzio09raTAQV5EUtA&scope=com.intuit.quickbooks.accounting&redirect_uri=https%3A%2F%2Finkticate-time-tracker-pooranrajput.replit.app%2Fapi%2Fquickbooks%2Fcallback&response_type=code&state=timetracking-production
```

## Critical: Company Selection

When QuickBooks shows company options:

**✅ SELECT:**
- Your actual business QuickBooks company
- The account with your real business data
- Your live operational QuickBooks account

**❌ AVOID:**
- Demo companies
- Sandbox accounts
- Sample data companies

## Expected Workflow

1. Click authorization URL
2. Sign in to QuickBooks
3. Select your real business company
4. Grant permissions
5. Successful redirect to production app
6. QuickBooks integration ready for contractor bill creation

## Post-Connection Features

Once connected, you can:
- Sync employees as QuickBooks vendors
- Generate payroll bills for contractors
- Track 1099 payments automatically
- Complete end-to-end payroll workflow

The system is fully configured for production use with your real business data.