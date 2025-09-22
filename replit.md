# Overview

This is a social media portal for Riphah School of Computing & Innovation that allows students and faculty to submit social media content for approval. The application features a React frontend with shadcn/ui components and an Express.js backend with PostgreSQL database integration. Users can submit posts with images and captions, while administrators can review, approve, or reject submissions through a comprehensive dashboard interface.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **React + TypeScript**: Modern React application using TypeScript for type safety
- **shadcn/ui Components**: Comprehensive UI component library built on Radix UI primitives
- **Tailwind CSS**: Utility-first CSS framework with custom design system
- **Wouter**: Lightweight client-side routing library
- **TanStack Query**: Server state management for API calls and caching
- **Vite**: Fast build tool and development server

## Authentication & Authorization
- **Replit Auth Integration**: OpenID Connect-based authentication using Replit's identity provider
- **Session Management**: PostgreSQL-backed session storage with configurable TTL
- **Role-Based Access**: Three user roles (student, faculty, admin) with different permissions
- **Passport.js**: Authentication middleware for handling OIDC flows

## Backend Architecture
- **Express.js**: RESTful API server with middleware for logging and error handling
- **TypeScript**: End-to-end type safety with shared schema definitions
- **Multer**: File upload handling with memory storage
- **Session Storage**: Connect-pg-simple for PostgreSQL session management

## Database Design
- **PostgreSQL**: Primary database with Neon serverless hosting
- **Drizzle ORM**: Type-safe database operations with schema migrations
- **Core Tables**:
  - Users: Authentication and profile information
  - Posts: Content submissions with status tracking
  - Sessions: Authentication session storage

## File Storage
- **Object Storage**: Custom implementation using local file system
- **Image Processing**: Support for multiple image uploads per post
- **Public Access**: Configurable public paths for serving uploaded content

## State Management
- **Client State**: React hooks and TanStack Query for server state
- **Form Handling**: React Hook Form with Zod validation
- **Real-time Updates**: Query invalidation for immediate UI updates

## Design System
- **Color Palette**: Professional blue-based theme with support for light/dark modes
- **Typography**: Inter font family with consistent sizing hierarchy
- **Component Variants**: Standardized button, card, and form component styles
- **Responsive Design**: Mobile-first approach with Tailwind breakpoints