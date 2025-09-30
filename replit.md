# RuidCar - Automotive Diagnostic Equipment Website

## Overview

RuidCar is a full-stack web application for a Brazilian automotive diagnostic equipment company. The application features a modern, responsive design with multilingual support and integrates with external services for lead management. It combines a React-based frontend with an Express.js backend, PostgreSQL database, and includes comprehensive form handling with multiple integration fallbacks.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state, React hooks for local state
- **Internationalization**: react-i18next with Portuguese and English support
- **Animations**: Framer Motion for smooth UI transitions
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM
- **Session Management**: connect-pg-simple for PostgreSQL-backed sessions
- **Email Services**: SendGrid integration with Nodemailer fallback
- **API Design**: RESTful endpoints with comprehensive error handling
- **Development**: tsx for TypeScript execution in development

### UI Component System
- **Design System**: shadcn/ui components with custom theming
- **Form Handling**: React Hook Form with Zod validation
- **Phone Input**: react-phone-input-2 for international phone number handling
- **Responsive Design**: Mobile-first approach with Tailwind breakpoints

## Key Components

### Core Business Features
1. **Contact Form System**: Multi-step form with validation and external service integration
2. **ROI Calculator**: Interactive calculator for potential revenue calculations
3. **Product Gallery**: Customization gallery showcasing different equipment colors
4. **Video Integration**: YouTube video player integration with custom controls
5. **Testimonials System**: Dynamic testimonials with image management
6. **Blog System**: Full blog functionality with markdown support and SEO optimization

### User Experience Features
1. **Geolocation Detection**: Automatic country detection for localized content and contact information
2. **Language Switching**: Dynamic language detection and manual switching
3. **Responsive Navigation**: Adaptive navigation with mobile-optimized design
4. **Premium Landing Page**: Tesla-inspired landing page with video backgrounds

### Technical Features
1. **Progressive Web App**: Optimized for mobile and desktop experiences
2. **SEO Optimization**: Meta tags, structured data, and sitemap generation
3. **Performance Optimization**: Lazy loading, image optimization, and code splitting
4. **Error Handling**: Comprehensive error boundaries and fallback mechanisms

## Data Flow

### Contact Form Processing
1. User submits contact form with validation
2. Data is stored in PostgreSQL database (primary)
3. System attempts to send to Trello via SendGrid email integration
4. Falls back to Coda API integration if email fails
5. User always receives success confirmation regardless of external service status

### Geographic Personalization
1. IP-based geolocation detection using ipinfo.io API
2. Fallback to browser language detection
3. Automatic contact information switching (Brazil vs International)
4. URL parameter override for testing (`?country=international`)

### Content Management
1. Blog posts stored in database with markdown support
2. Dynamic image handling for blog content
3. Featured content system for homepage highlights
4. SEO metadata management for all content types

## External Dependencies

### Required Services
- **PostgreSQL Database**: Primary data storage (configured via DATABASE_URL)
- **SendGrid API**: Email delivery service for Trello integration
- **ipinfo.io API**: Geolocation detection service

### Optional Integrations
- **Coda API**: Backup lead management system
- **Trello Email Integration**: Primary lead management via email-to-card
- **Facebook Pixel**: Marketing analytics and conversion tracking
- **YouTube API**: Video content integration

### Development Dependencies
- **Replit Environment**: Configured for Node.js 20, Web, and PostgreSQL 16
- **Vite Plugins**: Runtime error overlay and development tools
- **TypeScript Configuration**: Comprehensive type checking and path mapping

## Deployment Strategy

### Production Build Process
1. **Frontend Build**: Vite builds React application to `dist/public`
2. **Backend Build**: esbuild bundles Express server to `dist/index.js`
3. **Static Assets**: Client files copied to `server/public` for production serving
4. **Database Migration**: Drizzle migrations applied during deployment

### Environment Configuration
- **Development**: `npm run dev` - Concurrent frontend/backend development
- **Production**: `npm run start` - Serves bundled application
- **Database**: `npm run db:push` - Applies schema changes
- **Build**: `npm run build` - Creates production-ready artifacts

### Hosting Requirements
- Node.js 20+ runtime environment
- PostgreSQL 16 database instance
- Environment variables for API keys and database connection
- Static file serving capability for assets

## Changelog

- June 19, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.