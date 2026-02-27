# Skill DNA Scanner — Web MVP Implementation Plan

## Repository Structure

```
skill-dna-scanner/
├── api/                          # Express backend
│   ├── src/
│   │   ├── app.ts                # Express app setup (middleware, routes, CORS)
│   │   ├── server.ts             # Entry point — starts listening
│   │   ├── config/
│   │   │   └── index.ts          # Typed env config (SUPABASE_URL, TIKA_URL, etc.)
│   │   ├── routes/
│   │   │   ├── index.ts          # Mount all sub-routers under /api
│   │   │   ├── scanRoutes.ts     # POST/GET/DELETE /scans
│   │   │   ├── sourceRoutes.ts   # POST /scans/:id/sources (github, resume, manual)
│   │   │   ├── analysisRoutes.ts # POST /scans/:id/run, GET /scans/:id/status
│   │   │   └── viewRoutes.ts     # GET /scans/:id/views/* (map, clusters, gaps, etc.)
│   │   ├── controllers/
│   │   │   ├── scanController.ts
│   │   │   ├── sourceController.ts
│   │   │   ├── analysisController.ts
│   │   │   └── viewController.ts
│   │   ├── services/
│   │   │   ├── githubService.ts       # GitHub REST API fetcher + rate-limit handling
│   │   │   ├── tikaService.ts         # Tika REST client for document parsing
│   │   │   ├── resumeService.ts       # Resume upload → storage → parse pipeline
│   │   │   ├── evidenceService.ts     # Evidence item creation + linking
│   │   │   ├── normalizationService.ts # Skill mention → ESCO normalization
│   │   │   ├── scoringService.ts      # Evidence aggregation → skill scores
│   │   │   ├── clusteringService.ts   # KMeans clustering + coordinate generation
│   │   │   ├── gapService.ts          # Gap analysis vs target role templates
│   │   │   ├── timelineService.ts     # Descriptive career timeline computation
│   │   │   ├── roadmapService.ts      # Learning roadmap generation
│   │   │   └── orchestratorService.ts # Run full analysis pipeline for a scan
│   │   ├── middleware/
│   │   │   ├── errorHandler.ts        # Global async error handler
│   │   │   ├── shareToken.ts          # Validate share_token on scan endpoints
│   │   │   └── upload.ts              # Multer config for resume uploads
│   │   ├── lib/
│   │   │   ├── supabase.ts            # Supabase admin client (service role)
│   │   │   └── github.ts              # GitHub API helpers (headers, rate-limit parse)
│   │   ├── types/
│   │   │   └── index.ts               # Shared TS types (Scan, Source, Evidence, etc.)
│   │   └── utils/
│   │       ├── logger.ts              # Pino logger setup
│   │       └── depSkillMap.ts         # Curated dependency→skill mapping
│   ├── scripts/
│   │   └── import-esco.ts             # ESCO CSV import script
│   ├── data/
│   │   └── .gitkeep                   # Place ESCO CSV files here
│   ├── package.json
│   └── tsconfig.json
├── web/                          # React + Vite frontend
│   ├── src/
│   │   ├── main.tsx              # Entry point
│   │   ├── App.tsx               # Root component + router
│   │   ├── index.css             # @import "tailwindcss" + @theme
│   │   ├── config/
│   │   │   └── env.ts            # API base URL config
│   │   ├── pages/
│   │   │   ├── Landing.tsx       # Landing / start page
│   │   │   ├── ScanSetup.tsx     # Input sources (GitHub, resume, manual)
│   │   │   ├── ScanProgress.tsx  # Analysis progress + partial results
│   │   │   ├── ScanResults.tsx   # Tabbed view container for all 5 views
│   │   │   └── NotFound.tsx
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── Card.tsx
│   │   │   │   ├── Modal.tsx
│   │   │   │   ├── Tabs.tsx
│   │   │   │   ├── Badge.tsx
│   │   │   │   └── Spinner.tsx
│   │   │   ├── layout/
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── Footer.tsx
│   │   │   │   └── PageContainer.tsx
│   │   │   ├── scan/
│   │   │   │   ├── GitHubInput.tsx      # GitHub username + optional token
│   │   │   │   ├── ResumeUpload.tsx     # Drag-drop resume upload
│   │   │   │   ├── ManualInput.tsx      # Manual skills/projects/roles form
│   │   │   │   └── ProgressTracker.tsx  # Job status display
│   │   │   ├── views/
│   │   │   │   ├── SkillDNAMap.tsx      # Force-graph visualization
│   │   │   │   ├── StrengthClusters.tsx # Cluster cards
│   │   │   │   ├── SkillGaps.tsx        # Gap list + target role picker
│   │   │   │   ├── CareerTimeline.tsx   # Timeline chart
│   │   │   │   └── LearningRoadmap.tsx  # Roadmap items
│   │   │   └── evidence/
│   │   │       ├── EvidenceDrawer.tsx   # Slide-out evidence panel
│   │   │       └── EvidenceItem.tsx     # Single evidence card
│   │   ├── hooks/
│   │   │   ├── useScan.ts        # Scan CRUD + polling
│   │   │   ├── useViews.ts       # Fetch computed views
│   │   │   └── useApi.ts         # Base fetch wrapper
│   │   ├── lib/
│   │   │   └── api.ts            # API client (fetch-based)
│   │   └── types/
│   │       └── index.ts          # Frontend type definitions
│   ├── public/
│   │   └── favicon.svg
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── tsconfig.app.json
│   ├── tsconfig.node.json
│   └── vite.config.ts
├── supabase/
│   ├── config.toml               # Local Supabase config + storage buckets
│   ├── seed.sql                  # Seed data (target role templates, etc.)
│   └── migrations/
│       ├── 00001_enable_extensions.sql
│       ├── 00002_create_esco_tables.sql
│       ├── 00003_create_scan_tables.sql
│       ├── 00004_create_evidence_tables.sql
│       ├── 00005_create_normalization_tables.sql
│       ├── 00006_create_computed_tables.sql
│       └── 00007_create_indexes.sql
├── docker-compose.yml            # Tika server (Supabase runs via CLI separately)
├── .env.example                  # Template for env vars
├── .gitignore
├── package.json                  # Root scripts (dev, build, etc.)
└── README.md
```

