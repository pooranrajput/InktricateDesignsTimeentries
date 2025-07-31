# QuickBooks Fresh Start Implementation Plan

## Phase 1: Backup and Preserve Critical Work ✅
- Vendor mapping logic saved
- Bill creation fields preserved  
- Field mappings documented
- API endpoint structures backed up

## Phase 2: Clean Slate QuickBooks Integration

### Remove QuickBooks Components (Keep Mapping Logic)
1. Clear all OAuth tokens from database
2. Reset QuickBooks configuration table
3. Remove any cached QuickBooks state
4. Clear environment conflicts
5. Reset connection status

### Rebuild Core Integration Components
1. Fresh OAuth implementation
2. Clean token management
3. New API request handlers
4. Fresh error handling
5. Clean sandbox connection detection

## Phase 3: End-to-End Testing Protocol

### Test 1: OAuth Flow Verification
- Generate authorization URL
- Complete OAuth callback
- Verify token exchange
- Confirm company ID retrieval

### Test 2: API Connection Testing  
- Test company info endpoint
- Verify vendor creation API
- Test bill creation API
- Confirm item/account access

### Test 3: Data Integration Testing
- Create test vendor from employee data
- Generate test bill from time entries
- Verify field mapping accuracy
- Test error handling scenarios

### Test 4: Production Environment Testing
- Confirm production API endpoints
- Test with production company ID
- Verify 1099 tracking enabled
- Test complete payroll flow

## Phase 4: Regression Testing Checklist

### Critical Integration Points
- [ ] Employee to vendor conversion
- [ ] Time entries to bill lines
- [ ] Payroll period calculations  
- [ ] Hourly rate handling
- [ ] 1099 tracking configuration
- [ ] Date formatting consistency
- [ ] Amount precision accuracy

### Error Scenarios
- [ ] Expired token handling
- [ ] Invalid company ID response
- [ ] Network timeout recovery
- [ ] Duplicate vendor prevention
- [ ] Invalid data validation

### Production Readiness
- [ ] Sandbox connection disabled
- [ ] Production endpoints configured
- [ ] Real company ID forced
- [ ] Live token management
- [ ] Error logging enabled

## Success Criteria
1. OAuth completes without errors
2. Vendor creation works with real data
3. Bill generation uses correct mappings
4. 1099 tracking properly enabled
5. All field mappings preserved
6. Production company ID confirmed
7. No sandbox interference

## Potential Issues to Watch
1. **Sandbox connection conflicts** - Ensure no dev tokens remain
2. **Environment variable precedence** - Verify production overrides
3. **Token refresh timing** - Handle 1-hour expiration
4. **Company ID consistency** - Force production ID throughout
5. **API endpoint environment** - Ensure production URLs