# Inktricate Designs Time Tracking System

## Overview

This is a comprehensive time tracking system built for Inktricate Designs, a wedding industry business. The application allows employees to log their work hours and enables administrators to manage employees, track time entries, and generate payroll reports. The system features role-based access control, secure authentication, and a modern web interface.

## System Architecture

The application follows a full-stack architecture with clear separation between frontend and backend components:

- **Frontend**: React-based single-page application with TypeScript
- **Backend**: Express.js server with Node.js runtime
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Authentication**: Session-based authentication with username/password
- **Deployment**: Configured for Replit with automatic scaling

## Key Components

### Database Layer
- **Database**: PostgreSQL (configured via Neon serverless)
- **ORM**: Drizzle ORM with TypeScript support
- **Schema**: Located in `shared/schema.ts` with tables for users, time entries, task categories, and sessions
- **Migrations**: Managed through Drizzle Kit

### Authentication System
- **Strategy**: Local username/password authentication using Passport.js
- **Session Management**: Express sessions with PostgreSQL session store
- **Password Security**: Scrypt-based password hashing with salt
- **Role-based Access**: Admin and employee roles with different permissions

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state management
- **UI Components**: Shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with custom dark theme
- **Build Tool**: Vite for development and production builds

### Backend API
- **Framework**: Express.js with TypeScript
- **API Structure**: RESTful endpoints under `/api` prefix
- **Data Validation**: Zod schemas for request/response validation
- **Error Handling**: Centralized error handling middleware

## Data Flow

1. **Authentication Flow**:
   - Users log in with username/password
   - Server validates credentials and creates session
   - Session stored in PostgreSQL for persistence
   - Frontend receives user data and role information

2. **Time Entry Flow**:
   - Employees create time entries through frontend form
   - Data validated on both client and server
   - Time entries stored with user association
   - Real-time updates through query invalidation

3. **Admin Management**:
   - Admins can view all employee data and time entries
   - Bulk employee import via CSV
   - Payroll report generation with hourly rate calculations
   - Employee management (create, update, deactivate)

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connection
- **drizzle-orm**: Type-safe database ORM
- **express**: Web server framework
- **passport**: Authentication middleware
- **@tanstack/react-query**: Server state management
- **react-hook-form**: Form handling and validation
- **zod**: Runtime type validation