---

## Phase 1: Foundation (Week 1–3) — "Data In" Vertical Slice

### Step 1.1: Initialize Repository & Tooling

**Root setup:**
- Initialize git repo (already done)
- Create root `package.json` with convenience scripts:
  ```json
  {
    "name": "skill-dna-scanner",
    "private": true,
    "scripts": {
      "dev": "concurrently \"npm run dev:api\" \"npm run dev:web\"",
      "dev:api": "npm run dev --prefix api",
      "dev:web": "npm run dev --prefix web",
      "build": "npm run build --prefix api && npm run build --prefix web",
      "db:start": "npx supabase start",
      "db:stop": "npx supabase stop",
      "db:reset": "npx supabase db reset",
      "db:migrate": "npx supabase migration up",
      "db:new-migration": "npx supabase migration new",
      "tika:start": "docker compose up -d tika",
      "import:esco": "npm run import:esco --prefix api"
    }
  }
  ```
- Install root dev deps: `concurrently`, `supabase`
- Create `.env.example`:
  ```
  SUPABASE_URL=http://127.0.0.1:54321
  SUPABASE_ANON_KEY=<from supabase status>
  SUPABASE_SERVICE_ROLE_KEY=<from supabase status>
  TIKA_URL=http://localhost:9998
  GITHUB_TOKEN_DEFAULT=
  PORT=3001
  ```
