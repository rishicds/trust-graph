# TrustGraph

Portable, evidence-backed reputation profiles — the trust layer of the internet.

## Stack

- **Frontend:** Next.js 16, React 19, Tailwind CSS 4, pnpm
- **Backend:** Go 1.26, Chi router, Clerk JWT verification
- **Database:** MongoDB Atlas
- **Auth:** Clerk (GitHub, LinkedIn, email) — no separate GitHub OAuth env vars

## Project structure

```
trustgraph/
├── frontend/          # Next.js app (pnpm)
├── backend/           # Go API server
└── docs/              # Product requirements + setup
```

## Quick start

### 1. Backend

```bash
cd backend
cp .env.example .env   # set MONGODB_URI, CLERK_SECRET_KEY, GITHUB_TOKEN
go run ./cmd/server
```

Uses **MongoDB Atlas** via `MONGODB_URI` in `backend/.env`.

API runs at `http://localhost:8080`.

### 2. Frontend

```bash
cd frontend
cp .env.local.example .env.local
pnpm install
pnpm dev
```

App runs at `http://localhost:3000`.

## Phase 1 (Developer Foundation)

- **Clerk GitHub/LinkedIn bootstrap** — sign in with GitHub via Clerk; username auto-syncs to evidence ingest (no `GITHUB_CLIENT_ID`)
- **GitHub evidence** — repos, merged PRs, languages via `GITHUB_TOKEN` (server-side API)
- **Stack Overflow + Devpost** — connect usernames; manual conference/talk claims
- **5-step onboarding** — integrations → score reveal → passport → peer verification
- **Teaser / summary / full profiles** — visibility tiers + private mode
- **Trust timeline + comparative insights** — Pro tier ($15/mo via Stripe)
- **Score history** — weekly snapshots; chart on dashboard (Pro)
- **Background refresh** — daily GitHub, weekly Stack Overflow + digest email (Resend)
- **Peer verification** — invite colleagues via `/verify/{token}`
- **SVG badge + HTML embed** — `/badge/{handle}.svg`, `/embed/{handle}`
- **Shadow profiles at scale** — batch GitHub ingest (`go run ./cmd/seed-shadows`)
- **Privacy** — private mode, disconnect-with-preview, account deletion
- **Design partners** — API keys + score-change webhooks

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/badge/{handle}.svg` | Dynamic trust score badge |
| GET | `/embed/{handle}` | Embeddable profile widget |
| POST | `/v1/auth/clerk/sync` | Sync Clerk user + bootstrap GitHub/LinkedIn (auth) |
| GET | `/v1/me` | Current user + profile (auth) |
| GET | `/v1/me/alerts` | Alerts + comparative insights (auth, Pro for insights) |
| GET | `/v1/me/score-history` | Score snapshots (auth, Pro) |
| PATCH | `/v1/me/settings` | Privacy, webhook URL (auth) |
| POST | `/v1/me/api-key` | Rotate API key (auth, Pro) |
| GET | `/v1/profiles` | List featured profiles |
| GET | `/v1/profiles/{handle}` | Profile (teaser / summary / full) |
| GET | `/v1/trust-score?handle=` | Trust score (full/band/binary) |
| POST | `/v1/profiles/connect/github` | Connect GitHub by username (auth) |
| POST | `/v1/profiles/connect/stackoverflow` | Connect Stack Overflow (auth) |
| POST | `/v1/profiles/connect/devpost` | Connect Devpost (auth) |
| POST | `/v1/profiles/claims/manual` | Manual conference/talk claim (auth) |
| POST | `/v1/billing/checkout` | Stripe Pro checkout (auth) |
| POST | `/v1/billing/webhook` | Stripe webhook |
| POST | `/v1/verifications/invite` | Peer verification invite (auth) |
| GET | `/v1/verifications/{token}/confirm` | Confirm peer verification |
| POST | `/v1/onboarding/complete` | Complete onboarding (auth) |
| POST | `/v1/profiles/{handle}/claim` | Claim shadow profile (auth) |

Each gitstar-ranking page lists 100 users; up to 100 pages (~10,000 profiles) are available.

Set `GITHUB_TOKEN` for accurate merged PR counts and richer evidence.

## Demo profiles

After seeding, visit demo profiles (`/rishicds`, `/Pragya79645`, `/Rajarshi44`, `/debayudh07`) or GitHub-based shadows from the batch file.
