# 🧬 Skill DNA Scanner

Transform your GitHub profile, resume, and experience into an interactive skill genome.

## Features

- **Evidence-based skills**: Every skill is backed by concrete evidence from your code, resume, and manual entries
- **Skill DNA Map**: Interactive force-graph showing your skills as a connected knowledge graph
- **Strength Clusters**: Auto-grouped skill clusters revealing your technical specializations
- **Gap Analysis**: Compare your profile against target role templates (Frontend, Backend, Fullstack, Data, ML)
- **Learning Roadmap**: Prioritized, dependency-ordered learning plan with time estimates
- **Career Timeline**: Descriptive view of skill evolution over time

## Tech Stack

- **Frontend**: React + Vite + Tailwind CSS v4 + react-force-graph-2d + Recharts
- **Backend**: Express 5 + TypeScript (Node 20+)
- **Database**: Supabase (PostgreSQL + Storage)
- **Parsing**: Apache Tika (via Docker)
- **Taxonomy**: ESCO Skills v1.2.1

## Quick Start

### Prerequisites

- Node.js 20+
- Docker (for Tika + Supabase local dev)

### 1. Install dependencies

```bash
npm install          # root scripts
npm install --prefix api
npm install --prefix web
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your values
```

### 3. Start Supabase locally

```bash
npm run db:start
# Wait for it to finish, then copy the API URL and keys to .env
npm run db:status
```

### 4. Start Tika

```bash
npm run tika:start
```

### 5. Import ESCO data

Download the ESCO CSV dataset from https://esco.ec.europa.eu/en/use-esco/download and place in `api/data/`:
- `skills_en.csv`
- `broaderRelationsSkillPillar.csv` (optional but recommended)
- `skillSkillRelations.csv` (optional)

Then run:
```bash
npm run import:esco
```

### 6. Start the dev server

```bash
npm run dev
# Frontend: http://localhost:5173
# API: http://localhost:3001
```

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/scans` | None | Create scan |
| `GET` | `/api/scans/:id` | share_token | Get scan |
| `DELETE` | `/api/scans/:id` | share_token | Delete scan |
| `POST` | `/api/scans/:id/sources` | share_token | Add source (github/resume/manual) |
| `POST` | `/api/scans/:id/run` | share_token | Trigger analysis |
| `GET` | `/api/scans/:id/status` | share_token | Poll progress |
| `GET` | `/api/scans/:id/views/skills` | share_token | Skill list + evidence |
| `GET` | `/api/scans/:id/views/map` | share_token | Graph nodes + edges |
| `GET` | `/api/scans/:id/views/clusters` | share_token | Cluster data |
| `GET` | `/api/scans/:id/views/gaps` | share_token | Gap analysis |
| `GET` | `/api/scans/:id/views/timeline` | share_token | Career timeline |
| `GET` | `/api/scans/:id/views/roadmap` | share_token | Learning roadmap |

## Database Migrations

```bash
npm run db:migrate   # apply new migrations
npm run db:reset     # reset + re-apply all (dev only)
```

## Deployment

- **Frontend**: Vercel (root dir: `web/`, build: `npm run build`)
- **Backend**: Render (root dir: `api/`, build: `npm ci && npm run build`, start: `node dist/server.js`)
- **Tika**: Render Docker service (`apache/tika:latest`)
- **Database**: Supabase managed cloud (`npx supabase db push`)

## Security Notes

- Share tokens provide capability-based access until auth is added
- GitHub PATs are used only in-memory during ingest — never stored
- Resumes are stored in a private Supabase Storage bucket
- All Supabase service-role credentials stay server-side only

## Adding Auth (Post-MVP)

1. Add `owner_user_id UUID NULLABLE` to `app.scans`
2. Replace share_token checks with auth middleware (Supabase Auth)
3. Enable RLS policies on scan tables and Storage objects
4. Attach user context to all scans on creation