- Create `.gitignore`: node_modules, dist, .env, uploads/, api/data/*.csv

**Docker Compose (Tika only — Supabase uses CLI):**
```yaml
# docker-compose.yml
services:
  tika:
    image: apache/tika:latest
    ports:
      - "9998:9998"
    restart: unless-stopped
```

### Step 1.2: Supabase Local Stack + Migrations

**Initialize Supabase:**
```bash
npx supabase init
```

**Configure `supabase/config.toml`** to add resume storage bucket:
```toml
[storage]
enabled = true

[storage.buckets.resumes]
public = false
file_size_limit = "10MB"
allowed_mime_types = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
```

**Migration 00001: Enable extensions**
```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

**Migration 00002: ESCO reference tables**
```sql
CREATE SCHEMA IF NOT EXISTS ref;

CREATE TABLE ref.esco_skills (
  esco_uri TEXT PRIMARY KEY,
  preferred_label TEXT NOT NULL,
  alt_labels TEXT,
  skill_type TEXT,
  reuse_level TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ref.esco_skill_aliases (
  id BIGSERIAL PRIMARY KEY,
  esco_uri TEXT NOT NULL REFERENCES ref.esco_skills(esco_uri),
  alias TEXT NOT NULL,
  lang TEXT DEFAULT 'en'
);

CREATE TABLE ref.esco_hierarchy (
  parent_uri TEXT NOT NULL,
  child_uri TEXT NOT NULL,
  PRIMARY KEY (parent_uri, child_uri)
);

CREATE TABLE ref.esco_skill_relations (
  skill_uri_a TEXT NOT NULL,
  skill_uri_b TEXT NOT NULL,
  relation_type TEXT DEFAULT 'associated',
  PRIMARY KEY (skill_uri_a, skill_uri_b)
);
```

**Migration 00003: Scan tables**
```sql
CREATE SCHEMA IF NOT EXISTS app;

CREATE TABLE app.scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','running','ready','error')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  config JSONB DEFAULT '{}',
  progress JSONB DEFAULT '{}',
  error_details JSONB,
  delete_at TIMESTAMPTZ
);

CREATE TABLE app.sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID NOT NULL REFERENCES app.scans(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('github','resume','manual')),
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE app.artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID NOT NULL REFERENCES app.scans(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('resume_upload','github_snapshot','manual_data')),
  storage_path TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Migration 00004: Evidence tables**
```sql
CREATE TABLE app.evidence_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID NOT NULL REFERENCES app.scans(id) ON DELETE CASCADE,
  source_id UUID NOT NULL REFERENCES app.sources(id) ON DELETE CASCADE,
  evidence_type TEXT NOT NULL CHECK (evidence_type IN (
    'repo_topic','repo_language','dependency','readme_snippet',
    'resume_bullet','manual_claim'
  )),
  ref JSONB DEFAULT '{}',
  text_snippet TEXT,
  timestamp TIMESTAMPTZ,
  strength NUMERIC(3,2) DEFAULT 0.5 CHECK (strength >= 0 AND strength <= 1),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE app.skill_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_id UUID NOT NULL REFERENCES app.evidence_items(id) ON DELETE CASCADE,
  mention_text TEXT NOT NULL,
  context_text TEXT,
  start_idx INT,
  end_idx INT,
  confidence NUMERIC(3,2) DEFAULT 0.5
);
```

**Migration 00005: Normalization tables**
```sql
CREATE TABLE app.skill_normalizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mention_id UUID NOT NULL REFERENCES app.skill_mentions(id) ON DELETE CASCADE,
  esco_uri TEXT NOT NULL REFERENCES ref.esco_skills(esco_uri),
  method TEXT NOT NULL CHECK (method IN ('exact','trigram','embedding','manual_override')),
  score NUMERIC(4,3) DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Migration 00006: Computed output tables**
```sql
CREATE TABLE app.user_skill_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID NOT NULL REFERENCES app.scans(id) ON DELETE CASCADE,
  esco_uri TEXT NOT NULL REFERENCES ref.esco_skills(esco_uri),
  score NUMERIC(4,3) DEFAULT 0,
  recency_days INT,
  evidence_count INT DEFAULT 0,
  top_evidence_ids UUID[] DEFAULT '{}',
  UNIQUE (scan_id, esco_uri)
);

CREATE TABLE app.clusters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID NOT NULL REFERENCES app.scans(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  description TEXT,
  centroid_x NUMERIC,
  centroid_y NUMERIC
);

CREATE TABLE app.cluster_memberships (
  cluster_id UUID NOT NULL REFERENCES app.clusters(id) ON DELETE CASCADE,
  esco_uri TEXT NOT NULL,
  x NUMERIC NOT NULL,
  y NUMERIC NOT NULL,
  PRIMARY KEY (cluster_id, esco_uri)
);

CREATE TABLE app.gaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID NOT NULL REFERENCES app.scans(id) ON DELETE CASCADE,
  esco_uri TEXT NOT NULL REFERENCES ref.esco_skills(esco_uri),
  target_weight NUMERIC(3,2) DEFAULT 0,
  user_score NUMERIC(3,2) DEFAULT 0,
  gap_score NUMERIC(4,3) DEFAULT 0,
  rationale TEXT
);

CREATE TABLE app.timeline_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID NOT NULL REFERENCES app.scans(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  top_skills JSONB DEFAULT '[]',
  cluster_summary JSONB DEFAULT '{}'
);

CREATE TABLE app.roadmap_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID NOT NULL REFERENCES app.scans(id) ON DELETE CASCADE,
  esco_uri TEXT NOT NULL REFERENCES ref.esco_skills(esco_uri),
  priority INT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  estimated_hours INT,
  dependencies UUID[] DEFAULT '{}',
  resources JSONB DEFAULT '[]'
);

CREATE TABLE ref.target_roles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  skills JSONB NOT NULL DEFAULT '[]'
);

CREATE TABLE app.deletion_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID NOT NULL,
  deleted_at TIMESTAMPTZ DEFAULT NOW(),
  details JSONB DEFAULT '{}'
);
```

**Migration 00007: Indexes**
```sql
-- Trigram indexes for ESCO skill matching
CREATE INDEX idx_esco_skills_label_gin ON ref.esco_skills
  USING GIN (preferred_label gin_trgm_ops);
CREATE INDEX idx_esco_skills_label_lower ON ref.esco_skills
  (lower(preferred_label));
CREATE INDEX idx_esco_aliases_alias_gin ON ref.esco_skill_aliases
  USING GIN (alias gin_trgm_ops);
CREATE INDEX idx_esco_aliases_alias_lower ON ref.esco_skill_aliases
  (lower(alias));

-- Evidence lookups
CREATE INDEX idx_evidence_scan ON app.evidence_items(scan_id);
CREATE INDEX idx_evidence_source ON app.evidence_items(source_id);
CREATE INDEX idx_mentions_evidence ON app.skill_mentions(evidence_id);
CREATE INDEX idx_normalizations_mention ON app.skill_normalizations(mention_id);
CREATE INDEX idx_normalizations_esco ON app.skill_normalizations(esco_uri);

-- Computed output lookups
CREATE INDEX idx_scores_scan ON app.user_skill_scores(scan_id);
CREATE INDEX idx_clusters_scan ON app.clusters(scan_id);
CREATE INDEX idx_gaps_scan ON app.gaps(scan_id);
CREATE INDEX idx_timeline_scan ON app.timeline_points(scan_id);
CREATE INDEX idx_roadmap_scan ON app.roadmap_items(scan_id);

-- Scan share token lookup
CREATE INDEX idx_scans_share_token ON app.scans(share_token);
```

### Step 1.3: Backend (Express) Scaffolding

**Initialize api/ project:**
```bash
mkdir -p api/src/{config,routes,controllers,services,middleware,lib,types,utils}
mkdir -p api/scripts api/data
cd api
npm init -y
npm install express cors helmet multer dotenv @supabase/supabase-js pino pino-pretty
npm install -D typescript @types/node @types/express @types/cors @types/multer tsx
```

**api/package.json scripts:**
```json
{
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "type-check": "tsc --noEmit",
    "import:esco": "tsx scripts/import-esco.ts"
  }
}
```

**api/tsconfig.json:**
```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "moduleDetection": "force",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "sourceMap": true,
    "isolatedModules": true,
    "lib": ["ESNext"]
  },
  "include": ["src/**/*", "scripts/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Key files to implement in Step 1.3:**

