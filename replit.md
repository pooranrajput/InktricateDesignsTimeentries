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
- Password: `admin123`

## Changelog

```
Changelog:
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