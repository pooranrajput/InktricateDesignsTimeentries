# Inktricate Designs Time Tracking System

## Overview

This is a comprehensive time tracking system for Inktricate Designs, a wedding industry business. It enables employees to log work hours and administrators to manage employees, track time entries, and generate payroll reports. Key capabilities include role-based access control, secure authentication, and a modern web interface. The system integrates with QuickBooks for efficient payroll and 1099 tracking, aiming to streamline financial operations and provide accurate contractor payment segregation.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application employs a full-stack architecture:

-   **Frontend**: React-based single-page application with TypeScript, utilizing Wouter for routing, TanStack Query for server state, Shadcn/ui for components, and Tailwind CSS for styling. Vite is used for builds.
-   **Backend**: Express.js server on Node.js, providing RESTful APIs with Zod for data validation and centralized error handling.
-   **Database**: PostgreSQL with Drizzle ORM for type-safe operations. The schema (`shared/schema.ts`) includes tables for users, time entries, task categories, and sessions, with migrations managed by Drizzle Kit.
-   **Authentication**: Session-based authentication via Passport.js, using username/password. Sessions are stored in PostgreSQL. Scrypt-based password hashing is used for security. Role-based access control differentiates admin and employee permissions.
-   **UI/UX Decisions**: Leverages Shadcn/ui and Radix UI for accessible components, with Tailwind CSS for a customizable dark theme.
-   **Feature Specifications**:
    -   Employee time entry and management.
    -   Admin capabilities for employee management (create, update, deactivate, bulk import via CSV).
    -   Payroll report generation with hourly rate calculations.
    -   QuickBooks integration for bill generation and 1099 tracking.

## External Dependencies

-   **Database**: `@neondatabase/serverless` (PostgreSQL connection)
-   **ORM**: `drizzle-orm`
-   **Web Framework**: `express`
-   **Authentication**: `passport`
-   **State Management**: `@tanstack/react-query`
-   **Form Handling**: `react-hook-form`
-   **Validation**: `zod`
-   **UI Components**: `@radix-ui/*`, `tailwindcss`, `lucide-react`, `class-variance-authority`
-   **Date Utilities**: `date-fns`
-   **Build Tools**: `vite`, `typescript`, `tsx`
-   **QuickBooks Integration**: Specific QuickBooks APIs for authentication, vendor management, and bill creation.