- `api/src/config/index.ts` — Load and validate env vars using a typed config object
- `api/src/lib/supabase.ts` — `createClient(url, serviceRoleKey)` with `persistSession: false`
- `api/src/app.ts` — Express app with cors (origin: `http://localhost:5173`), helmet, json parser, routes, errorHandler
- `api/src/server.ts` — Listen on PORT (default 3001)
- `api/src/middleware/errorHandler.ts` — Catch-all async error handler, structured JSON errors
- `api/src/middleware/shareToken.ts` — Extract `share_token` from query param or `x-share-token` header; verify against scan record; reject with 403 if invalid
- `api/src/utils/logger.ts` — Pino logger instance

### Step 1.4: Frontend (Vite + React + Tailwind) Scaffolding

**Initialize web/ project:**
```bash
npm create vite@latest web -- --template react-ts
cd web
npm install
npm install tailwindcss @tailwindcss/vite
npm install react-router-dom
```

**web/vite.config.ts:**
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
```

**web/src/index.css:**
```css
@import "tailwindcss";

@theme {
  --color-primary: #6366f1;
  --color-primary-dark: #4f46e5;
  --color-secondary: #06b6d4;
  --color-accent: #f59e0b;
  --color-surface: #f8fafc;
  --color-surface-dark: #1e293b;
  --font-sans: "Inter", system-ui, sans-serif;
}
```

**Key files to implement in Step 1.4:**
- `web/src/App.tsx` — React Router with routes: `/`, `/scan/new`, `/scan/:id/progress`, `/scan/:id/results`
- `web/src/lib/api.ts` — Fetch wrapper that reads share_token from URL/localStorage and attaches it
- `web/src/pages/Landing.tsx` — Hero + "Start Scan" CTA
- `web/src/pages/ScanSetup.tsx` — Tabbed form for GitHub, Resume, Manual input
- Basic layout components (Header, Footer, PageContainer)
- Common components (Button, Input, Card, Spinner)

### Step 1.5: Scan Lifecycle API

**Endpoints:**

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/scans` | Create new scan, returns `{id, share_token}` |
| `GET` | `/api/scans/:id` | Get scan details (requires share_token) |
| `DELETE` | `/api/scans/:id` | Delete scan + all data (requires share_token) |
| `POST` | `/api/scans/:id/sources` | Add a source |
| `POST` | `/api/scans/:id/run` | Trigger analysis pipeline |
| `GET` | `/api/scans/:id/status` | Poll analysis progress |

**Implementation details:**
- `POST /api/scans` — Insert into `app.scans`, return `{id, share_token, status: 'new'}`
- Share token middleware applied to all routes except `POST /api/scans`
- Status state machine: `new` → `running` → `ready|error`
- Status endpoint returns `{status, progress: {phase, percent, errors[]}}`

### Step 1.6: GitHub Ingest Service

**`api/src/services/githubService.ts` implementation:**

1. **Fetch user repos** — `GET /users/:username/repos?sort=pushed&per_page=100`
   - Parse `X-RateLimit-Remaining` and `X-RateLimit-Reset` headers
   - If unauthenticated (no token), limit to top 10 repos by push date
   - If authenticated (user-provided PAT), fetch up to 100 repos

2. **For each repo, fetch:**
   - Languages: `GET /repos/:owner/:repo/languages` → evidence_type `repo_language`
   - Topics: `GET /repos/:owner/:repo/topics` → evidence_type `repo_topic`
   - README: `GET /repos/:owner/:repo/readme` (base64-decode) → evidence_type `readme_snippet`
   - Dependency files: `GET /repos/:owner/:repo/contents/{path}` for known manifests:
     - `package.json` → parse dependencies/devDependencies keys
     - `requirements.txt` → parse package names
     - `go.mod` → parse require block
     - `Cargo.toml` → parse [dependencies]
     - `pom.xml` → parse artifactId elements
   - Latest commit date: `GET /repos/:owner/:repo/commits?per_page=1` → timestamp for recency

3. **Rate limit strategy:**
   - Before each batch of requests, check remaining quota
   - If remaining < 5, wait until reset time
   - Log all rate limit state transitions
   - If completely exhausted, store partial results and mark ingest as `partial`

4. **Evidence creation:**
   - Each language → evidence_item with `strength = min(1, log10(bytes) / 7)` (7 ≈ 10MB)
   - Each topic → evidence_item with `strength = 0.6`
   - Each dependency → evidence_item with `strength = 0.8`
   - README snippets → evidence_item with `strength = 0.4`

### Step 1.7: Resume Upload + Tika Parsing

