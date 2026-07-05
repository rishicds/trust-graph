# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
TrustGraph is a portable, evidence-backed reputation profile system. It integrates multiple professional data sources (GitHub, LinkedIn, Stack Overflow, Devpost) to generate a "Trust Score" and a professional "Passport".

## Architecture

### High-Level Structure
- `backend/`: Go API server.
- `frontend/`: Next.js application.
- `docs/`: PRDs and setup guides.

### Backend Architecture (Go)
The backend follows a layered architecture:
- **Entry Points (`backend/cmd/`)**: Contains the main server and various CLI tools for maintenance (e.g., `seed-shadows`, `enrich-profile`, `recompute-scores`).
- **Handlers (`backend/internal/handlers/`)**: HTTP request/response handling and API routing using the Chi router.
- **Services (`backend/internal/service/`)**: Core business logic, external API integrations (GitHub, Firecrawl, Tavily, Gemini), and trust score calculations.
- **Repository (`backend/internal/repository/`)**: Data access layer for MongoDB Atlas.
- **Models (`backend/internal/models/`)**: Data structures and domain objects.

### Frontend Architecture (Next.js)
- **Framework**: Next.js (App Router) with React 19 and Tailwind CSS 4.
- **Auth**: Clerk for authentication and user management.
- **State/Data**: API calls managed via `frontend/lib/api.ts`.
- **Components**: Organized by domain (e.g., `components/profile`, `components/recruiter`, `components/onboarding`).

## Common Development Tasks

### Backend
- **Run Server**: `cd backend && go run ./cmd/server`
- **Seed Shadow Profiles**: `cd backend && go run ./cmd/seed-shadows [flags]`
    - Example: `go run ./cmd/seed-shadows -gitstar -pages 10`
- **Build/Test**: Standard Go tooling (`go build`, `go test ./...`).

### Frontend
- **Install Dependencies**: `cd frontend && pnpm install`
- **Run Development Server**: `cd frontend && pnpm dev`
- **Build**: `cd frontend && pnpm build`

## Key Integration Details
- **Auth Flow**: Clerk handles authentication. The backend verifies Clerk JWTs.
- **Data Sources**: 
    - GitHub: Server-side API calls using `GITHUB_TOKEN`.
    - Enrichment: Uses LLMs (Gemini) and web scraping (Firecrawl/Tavily).
- **Database**: MongoDB Atlas (`MONGODB_URI` in `.env`).
