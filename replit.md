# Waiz Eco-Marketplace

## Overview

Waiz is a web-based eco-marketplace platform designed specifically for Baguio City, Philippines. The application connects households with local junkshops to facilitate the collection, sale, and recycling of materials. Users can list recyclable items, request collection services, communicate via messaging, and view current market rates for recyclables. The platform emphasizes trust, transparency, and community-driven sustainability.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Technology Stack

**Frontend Framework**: React with TypeScript, utilizing Wouter for client-side routing. The UI is built with shadcn/ui components (Radix UI primitives) styled with Tailwind CSS following a "new-york" design system.

**Backend Framework**: Express.js server running on Node.js with TypeScript. The application supports both development mode (with Vite middleware) and production builds.

**State Management**: TanStack Query (React Query) for server state management and data fetching, with a custom query client configured for API requests.

**Form Handling**: React Hook Form with Zod schema validation via @hookform/resolvers.

### Application Architecture

**Monorepo Structure**: The codebase is organized with separate `client/`, `server/`, and `shared/` directories. Shared schemas and types are centralized in the `shared/` folder to maintain consistency between frontend and backend.

**Path Aliases**: TypeScript path mapping is configured to use `@/*` for client source files, `@shared/*` for shared schemas, and `@assets/*` for attached assets.

**Development vs Production**: Two separate entry points exist - `index-dev.ts` uses Vite's dev server with HMR, while `index-prod.ts` serves pre-built static files. The build process bundles the frontend with Vite and the backend with esbuild.

### Data Layer

**Database**: PostgreSQL database accessed via Drizzle ORM with Neon serverless driver (@neondatabase/serverless). The schema configuration uses drizzle-kit for migrations.

**Storage Abstraction**: An `IStorage` interface defines the data access layer with an in-memory `MemStorage` implementation for development/testing. This allows swapping storage backends without changing application logic.

**Schema Design**: Four main entities:
- **Users**: Supports two user types (household/junkshop) with authentication fields, contact information, and ratings
- **Items**: Recyclable listings with categories, pricing, seller information, and status tracking
- **Requests**: Collection/purchase requests with status workflow (Pending → Accepted → Completed/Cancelled)
- **Messages**: Direct messaging between users with read/unread states

All tables use UUID primary keys generated via PostgreSQL's `gen_random_uuid()`.

### Authentication & Session Management

**Authentication Strategy**: Simple credential-based authentication without JWT or session tokens. User data is stored in localStorage after successful login. This is a basic implementation suitable for initial development but should be enhanced with proper session management for production.

**Authorization**: User type (household vs junkshop) determines available features and UI presentation. No role-based access control middleware exists server-side.

### API Design

**RESTful Endpoints**: The API follows REST conventions with routes organized by resource:
- `/api/auth/*` - Authentication (signup, login)
- `/api/items` - Marketplace listings (CRUD operations)
- `/api/requests` - Collection requests
- `/api/messages` - Direct messaging

**Request/Response Format**: JSON for all API communications. Zod schemas validate incoming data with `insertUserSchema`, `insertItemSchema`, etc.

**Error Handling**: Errors return appropriate HTTP status codes (400, 401, etc.) with message payloads. Client-side toast notifications display user-facing error messages.

### Frontend Architecture

**Component Organization**: Components follow atomic design principles:
- Pages in `client/src/pages/` handle routing and data fetching
- Reusable UI components in `client/src/components/ui/` from shadcn
- Custom hooks in `client/src/hooks/`

**Routing**: Client-side routing via Wouter with the following routes:
- `/` - Landing page
- `/about` - About/features page
- `/login` - Login form
- `/signup` - Registration with user type selection
- `/dashboard` - Protected main application interface with tabbed navigation

**Dashboard Design**: The dashboard uses a tab-based interface where content changes based on user type (household vs junkshop). Tabs include Home, Marketplace, Requests, Messages, Rates, and Profile.

**State Persistence**: User authentication state persists in localStorage. Protected routes check for user data and redirect to login if missing.

### Design System

**Styling Approach**: Tailwind CSS with custom CSS variables for theming. The design follows accessibility guidelines with semantic color naming (primary, secondary, muted, etc.) that support light/dark modes.

**Design Tokens**: Typography uses Inter font family. Spacing follows Tailwind's default scale. Border radius values are customized (lg: 9px, md: 6px, sm: 3px).

**Component Variants**: UI components use class-variance-authority for variant management (button sizes, badge types, card styles, etc.). Hover and active states use custom elevation classes.

**Color Palette**: Primary green theme (HSL 150 50% 35%) emphasizing eco-friendly branding. Chart colors and accent colors complement the primary palette.

### Build & Deployment

**Build Process**: 
1. Frontend: Vite bundles the React application to `dist/public`
2. Backend: esbuild bundles the Express server to `dist/index.js` with external dependencies
3. Production server serves static files from `dist/public` and handles API routes

**Development Experience**: Vite dev server with HMR, Replit-specific plugins for error overlay and development banners, TypeScript checking via `tsc --noEmit`.

**Database Migrations**: Drizzle Kit manages schema migrations with `db:push` script for applying schema changes.

## External Dependencies

### Core Framework Dependencies
- **React 18** - UI framework
- **Express.js** - Backend web server
- **TypeScript** - Type safety across the stack
- **Vite** - Frontend build tool and dev server
- **Wouter** - Lightweight client-side routing

### Database & ORM
- **Drizzle ORM** (`drizzle-orm`, `drizzle-zod`) - Type-safe database toolkit
- **@neondatabase/serverless** - PostgreSQL serverless driver
- **drizzle-kit** - Schema migrations and introspection
- **PostgreSQL** - Primary database (configured via DATABASE_URL environment variable)

### UI Component Libraries
- **Radix UI** - Headless accessible component primitives (@radix-ui/react-*)
- **shadcn/ui** - Pre-built component implementations
- **Tailwind CSS** - Utility-first CSS framework
- **class-variance-authority** - Variant handling for components
- **Embla Carousel** - Carousel/slider functionality

### Data Fetching & Forms
- **TanStack Query** (@tanstack/react-query) - Server state management
- **React Hook Form** - Form state and validation
- **Zod** - Schema validation
- **@hookform/resolvers** - Zod integration with React Hook Form

### Utilities
- **clsx** & **tailwind-merge** - Conditional class name composition
- **date-fns** - Date manipulation and formatting
- **nanoid** - Unique ID generation
- **cmdk** - Command palette component

### Development Tools
- **@replit/vite-plugin-runtime-error-modal** - Error overlay
- **@replit/vite-plugin-cartographer** - Replit integration
- **@replit/vite-plugin-dev-banner** - Development indicator

### Session Management
- **connect-pg-simple** - PostgreSQL session store for Express (configured but not actively used in current authentication implementation)

### Future Considerations
The application currently uses a minimal authentication system. For production deployment, consider:
- Implementing proper session management with connect-pg-simple
- Adding password hashing (bcrypt/argon2)
- Implementing CSRF protection
- Adding rate limiting for API endpoints
- Setting up proper CORS configuration
- Implementing file upload for item images
- Adding real-time updates via WebSockets for messaging