# QuickBooks Advanced Troubleshooting

## Current Status

### Environment Verification ✅
- Client ID environment variable: 50 characters (correct)
- Client ID content: Matches QuickBooks Developer Dashboard exactly
- Client Secret: Present
- Sandbox mode: false (production)
- URLs: All using production domain

### Persistent Issue ❌
- Still getting "invalid_client" error during token exchange
- Server logs show clientIdLength: 48 vs actual 50
- Suggests environment loading issue in service context

## Potential Root Causes

### 1. Environment Variable Loading Timing
- Service may be reading environment before production overrides are applied
- `.env.production` may not be fully loaded when service initializes
- Character encoding or trimming issues

### 2. Credential Validation by QuickBooks
- QuickBooks may validate Client ID against registered redirect URIs
- App may need re-verification after URL changes
- Production vs Sandbox credential mismatch

### 3. OAuth Flow Issues
- Authorization code may be tied to different Client ID
- Time-sensitive token exchange
- Company ID mismatch (sandbox vs production)

## Next Steps

1. **Verify Full Environment Loading**: Check if production environment is fully loaded in service context
2. **Test Direct Token Exchange**: Use curl to test QuickBooks token endpoint directly
3. **Validate App Configuration**: Ensure QuickBooks app settings match exactly
4. **Consider Sandbox Testing**: Test with sandbox credentials to isolate credential vs environment issues

## Current Debugging Focus

The system correctly loads the production Client ID in shell context but shows different length in service context, suggesting an environment loading race condition.