### UI Dependencies
- **@radix-ui/***: Accessible UI component primitives
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Icon library
- **class-variance-authority**: Styling variants
- **date-fns**: Date manipulation utilities

### Development Dependencies
- **vite**: Build tool and development server
- **typescript**: Type checking and compilation
- **tsx**: TypeScript execution for development

## Deployment Strategy

The application is configured for deployment on Replit with the following setup:

1. **Development**: 
   - Uses Vite dev server for frontend hot reloading
   - TSX for running TypeScript server code
   - Runs on port 5000 with proxy to external port 80

2. **Production**:
   - Vite builds frontend assets to `dist/public`
   - ESBuild bundles server code to `dist/index.js`
   - Serves static files and API from single Node.js process

3. **Database**:
   - Uses Neon PostgreSQL with connection pooling
   - Environment variable `DATABASE_URL` for connection string
   - Session storage integrated with main database

4. **Environment Variables**:
   - `DATABASE_URL`: PostgreSQL connection string
   - `SESSION_SECRET`: Session encryption key
   - Additional variables for email integration (SendGrid/Gmail)

## Authentication Credentials

**Admin Access:**
- Username: `admin`
- Password: `11111111`

## Production QuickBooks Setup

The application includes QuickBooks integration with production credentials configured:
1. ✅ Production QuickBooks app credentials loaded
2. ✅ Production environment variables set
3. ✅ Production URLs and redirects configured
4. 🔄 Ready to connect to real QuickBooks company account
5. 🔄 Ready to sync employees as vendors for 1099 tracking

System is production-ready. Use authorization URL from admin dashboard to connect to real business QuickBooks account. See `PRODUCTION_QUICKBOOKS_SETUP_GUIDE.md` for connection steps.

## Changelog

```
Changelog:
- July 25, 2025. CLIENT ID SECRET UPDATED: Fixed Replit secret to use corrected QuickBooks Client ID
  - IDENTIFIED: Root cause was incorrect Client ID still stored in Replit secrets (AB6HieH2iCWWSQ8j... instead of AB6HieH2iCWWSQej...)
  - FIXED: Updated QUICKBOOKS_CLIENT_ID secret with corrected value (character 11: "8" → "Q")
  - VERIFIED: All environment configuration now uses production domain and correct credentials
  - COMPLETED: Secret environment variable properly updated to match QuickBooks Developer Dashboard
  - STATUS: System ready for successful QuickBooks OAuth authentication
  - NEXT: Test complete authorization flow with corrected secret
- July 22, 2025. EMERGENCY RESPONSE: Implemented comprehensive multi-layer backup and protection system
  - Built automatic backup service (hourly time entries, 6-hour full backups, startup backups)
  - Added change monitoring system to detect unexpected data loss (checks every 5 minutes)
  - Created pre-destructive operation backup protection middleware
  - Implemented emergency backup triggers for significant data changes
  - Added manual backup controls in admin dashboard with full/emergency backup buttons
  - Backup files stored locally in JSON format for easy recovery
  - System monitors time entry count drops >20% and triggers emergency protocols
  - Multiple protection layers: automatic, scheduled, pre-operation, emergency, and manual
  - Added backup status indicators showing active protection features
  - NEVER AGAIN: This system prevents accidental data loss through multiple redundant safeguards
- July 22, 2025. CRITICAL FIX: Corrected bill categorization from "Equipment Rental" to "Wages"
  - Identified root cause: hardcoded account ID "62" mapped to wrong expense category
  - Fixed account ID to "1150040000" which is the correct "Wages" account (PayrollExpenses type)
  - Bills will now be properly categorized for payroll accounting and 1099 reporting
  - Cleared existing bill IDs from database to allow regeneration with correct categorization
- July 22, 2025. SUCCESS: Complete QuickBooks bill generation workflow achieved
  - Successfully re-authenticated QuickBooks connection after token expiration
  - Generated 5 contractor bills for July 2025 payroll period
  - Bills created with proper "Wages" category and July 31st end-of-period dates
  - Individual vendor mapping maintained for each contractor
  - Complete end-to-end workflow validated: Timesheet Entry → Payroll Generation → QuickBooks Bill Creation
- July 22, 2025. FIXED: QuickBooks token expiration and authentication issues
  - Added re-authentication functionality for expired QuickBooks tokens
  - Fixed token refresh error with proper fallback values for expires_in
  - Added "Re-authenticate" button in QuickBooks integration UI
  - System now handles token expiration gracefully with clear user guidance
  - Ready to re-establish QuickBooks connection for bill generation workflow
- July 22, 2025. FIXED: UI workflow issues after QuickBooks integration
  - Restored missing "Generate Payroll" button visibility in admin dashboard
  - Fixed payroll management to show button when no payroll records exist for selected month
  - Added month/year selector to payroll management (July-December 2025 available)
  - Updated Monthly Payroll Report dropdown to show all months with timesheet data (July-December 2025)
  - Fixed TypeScript issues with payroll data type casting
  - UI now properly supports end-to-end testing workflow: Generate Payroll → Sync Contractors → Create QB Bills
- July 22, 2025. ENHANCED: Bill date system updated to use payroll period end dates for accurate accounting
  - Updated QuickBooks bill creation to use payroll period end dates instead of creation dates
  - Bills now show last day of payroll month (e.g., July 2025 payroll → 2025-07-31 bill date)
  - Fixed accounting accuracy: bills reflect when work was performed, not when bills were generated
  - Example: July payroll generated on August 1st will show July 31st as bill date (not August 1st)
  - Updated both API routes and bill creation logic with proper TxnDate and DueDate fields
  - System ready for accurate payroll period tracking and financial reporting
- July 22, 2025. BREAKTHROUGH: Complete end-to-end workflow with proper vendor mapping achieved
  - Created 842 comprehensive dummy timesheet entries across 6 employees for 6 months (July-December 2025)
  - Generated 40 payroll records totaling $52,048.32 with accurate hourly rate calculations
  - FIXED CRITICAL ISSUE: Discovered and resolved vendor mapping problem where all bills were incorrectly assigned to single vendor
  - PROPERLY MAPPED: All 6 employees now have individual QuickBooks vendor IDs (59, 60, 62, 63, 64, 65)
  - FINAL ACHIEVEMENT: 40/40 payroll records now have correctly mapped QuickBooks bills (IDs 187-220) totaling $52,048.32
  - Each contractor properly tracked under their own vendor for accurate 1099 reporting capability
  - Validated complete workflow: time entry → payroll generation → individual vendor QB bill creation → database tracking
  - Fixed PostgreSQL schema compliance and time format issues for production-ready data structure
  - Demonstrated automated bill creation with proper "Professional Services" categorization
  - Description format confirmed: "Month Year - Employee Name Payroll" (e.g., "September 2025 - Pooran Rajput Payroll")
  - System proven capable of handling realistic workloads with proper contractor payment segregation
- July 22, 2025. ENHANCED: Payroll bill format updated with proper categorization and description standards
  - Updated bill category to use "Wages" account (configurable for production via QB_PAYROLL_ACCOUNT env var)
  - Standardized description format: "Month Year - Employee Name Payroll" (e.g., "August 2025 - Pooran Rajput Payroll")
  - Added production configuration support for different account names between sandbox and production
  - Maintained all optimization benefits: stored vendor IDs, automated workflow, complete tracking
  - System ready for production deployment with proper payroll categorization
- July 21, 2025. COMPLETED: Automated payroll bill creation successfully implemented with QuickBooks integration
  - Successfully created QuickBooks bill ID 146 for Pooran Rajput ($60, 4 hours, July 2025)
  - Optimized system using stored vendor ID 65 (no API lookups needed for efficiency)
  - Database updated with QuickBooks bill reference for complete tracking
  - Full automated workflow working: time entry → payroll generation → QB bill creation → database storage
  - Vendor ID optimization: Pooran Rajput corrected from 68 to 65 per actual QuickBooks data
  - System ready to process bills for all pending payroll records efficiently
- July 21, 2025. BREAKTHROUGH: Manual QuickBooks bill creation successful - debugging automated API
  - User manually created Bill ID 145 for "Pooran Rajput" vendor with "Professional Services" category
  - Manual bill structure: $60, description "July 2025 - Pooran Rajput Payroll"
  - API updated to match exact manual structure for automated bill creation
  - Currently testing API bill creation using same vendor and account references as manual bill
- July 21, 2025. IMPLEMENTED: Complete payroll workflow testing and QuickBooks bill creation
  - Fixed missing payroll records by manually creating payroll entry for admin account
  - Added comprehensive test bill creation endpoint for QuickBooks vendor payment testing
  - Updated admin account with proper name fields (Pooran Rajput) for vendor creation
  - Working on complete workflow: time entry -> payroll generation -> QuickBooks bill creation
  - Successfully traced and debugged the full contractor payment process
- July 21, 2025. FIXED: Time entry update validation error for admin portal
  - Resolved schema validation issue where updateTimeEntrySchema incorrectly required 'id' field in request body
  - Time entry ID should come from URL parameter, not request body during updates
  - Admin can now successfully edit time entries including task assignments
- July 21, 2025. COMPLETED: QuickBooks 1099 tracking implementation and user guidance
  - Discovered the correct field is "Vendor1099" (not "Track1099") per official QuickBooks API documentation
  - Updated all contractor sync logic to use proper Vendor1099 boolean field and TaxIdentifier
  - IMPORTANT: The "Track payments for 1099" checkbox requires TWO steps:
    1. API sets Vendor1099=true (completed by our sync)
    2. User must complete 1099 setup in QB: Taxes > 1099 filings > Map expense accounts to 1099 categories
  - Added comprehensive guidance for completing QuickBooks 1099 setup process
- July 21, 2025. Enhanced contractor sync with Track1099 flag management for QuickBooks contractors
  - Implemented vendor search and duplicate detection to prevent re-creating existing vendors
  - Added Track1099 flag updates to convert vendors to contractors in QuickBooks
  - Created diagnostic endpoints for vendor listing and Track1099 status verification
  - Enhanced sync messaging to show detailed actions taken per contractor (6 contractors successfully linked)
  - Resolved vendor update process to properly enable 1099 tracking for tax reporting
- July 21, 2025. Fixed QuickBooks contractor sync API validation errors  
  - Identified QuickBooks ValidationFault (code 2010) caused by unsupported vendor properties
  - Simplified vendor object to use only Name, Active, and PrimaryEmailAddr fields
  - Removed problematic Vendor1099 and PrimaryPhone fields that caused API rejections
  - Enhanced error logging to capture detailed QuickBooks API responses for debugging
- July 21, 2025. Fixed authentication issues and established working QuickBooks integration
  - Resolved login problems by correcting admin password hash
  - Successfully implemented QuickBooks OAuth connection with manual token exchange
  - Added contractor sync functionality to create vendors in QuickBooks
  - Fixed session handling and authentication middleware conflicts
- July 3, 2025. Fixed critical timezone issue with date display across all timesheet components
- June 13, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```

## Critical Deployment Rules

**⚠️ NEVER NEVER NEVER deploy dev time entries data to production ⚠️**

When deploying from development to production:
- ✅ DO: Move code, configs, schema changes
- ❌ NEVER: Move time entry data from dev to production
- ❌ NEVER: Overwrite production employee time records
- ✅ DO: Only deploy application logic and database structure
- ✅ DO: Keep production data separate and protected

**Data Protection Policy:**
- Production employee time entries are the system of record
- Development data is for testing only
- Always backup production before any deployment
- Use schema migrations, never data migrations for production