**Flow:**
1. Frontend sends `POST /api/scans/:id/sources` with `multipart/form-data` (file field: `resume`)
2. Backend (multer memoryStorage) receives file buffer
3. Upload buffer to Supabase Storage: `resumes/{scan_id}/{original_filename}`
4. Send buffer to Tika: `PUT http://TIKA_URL/tika` with `Content-Type: {mime}`, `Accept: text/plain`
5. Store extracted text in `app.artifacts.metadata.extracted_text`
6. Run heuristic extraction on text:
   - **Section detection:** regex for headings (EXPERIENCE, SKILLS, EDUCATION, PROJECTS, etc.)
   - **Bullet parsing:** split on bullet chars, dashes, asterisks, numbered lists
   - **Date parsing:** regex for patterns like `Jan 2022 - Present`, `2020-2023`, `2019`
   - Each bullet under EXPERIENCE/PROJECTS → evidence_type `resume_bullet`
   - Skills section items → evidence_type `resume_bullet` with higher strength

**Error handling:**
- Tika connection failure → retry 2x with 2s backoff, then error
- Unsupported file type → 422 with message
- File too large (>10MB) → 413 from multer

### Step 1.8: Manual Input

**`POST /api/scans/:id/sources` with `type: 'manual'`**

Request body schema:
```typescript
interface ManualInput {
  skills: Array<{
    name: string;
    selfRating?: number; // 1-5
    yearsExperience?: number;
  }>;
  projects: Array<{
    name: string;
    summary: string;
    stack: string[];
    dateRange?: { start: string; end: string };
    outcomes?: string;
  }>;
  roles: Array<{
    title: string;
    company?: string;
    dateRange?: { start: string; end: string };
    bullets: string[];
  }>;
}
```

Each manual entry creates evidence_items:
- Self-rated skills → `manual_claim` with `strength = selfRating / 5 * 0.6` (capped at 0.6)
- Project stack items → `manual_claim` with `strength = 0.5`
- Role bullets → `manual_claim` with `strength = 0.4`

---

## Phase 2: Skills + Why (Week 4–6) — Normalization & Explainability

### Step 2.1: ESCO Import Script

**`api/scripts/import-esco.ts`:**

1. Read CSV files from `api/data/`:
   - `skills_en.csv` → `ref.esco_skills`
   - Parse `altLabels` column (semicolon-delimited) → `ref.esco_skill_aliases` (one row per alias)
   - `broaderRelationsSkillPillar.csv` → `ref.esco_hierarchy`
   - `skillSkillRelations.csv` → `ref.esco_skill_relations`

2. Use `csv-parse` (stream mode) with batch inserts (500 rows/batch)

3. After import, log stats: skill count, alias count, hierarchy edges, relation edges

4. Store ESCO version metadata in a `ref.esco_metadata` table (version, import date, file checksums)

**Dependencies to add:** `npm install csv-parse`

**Expected volumes:** ~13,500 skills, ~50,000+ aliases, ~14,000 hierarchy edges

### Step 2.2: Skill Mention Extraction

**`api/src/services/evidenceService.ts` — `extractSkillMentions(scanId)`:**

For each evidence_item in the scan:
1. **Dictionary match:** Compare `text_snippet` against ESCO aliases (lowercased, punctuation-stripped)
2. **Dependency mapping:** Use curated `depSkillMap.ts`:
   ```typescript
   const DEP_SKILL_MAP: Record<string, string[]> = {
     'react': ['React', 'JavaScript'],
     'express': ['Express.js', 'Node.js'],
     'tensorflow': ['TensorFlow', 'machine learning'],
     'pandas': ['pandas', 'Python', 'data analysis'],
     'django': ['Django', 'Python'],
     'spring-boot': ['Spring Boot', 'Java'],
     // ... ~200 entries for MVP
   };
   ```
3. **Language mapping:** Map GitHub language names to skill names
4. **Topic mapping:** GitHub topics often match skill names directly

Each match creates a `skill_mention` record linked to the evidence_item.

### Step 2.3: Normalization Pipeline

**`api/src/services/normalizationService.ts` — `normalizeSkillMentions(scanId)`:**

For each skill_mention:

**Stage 1 — Exact match:**
```sql
SELECT esco_uri, preferred_label
FROM ref.esco_skill_aliases
WHERE lower(alias) = lower($1)
```
If found → create `skill_normalization` with `method='exact'`, `score=1.0`, `is_primary=true`

**Stage 2 — Trigram match (if no exact):**
```sql
SELECT esco_uri, preferred_label, similarity(alias, $1) AS sim
FROM ref.esco_skill_aliases
WHERE alias % $1
ORDER BY alias <-> $1
LIMIT 5
```
If top result has `sim >= 0.4` → create normalization with `method='trigram'`, `score=sim`
Mark highest-scored as `is_primary=true`

**Stage 3 — Context boost (re-rank trigram candidates):**
- If evidence context contains keywords related to a candidate, add +0.1 to score
- Re-sort and update `is_primary`

**Stage 4 — Manual override (later via UI):**
- User selects correct ESCO skill for a mention
- Create normalization with `method='manual_override'`, `score=1.0`, `is_primary=true`
- Unset previous `is_primary` for that mention

