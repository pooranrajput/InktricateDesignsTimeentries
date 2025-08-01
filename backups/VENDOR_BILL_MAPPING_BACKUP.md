# VENDOR BILL MAPPING BACKUP

## Preserved Before QuickBooks Integration Removal

This file contains the vendor mapping logic and data structure that should be preserved and reused when reinstalling QuickBooks integration in the future.

### Vendor Mapping Data Structure:
- Each employee has QuickBooks Customer ID and Vendor ID
- Used for creating bills in QuickBooks for contractor payments
- Preserved data shows 6 active contractor mappings

### Key Fields to Restore:
- `quickbooks_customer_id`: Maps to QB Customer records
- `quickbooks_vendor_id`: Maps to QB Vendor records for bill creation
- `quickbooks_item_id`: Service item mapping (currently null for all)

### Mapping Logic:
The system creates bills using the vendor ID for each contractor, mapping their time entries to payroll bills in QuickBooks for 1099 tracking.

This data structure should be maintained when rebuilding the QuickBooks integration.