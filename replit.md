# Inktricate Designs Time Tracker

## Overview

This is a comprehensive time tracking and payroll management system built for Inktricate Designs, a wedding and event planning company. The application allows employees to log their work hours and enables administrators to generate payroll reports and create contractor bills. The system is designed to integrate with QuickBooks for seamless contractor payment processing and 1099 tax reporting.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Components**: Radix UI component library with Tailwind CSS for styling
- **State Management**: TanStack React Query for server state management
- **Form Handling**: React Hook Form with Zod validation resolvers
- **Routing**: React Router for client-side navigation
- **Build System**: Vite with custom path aliases and runtime error handling

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **Session Management**: Express sessions with PostgreSQL storage using connect-pg-simple
- **Authentication**: Username/password based with bcrypt hashing and role-based access control
- **File Structure**: Modular architecture with separate client, server, and shared directories

### Data Storage Solutions
- **Primary Database**: PostgreSQL with Neon serverless hosting
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema Management**: Drizzle Kit for database migrations and schema management
- **Session Storage**: PostgreSQL-backed session store for user authentication state

### Authentication and Authorization
- **Authentication Method**: Session-based authentication with encrypted passwords
- **Password Security**: bcrypt with salt for password hashing
- **Session Management**: Express sessions with PostgreSQL persistence
- **Role-Based Access**: Admin and employee roles with different permission levels
- **Security Features**: Password reset functionality and active user status management

### Core Data Models
- **Users**: Employee information including roles, hourly rates, contact details, and employment status
- **Time Entries**: Work hour logging with task categories, dates, and project descriptions
- **Task Categories**: Predefined work categories for time entry classification
- **Monthly Payroll**: Aggregated payroll data with hours worked and gross pay calculations
- **QuickBooks Integration**: Vendor and bill ID mapping for external accounting system sync

## External Dependencies

### QuickBooks Integration
- **Purpose**: Contractor bill creation and 1099 tax reporting
- **Implementation**: QuickBooks SDK with OAuth 2.0 authentication
- **Data Sync**: Automatic vendor creation and bill generation from payroll data
- **Sandbox Environment**: Development testing with QuickBooks sandbox accounts

### Email Services
- **Provider**: SendGrid for transactional email functionality
- **Use Cases**: Password reset notifications and system alerts
- **Configuration**: API key-based authentication with environment variables

### Development Tools
- **Package Management**: npm with comprehensive dependency management
- **Type Safety**: Full TypeScript implementation across client and server
- **Code Quality**: ESLint and TypeScript compiler checks
- **Build Process**: Separate client and server build pipelines with esbuild optimization

### Hosting and Deployment
- **Platform**: Replit hosting environment
- **Database**: Neon PostgreSQL serverless database
- **Environment**: Production and development environment variable management
- **Security**: Environment-based configuration for sensitive credentials