### Step 2.4: Evidence Graph API

**Endpoints:**

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/scans/:id/views/evidence` | All evidence items with skill mentions |
| `GET` | `/api/scans/:id/views/skills` | Normalized skills with evidence links |
| `PUT` | `/api/scans/:id/skills/:mentionId/normalize` | Override normalization |

**Response shape for `/views/skills`:**
```typescript
interface SkillView {
  esco_uri: string;
  preferred_label: string;
  score: number;
  evidence_count: number;
  evidence: Array<{
    id: string;
    type: string;
    text_snippet: string;
    source_type: string;
    strength: number;
    ref: object;
  }>;
  normalization_method: string;
  normalization_confidence: number;
}
```

### Step 2.5: Evidence Drawer UI

**`web/src/components/evidence/EvidenceDrawer.tsx`:**
- Slide-in panel from right side
- Triggered by clicking any skill in any view
- Shows: skill name, ESCO URI, overall score, normalization method
- Lists all evidence items grouped by source type (GitHub, Resume, Manual)
- Each evidence card shows: snippet, source reference, strength badge
- "Override mapping" button opens search modal to pick different ESCO skill
- "Remove skill" button to exclude false positives

---

## Phase 3: Genome Views (Week 7–9) — Visualization & Scoring

### Step 3.1: Skill Strength Scoring

**`api/src/services/scoringService.ts` — `computeSkillScores(scanId)`:**

For each unique ESCO skill (from `is_primary=true` normalizations):
1. Gather all evidence items linked through mentions → normalizations
2. Compute per-item weight:
   ```
   item_weight = strength * source_reliability * recency_weight
   ```
   Where:
   - `source_reliability`: dependency=1.0, repo_language=0.8, repo_topic=0.7, resume_bullet=0.6, readme_snippet=0.4, manual_claim=0.5
   - `recency_weight`: `1 / (1 + days_since / 365)` (half-life ~1 year)
3. Aggregate: `score = 1 - Product(1 - item_weight_i)` (saturating accumulation)
4. Store in `app.user_skill_scores` with `top_evidence_ids` (top 5 by weight)

### Step 3.2: Clustering (KMeans MVP)

**`api/src/services/clusteringService.ts`:**

MVP approach (pure JS, no Python dependency):
1. Build a co-occurrence feature vector for each skill:
   - Dimension = number of sources (repos + resume sections + manual entries)
   - Value = 1 if skill appeared in that source, 0 otherwise
2. Run KMeans (`ml-kmeans` npm package) with k = `Math.min(Math.ceil(numSkills / 5), 8)`
3. For 2D coordinates, use PCA (`ml-pca` npm package):
   - Reduce co-occurrence vectors to 2D
   - Store x, y per skill in `app.cluster_memberships`
4. Label clusters by their top 3 skills (by score)
5. Store cluster metadata in `app.clusters`

**Dependencies to add:** `npm install ml-kmeans ml-pca`

**Validation:** Compute silhouette score per cluster; if < 0.2, try k-1 or k+1 and pick best.

### Step 3.3: Skill DNA Map (Force Graph)

**`web/src/components/views/SkillDNAMap.tsx`:**

Use `react-force-graph-2d`:
```bash
cd web && npm install react-force-graph-2d
```

**Features:**
- Nodes: one per normalized skill, sized by score, colored by cluster
- Edges: from ESCO `skill_skill_relations` + co-occurrence edges
- Pre-computed coordinates from PCA → used as initial positions
- Search bar: filter/highlight nodes by name
- Click node → open EvidenceDrawer
- Zoom/pan controls
- Legend showing cluster colors + labels

**Data flow:**
```
GET /api/scans/:id/views/map
→ { nodes: [{id, label, score, cluster, x, y}], edges: [{source, target, weight}] }
```

### Step 3.4: Strength Clusters View

**`web/src/components/views/StrengthClusters.tsx`:**
- Grid of cluster cards
- Each card shows: cluster label, top 5 skills with scores, total skill count
- "Why this cluster" tooltip: lists common sources/evidence types
- Click skill → EvidenceDrawer
- Click card → expand to show all skills

**Data flow:**
```
GET /api/scans/:id/views/clusters
→ { clusters: [{id, label, description, skills: [{esco_uri, label, score}]}] }
```

### Step 3.5: Career Timeline View

**`web/src/components/views/CareerTimeline.tsx`:**

Use Recharts:
```bash
cd web && npm install recharts
```

- X-axis: time periods (quarters or years)
- Y-axis: skill scores or skill count
- Each period shows top 5 skills as stacked segments
- Hover shows skill details for that period
- Cluster evolution as color bands

**Data flow:**
```
GET /api/scans/:id/views/timeline
→ { periods: [{start, end, top_skills: [{label, score}], cluster_summary: {...}}] }
```

### Step 3.6: Gap Analysis

**`api/src/services/gapService.ts`:**

1. **Target role templates** — seed in `supabase/seed.sql` with entries for Frontend Engineer, Backend Engineer, Fullstack Engineer, Data Engineer, ML Engineer
2. **Gap computation:** `gap_score(skill) = target_weight * (1 - user_score(skill))`
3. **Store in `app.gaps`**

**Frontend (`SkillGaps.tsx`):**
- Dropdown to pick target role
- List of gaps sorted by severity
- Each gap shows: skill name, target weight, current score, gap score, rationale
- Click skill → EvidenceDrawer

### Step 3.7: Learning Roadmap

**`api/src/services/roadmapService.ts`:**

1. Take gaps sorted by gap_score
2. Check ESCO hierarchy for prerequisites (broader skills)
3. Order: prerequisites first, then high-gap skills
4. Assign priority (1 = most urgent)
5. Estimate hours: `estimated_hours = gap_score * 40` (rough heuristic)
6. Add resource links: search URLs for skill name

**Frontend (`LearningRoadmap.tsx`):**
- Ordered list of roadmap items
- Each item: priority badge, skill name, estimated hours, description, resources
- Dependency arrows between items
- Progress indicator (placeholder)

---

## Phase 4: Polish & Deploy (Week 10–12)

### Step 4.1: Deletion Endpoint

**`DELETE /api/scans/:id`:**
1. Verify share_token
2. Delete from Supabase Storage: all objects in `resumes/{scan_id}/`
3. Delete scan row (CASCADE deletes all child tables)
4. Insert into `app.deletion_log`
5. Return `{deleted: true, scan_id}`

### Step 4.2: Analysis Orchestrator

**`api/src/services/orchestratorService.ts` — `runAnalysis(scanId)`:**

Sequential pipeline:
```
1. Update scan status → 'running'
2. For each source:
   a. GitHub → githubService.ingest(source)
   b. Resume → resumeService.parse(source)
   c. Manual → store as evidence directly
