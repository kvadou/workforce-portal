# Workforce Training Portal

A full-featured workforce training portal with gamified onboarding, LMS (Learning Management System), certification tracking, and multi-tenant organization support. Built for managing contractor training, onboarding workflows, and performance tracking at scale.

## Key Features

- **Gamified Onboarding** -- Multi-phase onboarding with progress tracking, points, badges, and achievement system
- **LMS / Training Courses** -- Video-based training modules with quizzes, completion tracking, and certificates
- **Interactive Learning** -- Built-in chess-based exercises demonstrating gamified skill assessment (chess.js + react-chessboard)
- **Multi-Tenant Architecture** -- Subdomain-based organization isolation (HQ, regional offices) with role-based access
- **Admin Dashboard** -- Full admin panel for managing users, content (CMS), training courses, announcements, and onboarding workflows
- **Contractor Management** -- Tutor/contractor profiles, performance metrics, team management, and scheduling integration
- **Certification Tracking** -- PDF certificate generation, onboarding completion verification
- **Discussion Forum** -- Category-based community forum with posts and replies
- **Live Sessions** -- Zoom-integrated live training sessions with scheduling
- **Notification System** -- In-app notifications with push notification support
- **Resource Library** -- CMS-powered resource pages with rich text editing (TipTap/BlockNote)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL via Prisma 7 (with `@prisma/adapter-pg`) |
| Auth | NextAuth v4 (credentials + Google OAuth) |
| Styling | Tailwind CSS 4 |
| UI Components | Lucide icons, Heroicons, Mantine, Recharts |
| Video | Vimeo integration with player embed |
| File Storage | AWS S3 (presigned uploads) |
| Email | Postmark transactional email |
| Testing | Vitest + Testing Library |
| Rich Text | TipTap + BlockNote editors |
| Calendar | FullCalendar |
| Forms | React Hook Form + Zod validation |

## Getting Started

### Prerequisites

- Node.js >= 20
- PostgreSQL database

### Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
# Edit .env.local with your DATABASE_URL and NEXTAUTH_SECRET

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Seed demo data (optional)
npx tsx prisma/seed.ts

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Demo Credentials (after seeding)

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@workforceportal.com | admin123 |
| Editor | editor@workforceportal.com | admin123 |

### External Integrations

All external integrations are optional and gracefully degrade when credentials are not configured:

- **TutorCruncher** -- Contractor scheduling/management API (returns error response when unconfigured)
- **Branch Payments** -- Contractor payment processing (no-op when unconfigured)
- **Postmark** -- Transactional email (logs to console when unconfigured)
- **Vimeo** -- Training video hosting (returns placeholder data when unconfigured)
- **AWS S3** -- File uploads (returns mock URLs when unconfigured)
- **Zoom** -- Live session scheduling (optional)

## Project Structure

```
src/
  app/              # Next.js App Router pages and API routes
    (auth)/         # Login, password setup
    (portal)/       # Forum, growth/achievements
    admin/          # Admin dashboard, user management, CMS
    api/            # REST API endpoints
    onboarding/     # Multi-phase onboarding flow
  components/       # Reusable React components
  hooks/            # Custom React hooks
  lib/              # Server utilities, integrations, business logic
    integrations/   # TutorCruncher, Branch, Google Groups
    email/          # Email templates and sending
    validations/    # Zod schemas
prisma/
  schema.prisma     # Database schema
  seed.ts           # Demo data seeder
  migrations/       # Database migrations
```

## Available Scripts

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run test         # Run tests
npm run typecheck    # TypeScript check
npm run lint         # ESLint
```
