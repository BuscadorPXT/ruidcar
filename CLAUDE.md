# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

RuidCar - A full-stack automotive noise reduction equipment sales platform and workshop management system, built with TypeScript, React, Express, and PostgreSQL.

## 🔴 MANDATORY DEVELOPMENT RULES

### Layout Requirements
**ALL PAGES IN ADMIN AND WORKSHOP PANELS MUST USE THEIR RESPECTIVE LAYOUTS:**

1. **Admin Panel Pages** (`/admin/*`)
   - MUST wrap content with `AdminLayout` component
   - Import: `import AdminLayout from "@/components/admin/AdminLayout"`
   - Usage:
   ```tsx
   return (
     <AdminLayout>
       {/* Your page content */}
     </AdminLayout>
   );
   ```

2. **Workshop Panel Pages** (`/workshop/*`)
   - MUST wrap content with `WorkshopLayout` component
   - Import: `import WorkshopLayout from "@/components/workshop/WorkshopLayout"`
   - Usage:
   ```tsx
   return (
     <WorkshopLayout>
       {/* Your page content */}
     </WorkshopLayout>
   );
   ```

**Why this is critical:**
- Ensures fixed sidebar navigation is present on all pages
- Maintains consistent user experience across the platform
- Handles authentication and role checking automatically
- Provides proper responsive behavior

**⚠️ NEVER create admin or workshop pages without these layouts!**

## Essential Commands

### Development
```bash
npm run dev                    # Start development server (Express + Vite)
npm run build                  # Build for production
npm run start                  # Run production server
npm run check                  # TypeScript type checking
npm run check:layouts          # Verify all admin/workshop pages use correct layouts
```

### Database
```bash
npm run db:push                # Push schema to database
npm run db:migrate             # Run migrations
```

### Testing
```bash
npm run test                   # Run tests in watch mode
npm run test:run               # Run tests once
npm run test:coverage          # Run tests with coverage
```

### Workshop Management Scripts
```bash
npm run list:workshops         # List all workshops
npm run check:workshop         # Check workshop status
npm run activate:workshop      # Activate a workshop
npm run create:test-workshop   # Create inactive test workshop
npm run create:active-workshop # Create active test workshop
```

## Architecture Overview

### Backend Architecture

Express.js server with dual route system and JWT authentication:

- **Routes**: Legacy routes (`/server/routes.ts`) coexist with new unified routes (`/server/routes/index.ts`, `/server/routes/*.ts`)
- **Authentication**: JWT tokens in HTTP-only cookies, multi-role RBAC (ADMIN, OFICINA_OWNER, CLIENTE)
- **Middleware**: JWT middleware in `/server/middleware/auth.ts` with role/permission validation
- **Database**: PostgreSQL via Neon, Drizzle ORM, schema in `/shared/schema.ts`
- **Key Endpoints**:
  - `/api/auth/unified-login` - Unified login with intent support
  - `/api/notifications` - Polling-based notification system
  - `/api/workshops/check-status` - Workshop approval status check

### Frontend Architecture

React SPA with Wouter routing:

- **State Management**: TanStack Query for server state, custom hooks for auth (`/client/src/hooks/use-auth.ts`)
- **Components**: Radix UI primitives with shadcn/ui components in `/client/src/components/ui/`
- **Routing**: Protected routes via `ProtectedRoute.tsx`, main routing in `/client/src/App.tsx`
- **Key Pages**:
  - `/login` - UnifiedLogin component (all user types)
  - `/admin/*` - Admin dashboard and workshop management
  - `/workshop/*` - Workshop owner dashboard and services
  - `/cliente/*` - Client area (ClientDashboard.tsx)

### Authentication Flow Issues & Solutions

**Known Issues (from LOGICA.md):**
- Multiple competing login systems → Use unified `/login` with intent parameters
- Role system expects `result.roles` but workshop login returns different structure → Backend now returns standardized response
- Workshop approval flow lacks notifications → Notification system implemented with polling

**Critical Files:**
- `/client/src/pages/UnifiedLogin.tsx` - Main login page (has known issues, see LOGICA.md)
- `/client/src/hooks/use-auth.ts` - Auth state management
- `/server/routes/auth.ts` - Unified auth endpoints

### Database Schema

Multi-tenant RBAC structure:
- `users` - Base user accounts
- `roles` - System roles with JSON permissions
- `user_roles` - User-role-organization associations
- `workshops` - Workshop entities with approval status
- `contact_messages` - Contact forms and appointments

Recent migrations:
- `add_workshop_rejection_fields.sql` - Workshop rejection tracking
- `0002_diagnostic_system.sql` - Diagnostic system tables
- `0003_add_confirmation_code.sql` - Email confirmation

## Development Workflow

1. Check LOGICA.md for known issues before implementing features
2. Review BACKEND-UPDATES.md for recent API changes
3. Run `npm run check` after TypeScript changes
4. Test authentication flows thoroughly (known issues exist)
5. Use existing component patterns from `/client/src/components/`

## Environment Variables

Required in `.env`:
```
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
NODE_ENV=development|production
SENDGRID_API_KEY=... (optional, for emails)
```

## Critical Known Issues

1. **Login System**: UnifiedLogin component has hardcoded logic, workshop login returns inconsistent structure
2. **Role Validation**: Frontend expects `result.roles` array but backend responses vary
3. **Workshop Approval**: No automatic admin notifications, workshops wait indefinitely
4. **Session Management**: Mixed usage of cookies and localStorage causes sync issues

See LOGICA.md for comprehensive issue list and BACKEND-UPDATES.md for API documentation.