3. extractSkillMentions(scanId)
4. normalizeSkillMentions(scanId)
5. computeSkillScores(scanId)
6. computeClusters(scanId)
7. computeTimeline(scanId)
8. computeGaps(scanId, config.targetRole)
9. generateRoadmap(scanId)
10. Update scan status → 'ready'
```

Error handling: wrap each step in try/catch; on failure store error details in `scan.error_details` and set status to `error`. Allow partial results.

**Progress tracking:** After each major step, update `scan.progress` JSONB field:
```json
{
  "phase": "normalization",
  "percent": 45,
  "steps_completed": ["github_ingest", "resume_parse", "mention_extraction"],
  "errors": []
}
```

Frontend polls `GET /api/scans/:id/status` every 2 seconds.

### Step 4.3: CI/CD Setup

**`.github/workflows/ci.yml`:**
```yaml
name: CI
on: [push, pull_request]
jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Install API deps
        run: npm ci
        working-directory: api
      - name: Install Web deps
        run: npm ci
        working-directory: web
      - name: Type-check API
        run: npm run type-check
        working-directory: api
      - name: Type-check Web
        run: npm run type-check
        working-directory: web
      - name: Build Web
        run: npm run build
        working-directory: web
      - name: Build API
        run: npm run build
        working-directory: api
```

### Step 4.4: Deployment

**Frontend → Vercel:**
- Root directory: `web/`
- Build command: `npm run build`
- Output directory: `dist`
- Env: `VITE_API_URL` → backend URL

**Backend → Render:**
- Root directory: `api/`
- Build: `npm ci && npm run build`
- Start: `node dist/server.js`
- Env: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `TIKA_URL`, `PORT`

**Database → Supabase managed:**
- `npx supabase link --project-ref <ref>` then `npx supabase db push`

**Tika → Render Docker service or Railway**

### Step 4.5: Testing Strategy

**Unit tests (Vitest):**
- ESCO import: CSV parsing, batch insert logic
- Normalization: exact match, trigram ranking, score computation
- Scoring: weight calculation, saturation formula
- Gap/roadmap: deterministic output for fixed input

**Integration tests (Vitest + Supabase local):**
- GitHub service: mock fetch; verify evidence creation
- Resume service: fixture PDF/DOCX; verify Tika call + extraction
- Full pipeline: scan → sources → run → verify computed outputs

**E2E tests (Playwright):**
- Create scan → upload resume → run analysis → map renders → evidence drawer → delete scan

---

## API Contract Summary

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/scans` | None | Create scan |
| `GET` | `/api/scans/:id` | share_token | Get scan |
| `DELETE` | `/api/scans/:id` | share_token | Delete scan + data |
| `POST` | `/api/scans/:id/sources` | share_token | Add source |
| `POST` | `/api/scans/:id/run` | share_token | Trigger analysis |
| `GET` | `/api/scans/:id/status` | share_token | Poll progress |
| `GET` | `/api/scans/:id/views/skills` | share_token | Skill list + evidence |
| `GET` | `/api/scans/:id/views/evidence` | share_token | All evidence items |
| `GET` | `/api/scans/:id/views/map` | share_token | Graph nodes + edges |
| `GET` | `/api/scans/:id/views/clusters` | share_token | Cluster data |
| `GET` | `/api/scans/:id/views/gaps` | share_token | Gap analysis |
| `GET` | `/api/scans/:id/views/timeline` | share_token | Career timeline |
| `GET` | `/api/scans/:id/views/roadmap` | share_token | Learning roadmap |
| `PUT` | `/api/scans/:id/skills/:mentionId/normalize` | share_token | Override mapping |

---

## Dependency Summary

### api/
| Package | Purpose |
|---------|---------|
| `express` (^5.1) | Web framework |
| `cors` | CORS middleware |
| `helmet` | Security headers |
| `multer` | File upload handling |
| `dotenv` | Env var loading |
| `@supabase/supabase-js` | Supabase client |
| `pino` + `pino-pretty` | Structured logging |
| `csv-parse` | ESCO CSV import |
| `ml-kmeans` | KMeans clustering |
| `ml-pca` | PCA dimensionality reduction |
| `zod` | Request validation |

### web/
| Package | Purpose |
|---------|---------|
| `react` + `react-dom` | UI framework |
| `react-router-dom` | Client-side routing |
| `tailwindcss` + `@tailwindcss/vite` | Styling |
| `react-force-graph-2d` | Skill DNA map |
| `recharts` | Timeline/chart rendering |

### Root dev/tooling
| Package | Purpose |
|---------|---------|
| `concurrently` | Run api + web dev servers |
| `supabase` | Local Supabase CLI |
| `vitest` | Unit/integration tests |
| `@playwright/test` | E2E tests |

---

## Execution Order (Detailed Task Sequence)

### Week 1 (Foundation)
1. Create root package.json + .gitignore + .env.example + docker-compose.yml
2. Initialize Supabase + create all 7 migrations
3. Scaffold api/ (Express + TS + deps + config + app.ts + server.ts)
4. Scaffold web/ (Vite + React + Tailwind + routing + basic pages)
5. Implement scan CRUD API (POST/GET/DELETE /scans)
6. Implement share_token middleware
7. Build Landing page + ScanSetup page UI

### Week 2 (Ingest)
8. Implement GitHub ingest service (repos, languages, topics, README, deps)
9. Implement rate-limit handling + caching
10. Implement resume upload endpoint (multer → Storage → Tika)
11. Implement resume heuristic extraction (sections, bullets, dates)
12. Implement manual input endpoint + validation
13. Build GitHubInput, ResumeUpload, ManualInput components
14. Wire up ScanSetup page to POST /sources

### Week 3 (Evidence + ESCO)
15. Write ESCO import script + run against CSV data
16. Build dependency-to-skill curated map (~200 entries)
17. Implement skill mention extraction from evidence items
18. Build evidence list API endpoint
19. Build ProgressTracker component + polling
20. Integration test: create scan → ingest → verify evidence in DB

### Week 4 (Normalization)
21. Implement exact-match normalization
22. Implement trigram normalization with pg_trgm
23. Implement context-boost re-ranking
24. Build normalized skills API endpoint
25. Write normalization unit tests

### Week 5 (Explainability UI)
26. Build EvidenceDrawer component
27. Build skills list view with evidence links
28. Implement normalization override API + UI
29. Wire up click-to-explain across all skill references
30. Build ScanResults page with tab navigation

### Week 6 (Scoring + Pipeline)
31. Implement skill strength scoring service
32. Implement analysis orchestrator (full pipeline)
33. Build ScanProgress page with real-time updates
34. End-to-end test: full pipeline from creation to scored skills

### Week 7 (Clustering + Map)
35. Implement KMeans clustering service
36. Implement PCA coordinate generation
37. Build SkillDNAMap component with react-force-graph-2d
38. Add search, filter, zoom controls to map
39. Build map API endpoint

### Week 8 (Remaining Views)
40. Build StrengthClusters component
41. Implement gap analysis service + seed target role templates
42. Build SkillGaps component with target role picker
43. Implement timeline computation service
44. Build CareerTimeline component with Recharts

### Week 9 (Roadmap + Polish)
45. Implement roadmap generation service
46. Build LearningRoadmap component
47. Implement deletion endpoint + cascade + audit log
48. Polish all views: loading states, error states, empty states
49. Responsive design pass on all pages

### Week 10 (Testing)
50. Write unit tests for all services
51. Write integration tests for API endpoints
52. Write E2E tests with Playwright
53. Fix bugs found during testing

### Week 11 (CI/CD + Deploy)
54. Set up GitHub Actions CI pipeline
55. Deploy frontend to Vercel
56. Deploy backend to Render
57. Deploy Tika to Render/Railway
58. Push migrations to Supabase managed
59. Configure environment variables

### Week 12 (QA + Launch)
60. Smoke test full flow on production
61. Performance test: map renders 200+ nodes smoothly
62. Fix production bugs
63. Create seed demo scan for onboarding
64. Final documentation

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| GitHub rate limits block ingest | Accept optional PAT; prioritize repos by push date; cache aggressively |
| Tika parsing quality is poor | Store raw text for debugging; feature-flag for Affinda/Textkernel fallback |
| ESCO normalization accuracy low | Ship trigram + exact match; track accuracy; add embedding stage later |
| Force-graph performance on large graphs | Cap visible nodes at 200; add pagination/filtering; pre-computed coords |
| Clustering quality poor with KMeans | Validate with silhouette score; try multiple k values; HDBSCAN as future upgrade |
| No auth allows data exposure | Capability-based share_token; no token persistence; private Storage bucket; TTL on scans |
