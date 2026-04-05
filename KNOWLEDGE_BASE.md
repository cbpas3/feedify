# Feedify — Knowledge Base

> **Purpose**: Complete project context for LLM handoff. Covers architecture, agent build history, technical decisions, component inventory, and known constraints.

---

## 1. Project Overview

**Feedify** is a mobile-first, local-first AI microlearning web app. Users paste long-form text or a URL; a Gemma 4 language model runs **entirely in the browser** (WebAssembly via `@mediapipe/tasks-genai`) to chunk the content into bite-sized "FeedCards" displayed in a vertical scroll-snapping feed modelled after Instagram Reels / Headway. No cloud AI API is used for core logic — inference is 100% on-device.

- **Stack**: Next.js 15 App Router, TypeScript, Tailwind CSS v4, shadcn/ui, Framer Motion, Supabase (PostgreSQL), Prisma ORM, `@mediapipe/tasks-genai` (WASM), Comlink, Zod v3
- **Testing**: Vitest (unit), Playwright (e2e), GitHub Actions CI
- **Working directory**: `/Users/cbpas/Projects/feedify`
- **Run dev**: `npm install && npx prisma generate && npx prisma migrate deploy && npm run db:seed && npm run dev`

---

## 2. Directory Structure

```
feedify/
├── .env.local.example               # All required env var templates
├── .github/workflows/ci.yml         # Unit + e2e CI (Postgres service container)
├── package.json                     # All deps + scripts
├── next.config.ts                   # WASM + COOP/COEP headers — CRITICAL
├── postcss.config.mjs               # @tailwindcss/postcss (Tailwind v4)
├── components.json                  # shadcn/ui config
├── tsconfig.json                    # Strict, bundler resolution, @/* alias
├── vitest.config.ts                 # jsdom, v8 coverage, 70% threshold
├── playwright.config.ts             # Chromium + Pixel 5, webServer auto-start
│
├── prisma/
│   ├── schema.prisma                # ContentSource + FeedItem models
│   ├── seed.ts                      # 2 sources, 6 feed items (dev seed)
│   └── migrations/
│       ├── 0001_init/               # Tables + CHECK constraints
│       ├── 0002_indexes/            # 5 performance indexes
│       └── 0003_rls/                # Supabase Row Level Security policies
│
└── src/
    ├── generated/prisma/            # Auto-generated Prisma client (gitignored)
    │
    ├── types/
    │   ├── index.ts                 # FeedItem, ContentSource, all enums
    │   ├── worker.ts                # Worker message protocol (discriminated unions)
    │   └── api.ts                   # ApiResponse<T>, request/response shapes
    │
    ├── lib/
    │   ├── schemas.ts               # Zod: FeedItemSchema, FeedItemArraySchema, etc.
    │   ├── db.ts                    # Prisma client singleton (global pattern)
    │   ├── feed-queries.ts          # Typed Prisma helpers: getFeedItems, etc.
    │   ├── actions.ts               # 'use server' wrappers for all API routes
    │   ├── worker-client.ts         # getWorkerProxy() / terminateWorker()
    │   └── model-loader.ts          # fetchWithProgress() streaming download
    │
    ├── workers/
    │   ├── inference.worker.ts      # Comlink InferenceWorker — loadModel + runInference
    │   ├── opfs-cache.ts            # OPFS read/write for model binary
    │   ├── prompt-builder.ts        # Prompt construction + token budget management
    │   ├── json-repair.ts           # 6-stage JSON repair + Zod validation pipeline
    │   └── srs-calculator.ts        # SM-2 spaced repetition math
    │
    ├── hooks/
    │   └── useInference.ts          # React hook: idle→loading-model→inferring→done
    │
    ├── components/
    │   ├── ui/                      # shadcn primitives (Button, Dialog, Progress…)
    │   ├── feed/
    │   │   ├── Feed.tsx             # Scroll-snap container + IntersectionObserver
    │   │   ├── FeedCard.tsx         # Full-viewport card (hook, body, visual, SRS)
    │   │   ├── FeedCardSkeleton.tsx # Animated loading placeholder
    │   │   ├── EmptyFeedCTA.tsx     # Zero-state with "Add Content" prompt
    │   │   └── ReviewBanner.tsx     # Sticky SRS review-due banner
    │   ├── input/
    │   │   ├── SourceInput.tsx      # Full-screen modal: text tab + URL tab
    │   │   └── DragDropZone.tsx     # Drag-and-drop .txt/.md file overlay
    │   ├── overlay/
    │   │   └── ModelLoadingOverlay.tsx  # Full-screen SVG ring progress overlay
    │   ├── nav/
    │   │   └── TopBar.tsx           # Sticky top bar: logo, card count, Add button
    │   └── providers/
    │       └── ClientProviders.tsx  # Root client wrapper (reserved for future providers)
    │
    ├── styles/
    │   └── feed.css                 # scroll-snap CSS (100dvh, snap-type, snap-align)
    │
    └── app/
        ├── globals.css              # Tailwind v4 @theme tokens (oklch palette, shadcn vars)
        ├── layout.tsx               # Root layout: metadata, viewport, ClientProviders
        ├── (feed)/
        │   ├── page.tsx             # Server component: fetches items, renders FeedPageClient
        │   ├── FeedPageClient.tsx   # Client shell: Feed + SourceInput + overlays wired together
        │   └── loading.tsx          # Suspense skeleton
        ├── process/page.tsx         # Redirect → /feed (modal replaced this route)
        └── api/
            ├── sources/route.ts                    # POST /api/sources
            ├── sources/[id]/feed-items/route.ts    # POST /api/sources/:id/feed-items
            ├── feed-items/[id]/mastery/route.ts    # PATCH /api/feed-items/:id/mastery
            └── url-preview/route.ts                # GET /api/url-preview?url=

    tests/
    ├── setup.ts                     # Mock Worker, OPFS, suppress console.warn
    └── unit/
        ├── schemas.test.ts          # Zod schema validation (11 cases)
        ├── prompt-builder.test.ts   # Token budget, card count, prompt format (10 cases)
        ├── json-repair.test.ts      # 6-stage repair pipeline (9 cases)
        ├── srs-calculator.test.ts   # SM-2 intervals, clamp, isDue (13 cases)
        ├── FeedCard.test.tsx        # Component rendering + callbacks (6 cases)
        └── useInference.test.ts     # Hook state transitions + cleanup (6 cases)

e2e/
├── feed.spec.ts                     # Feed page smoke tests
├── source-input.spec.ts             # Modal interactions
├── scroll-snap.spec.ts              # CSS layout assertions via getComputedStyle
└── mastery.spec.ts                  # PATCH API request interception
```

---

## 3. How the App Works (End-to-End Flow)

```
User opens /feed
  → Server component fetches FeedItem[] from Supabase via Prisma
  → FeedPageClient renders Feed (scroll-snap) + TopBar

User clicks "+ Add" → SourceInput modal opens
  → User pastes text or enters URL

User clicks "Generate Feed"
  → createSource() server action: creates ContentSource record (status=PENDING)
  → useInference hook triggers inference.run(rawText, sourceId)

Inside the Web Worker (inference.worker.ts):
  1. loadModel():
     a. Check OPFS cache for model binary (checkModelCache)
     b. Cache miss → fetchWithProgress(MODEL_URL) → stream-write to OPFS
     c. Initialize LlmInference from @mediapipe/tasks-genai with WASM
  2. runInference():
     a. buildPrompt(rawText, estimateCardCount(rawText))
     b. llmInference.generateResponse(prompt, onToken) — streams tokens
     c. repairAndValidate(fullOutput) → ValidatedFeedItem[]

Back in FeedPageClient:
  → saveFeedItems() server action: bulk-inserts FeedItems, marks source DONE
  → router.refresh() → server component re-runs → new cards appear in feed

User swipes through cards
  → "Got it!" → PATCH /api/feed-items/:id/mastery (delta +1, SM-2 interval calculated)
  → "Review Later" → PATCH /api/feed-items/:id/mastery (delta -1)
  → Optimistic UI update via setItems() before server responds
```

---

## 4. Database Schema

### `content_sources`
| Column | Type | Notes |
|--------|------|-------|
| id | TEXT (CUID) | PK |
| user_id | TEXT? | nullable, for future auth |
| title | TEXT | user-provided or extracted |
| source_type | ENUM (TEXT\|URL) | |
| raw_content | TEXT | full input text |
| source_url | TEXT? | nullable |
| status | ENUM (PENDING\|PROCESSING\|DONE\|ERROR) | default PENDING |
| created_at / updated_at | TIMESTAMPTZ | |

### `feed_items`
| Column | Type | Notes |
|--------|------|-------|
| id | TEXT (CUID) | PK |
| content_source_id | TEXT | FK → content_sources (CASCADE) |
| hook | TEXT | ≤120 chars (DB CHECK constraint) |
| body | TEXT | ≤280 chars (DB CHECK constraint) |
| visual_type | ENUM (QUOTE\|CODE\|DIAGRAM\|STAT\|TIP) | |
| visual_code | TEXT? | only for CODE type |
| order_index | INT | 0-based, non-negative |
| mastery_level | INT | 0–5 (DB CHECK 0≤x≤5), default 0 |
| next_review_date | TIMESTAMPTZ? | null until first interaction |
| last_reviewed_at | TIMESTAMPTZ? | |
| created_at / updated_at | TIMESTAMPTZ | |

**Design rationale**: DB-level CHECK constraints enforce data integrity that Zod (application layer) also validates. This dual-validation means even direct DB inserts or API misuse can't store corrupt data. The `mastery_level` and text-length constraints exist at both layers.

### Indexes
- `idx_feed_items_source_id` — most common query pattern (load all cards for a source)
- `idx_feed_items_order (content_source_id, order_index)` — ordered feed display
- `idx_feed_items_next_review` — partial index (WHERE next_review_date IS NOT NULL) for SRS queue
- `idx_content_sources_user` — partial index for future user-scoped queries
- `idx_content_sources_status` — background processing queue

---

## 5. AI Inference Pipeline (Technical Deep-Dive)

### Why local inference?
The product goal is "local-first" — user data never leaves the device for AI processing. `@mediapipe/tasks-genai` v0.10.x ships a WebAssembly build of Google AI Edge (LiteRT), enabling Gemma 4 to run in a browser Worker with no server round-trip.

### WASM + SharedArrayBuffer requirements
MediaPipe's WASM runtime requires `SharedArrayBuffer`, which in turn requires Cross-Origin Isolation headers on every response:
```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Resource-Policy: cross-origin
```
These are set in `next.config.ts` for **all routes** including API routes. **Removing or relaxing these headers will break the entire inference pipeline silently.** As a consequence, all fonts must be self-hosted (no Google Fonts CDN — the CDN response lacks CORP headers).

### Web Worker architecture
The `InferenceWorker` class lives in `src/workers/inference.worker.ts`. It's bundled as a **separate webpack chunk** using the static `new URL('../workers/inference.worker.ts', import.meta.url)` pattern. `Comlink` wraps the Worker with an async Proxy so React components call `proxy.loadModel(progressCb)` and `proxy.runInference(text, tokenCb)` as if they were regular async functions. Callbacks must be wrapped with Comlink's `proxy()` before crossing the MessageChannel boundary.

### OPFS model cache
The Gemma 4 INT4 quantized model is ~1.4 GB. After first download it's cached in the browser's Origin Private File System (OPFS) — a sandboxed filesystem that survives page reloads.

**Critical design**: The download uses `ReadableStream` piped directly to an OPFS `FileSystemWritableFileStream`. This avoids materializing the full 1.4 GB ArrayBuffer in RAM. Cache validity is determined by file existence and non-zero size only — **no byte-size comparison**. The original design compared `file.size` to `NEXT_PUBLIC_GEMMA_MODEL_SIZE_BYTES`, but this caused a re-download on every refresh because the env var (set to a round number) never matched the actual file size. The `_expectedBytes` parameter is kept for API compatibility but ignored.

### Prompt engineering and token budget
The model has a 128K context window. `prompt-builder.ts` handles:
1. **Token estimation**: `chars / 4` (rough BPE approximation)
2. **Output budget**: reserves 5,000 tokens for model output (20 cards × ~250 tokens)
3. **Truncation**: hard-cuts input text at `(128000 - 5500) × 4 chars`, trimming to the last sentence boundary, with a visible `[... content truncated]` suffix
4. **Card count estimation**: `ceil(wordCount / 150)`, capped at 20
5. **Zero-shot prompt**: Explicitly instructs the model to output ONLY a JSON array with no markdown fences, no commentary, precise field names and constraints

### JSON repair pipeline (`json-repair.ts`)
`@mediapipe/tasks-genai` has no native grammar-constrained decoding (unlike llama.cpp's GBNF). The model can produce subtly invalid output. The 6-stage pipeline:
1. Strip markdown ` ```json ``` ` fences
2. Extract outermost `[...]` brackets (handles preamble/postamble text)
3. `JSON.parse()` fast path
4. `jsonrepair` npm package fallback (handles trailing commas, unquoted keys, truncated arrays)
5. Strict `FeedItemArraySchema.parse()` (Zod)
6. Per-item filter: silently skip invalid items, return whatever passes — throws only if 0 items survive

### Spaced Repetition System (SM-2)
Intervals indexed by mastery level 0–5: `[1, 3, 7, 14, 30, 90]` days.
- "Got it!" → `masteryDelta: +1` → `PATCH /api/feed-items/:id/mastery`
- "Review Later" → `masteryDelta: -1`
- Mastery clamped 0–5 server-side; `next_review_date` calculated and stored
- `ReviewBanner` queries `getItemsDueForReview()` (items where `next_review_date ≤ now`)

---

## 6. Key Technical Decisions & Rationale

### Next.js App Router + Server Components
Feed items are fetched in a **server component** (`(feed)/page.tsx`) using Prisma directly — no API round-trip, no client-side data fetching library. The client receives pre-serialized `FeedItem[]` as props. Interactive parts (mastery updates, modal, Worker) are isolated in `FeedPageClient.tsx` (`'use client'`). This maximises SSR performance for the initial feed render.

### Tailwind v4 (CSS-native)
Tailwind v4 has no `tailwind.config.js`. All customization lives in `src/app/globals.css` via `@theme {}`. Colors use OKLCH color space for perceptual uniformity. The PostCSS plugin is `@tailwindcss/postcss` (not the v3 plugin). shadcn/ui CSS variables are mapped to Tailwind v4 `@theme` tokens — this required careful alignment of variable names.

### `100dvh` everywhere
All height-critical elements use `100dvh` (dynamic viewport height) not `100vh`. On mobile browsers (especially iOS Safari), `100vh` includes the browser chrome (address bar), causing content to be obscured. `100dvh` tracks the actual visible viewport.

### Scroll-snap in `feed.css` (not Tailwind utilities)
CSS properties `scroll-snap-type` and `scroll-snap-align` can't be cleanly expressed with Tailwind v4 utilities without custom configuration. They live in `src/styles/feed.css` and are applied via class names (`.feed-container`, `.feed-item`) imported in `Feed.tsx`.

### Optimistic mastery updates
`FeedPageClient.handleMasteryUpdate` calls `setItems()` immediately before the `updateMastery()` server action resolves. This keeps the swipe gesture feeling instant even on slow connections.

### `router.refresh()` instead of `router.push()`
After inference completes and feed items are saved, the page calls `router.refresh()`. This re-runs the server component's Prisma query without a full navigation, preserving the client component's state (Worker instance, modal state).

**Critical**: `useState(initialItems)` only runs on first mount — `router.refresh()` delivers new props to `FeedPageClient` but React ignores them because the state already exists. A `useEffect` in `FeedPageClient` syncs `items` state whenever `initialItems` changes, so newly generated cards actually appear after a refresh.

### Zod v3 (not v4)
`package.json` pins `"zod": "^3.24.1"` because Zod v4 has breaking API changes. The schemas use standard v3 patterns (`.min()`, `.max()`, `.nativeEnum()`, `.refine()`).

### Prisma generator output path
The Prisma client is generated to `src/generated/prisma` (not `node_modules/.prisma`). This is a Supabase-recommended pattern for edge compatibility. The path is gitignored; `npm run db:generate` must be run after `npm install`.

### `DIRECT_URL` vs `DATABASE_URL`
Supabase provides two connection strings:
- `DATABASE_URL` → PgBouncer pooler (port 6543) — for application queries
- `DIRECT_URL` → direct Postgres (port 5432) — required for `prisma migrate deploy`

Both are required in `.env.local`. Using the pooler URL for migrations will fail.

---

## 7. API Routes

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/sources` | Create a ContentSource (status=PENDING). Validates with `ProcessSourceRequestSchema`. Returns `{ id }`. |
| POST | `/api/sources/:id/feed-items` | Bulk-insert FeedItems from AI output. Validates each with `FeedItemSchema`. Marks source status=DONE. |
| PATCH | `/api/feed-items/:id/mastery` | Update mastery level (±1, clamped 0–5). Calculates `next_review_date` using SM-2 intervals. |
| GET | `/api/url-preview?url=` | Proxy that extracts `<title>` or `og:title` from a URL. 5s timeout, returns URL as fallback title on error. |

All routes return `ApiResponse<T>` shape: `{ data: T, error: null }` or `{ data: null, error: string }`. 400 on validation failure, 404 on missing resource, 500 on unexpected error.

---

## 8. Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Supabase PgBouncer pooler URL |
| `DIRECT_URL` | Yes | Supabase direct Postgres URL (for migrations) |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key |
| `NEXT_PUBLIC_GEMMA_MODEL_URL` | Yes | Direct URL to the `.task` model binary |
| `NEXT_PUBLIC_GEMMA_MODEL_VERSION` | Yes | Cache key string, e.g. `gemma4-int4-v1` |
| `NEXT_PUBLIC_GEMMA_MODEL_SIZE_BYTES` | Yes | Set to `"0"` — size check is disabled; cache validity is determined by file existence + non-zero size only |

`NEXT_PUBLIC_*` vars are inlined at build time by webpack (available inside Web Workers via `process.env.*`).

---

## 9. useInference Hook State Machine

```
idle
  │ run() called
  ▼
loading-model  (modelProgress 0→100)
  │ loadModel() resolves
  ▼
model-ready    (brief intermediate state)
  │ immediately transitions
  ▼
inferring      (inferenceTokens accumulates streaming tokens)
  │ runInference() resolves
  ▼
done           (result = ValidatedFeedItem[])

Any state → error  (if Worker throws)
Any state → idle   (reset() called)
```

**Cache detection**: When the model is in OPFS, `loadModel` calls `onProgress(95)` as its very first progress value (skipping the 0–90% download ramp). The hook detects `firstProgressValue === 95` and sets `isCached = true`, which `ModelLoadingOverlay` uses to show "Initializing from cache" instead of "Downloading".

**Worker lifecycle**: `getWorkerProxy()` lazily creates the Worker singleton. `terminateWorker()` is called in `useEffect` cleanup on component unmount.

---

## 10. Component Architecture

### FeedCard
Full-viewport card (`100dvh`). Sections top-to-bottom:
1. Visual type badge (icon + label, color-coded by type)
2. Hook headline (large bold text)
3. VisualArea — switches on `visualType`:
   - QUOTE: amber-tinted blockquote with Quote icon
   - CODE: terminal-style `<pre>` block with macOS dot decorations, strips markdown fences from `visual_code`
   - STAT: extracts number/percentage from text, renders at large size
   - TIP: yellow-tinted card with Lightbulb icon
   - DIAGRAM: purple-tinted placeholder with GitBranch icon
4. Body text (hidden for CODE and TIP since visual area shows it)
5. Action buttons: "Review Later" (outline) + "Got it!" (primary)
6. Mastery dots (5 dots, filled count = `masteryLevel`) + card counter

### Feed
Scroll-snap container div with `.feed-container` class. Tracks `activeIndex` via `IntersectionObserver` (threshold 0.6) on each `.feed-item` wrapper. Dims non-active cards (`opacity: 0.6`). Falls back to `FeedCardSkeleton` when `isLoading`, `EmptyFeedCTA` when `items.length === 0`.

### SourceInput
Full-screen Dialog (Radix UI). Two-tab switcher (Paste Text / Enter URL) with a custom button group (not Radix Tabs, to avoid focus management conflicts). Drag-and-drop via `DragDropZone` wrapping the textarea. Character counter for text input (100K limit). Inline Progress bar during inference. Submit button disabled when no content or during processing.

### ModelLoadingOverlay
Shown only when `status === 'loading-model'` AND `SourceInput` modal is **closed** — the two progress indicators never appear simultaneously. SVG circle with `strokeDashoffset` animation — no animation library dependency.

---

## 11. Build Configuration Notes

### webpack WASM in `next.config.ts`
Three changes are required for `@mediapipe/tasks-genai`:
1. `config.experiments = { asyncWebAssembly: true, layers: true }` — enables WASM imports
2. `config.externals.push('@mediapipe/tasks-genai')` (server only) — prevents Next.js from attempting to SSR-bundle the WASM package
3. `.wasm` files → `type: 'asset/resource'` — serves WASM as static file with correct MIME type

`layers: true` is specifically required for Worker files to be emitted as separate bundles in Next.js 15.

### Tailwind v4 + shadcn alignment
shadcn's CSS variable names (`--primary`, `--background`, etc.) must be declared inside `@theme {}` in `globals.css`. Tailwind v4 reads `@theme` for all custom tokens. The `components.json` file uses `"cssVariables": true` so shadcn generates components that reference CSS variables instead of hardcoded colors.

### Font strategy
No external font CDN. `globals.css` declares `font-family: 'Inter', system-ui, sans-serif` as the display font. Inter is a system font on most modern operating systems; if missing, the browser falls back to system-ui. This avoids any COEP violations from CDN font responses and ensures offline functionality.

---

## 12. Testing

### Unit tests (`npm run test:unit`)
- **`schemas.test.ts`** — 11 cases: FeedItemSchema field constraints, all VisualType values, FeedItemArraySchema rejection of empty/non-array, ProcessSourceRequestSchema mutual exclusivity
- **`prompt-builder.test.ts`** — 10 cases: token estimation, card count with cap, truncation logic, prompt contains raw text and card count
- **`json-repair.test.ts`** — 9 cases: clean JSON, both fence variants, trailing comma (via jsonrepair), partial recovery skipping items with hook >120 chars, all-invalid throws, no-brackets throws, preamble text ignored
- **`srs-calculator.test.ts`** — 13 cases: interval length + ordering, mastery 0/3/5 intervals, negative/overflow clamping, default date, applyMasteryDelta clamp, isDueForReview past/future/null
- **`FeedCard.test.tsx`** — 6 cases: renders hook, renders visual type label, onGotIt/onReviewLater callbacks, 5 mastery dot elements, CODE visual renders code
- **`useInference.test.ts`** — 6 cases: idle initial state, full status transition, skips loadModel when ready, error on worker throw, reset() returns to idle, terminateWorker on unmount

### Test setup (`src/tests/setup.ts`)
- Stubs global `Worker` class (JSDOM has no Worker implementation)
- Mocks `navigator.storage.getDirectory()` (OPFS not in JSDOM) — returns mock that rejects `getFileHandle` calls
- Suppresses `console.warn` (json-repair partial recovery logs)

### E2e tests (`npm run test:e2e`)
- **`feed.spec.ts`** — page loads, redirect, TopBar visible, Add button opens modal
- **`source-input.spec.ts`** — tab switching, disabled state, character counter, modal close
- **`scroll-snap.spec.ts`** — `scroll-snap-type: y mandatory`, `scroll-snap-align: start`, container height = `window.innerHeight`
- **`mastery.spec.ts`** — intercepts PATCH request via `page.route()`, verifies `{ masteryDelta: 1 }` body
- Two Playwright projects: Desktop Chrome + Pixel 5 (mobile)

### CI (`.github/workflows/ci.yml`)
Two jobs:
1. **unit-tests** — `npm run test:coverage`, uploads coverage artifact
2. **e2e-tests** (gates on unit-tests) — spins up Postgres 16 service container, runs migrations + seed, builds app, runs Playwright Chromium only, uploads report artifact

---

## 13. Build and Run Commands

```bash
# Install dependencies
npm install

# Generate Prisma client (required after npm install and after schema changes)
npx prisma generate

# Run DB migrations (requires DATABASE_URL + DIRECT_URL in .env.local)
npx prisma migrate deploy

# Seed database with demo data (2 sources, 6 cards)
npm run db:seed

# Start development server
npm run dev

# Type-check only
npx tsc --noEmit

# Unit tests
npm run test:unit

# Unit tests with coverage report
npm run test:coverage

# E2e tests (requires dev server running or starts one automatically)
npm run test:e2e

# Production build
npm run build
npm run start
```

---

## 14. Known Issues and Constraints

### Model URL must be configured
`NEXT_PUBLIC_GEMMA_MODEL_URL` must point to a valid, CORS-accessible URL serving the Gemma 4 E2B `.task` binary. Without it, `loadModel()` throws immediately. The model is currently served from HuggingFace (`litert-community/gemma-4-E2B-it-litert-lm`). Recommended browser: Chrome with WebGPU enabled.

### First-run download blocks inference
On first use, the ~2 GB model download must complete before any inference can run. Two progress indicators exist: the inline `Progress` bar inside `SourceInput` modal (for downloads triggered while the modal is open) and the full-screen `ModelLoadingOverlay` SVG ring (shown only when the modal is **closed** during download). Subsequent loads read from OPFS (< 5 seconds). If the user closes the tab mid-download, the partial OPFS write is detected (zero-size file check) and the download restarts from the beginning (no resume support).

### mediapipe constrained decoding not supported
`@mediapipe/tasks-genai` does not implement grammar-constrained decoding (unlike llama.cpp). The JSON repair pipeline (`json-repair.ts`) compensates for model output that deviates from the schema, but extremely poor model outputs with no recoverable JSON array will produce an error. The zero-shot prompt is tuned to reduce this — temperature is set to `0.1` for determinism.

### URL source type is a stub
The `sourceType: 'URL'` flow passes the raw URL string as `rawContent` with a `"Fetch and process content from: {url}"` prefix. The app does not actually fetch and extract the URL's content before inference. A proper implementation would require either a server-side scraper (Next.js API route calling `cheerio` or similar) or client-side fetch through a CORS proxy. This is a known gap in the MVP.

### No user authentication
The database schema includes a nullable `user_id` column and Supabase RLS policies exist, but they currently allow anonymous access (`USING (true)`). All users see all content. User-scoped feeds require Supabase Auth integration and updating the RLS policies to check `auth.uid() = user_id`.

### Single source per feed page
`src/app/(feed)/page.tsx` fetches `getAllSources()` and then loads items from `sources[0]` only. Multi-source feeds (carousel of topics, source selector) are not implemented in the MVP.

### COEP breaks some third-party scripts
Any third-party script or resource that doesn't serve `Cross-Origin-Resource-Policy: cross-origin` will be blocked by the browser when COEP is active. This includes some analytics SDKs, chat widgets, and embedded iframes. Adding any such third-party integration requires either verifying their CORP headers or using `credentialless` COEP mode (less strict, may work in some cases).

---

## 15. Post-Build Fixes

Issues discovered and fixed after initial agent build:

### `.env` password escaping (dotenv interpolation)
**Problem**: The Supabase database password contains `$QF`. dotenv treated `$QF` as an environment variable reference and interpolated it to an empty string, causing authentication failures.
**Fix**: URL-encode `$` as `%24` in both `DATABASE_URL` and `DIRECT_URL`. Dotenv does not decode percent-encoding — the raw `%24` reaches the DB driver which decodes it correctly.

### Prisma reads `.env`, not `.env.local`
**Problem**: Prisma CLI (`prisma migrate deploy`, `prisma generate`) reads `.env` — it does not use Next.js's `.env.local` convention. Migrations failed with "DIRECT_URL not found".
**Fix**: Maintain credentials in `.env` (not `.env.local`). Delete any `.env.local` file to prevent placeholder values from shadowing `.env`.

### Migration 0003 RLS syntax error on Supabase (PostgreSQL 15)
**Problem**: `CREATE POLICY IF NOT EXISTS` syntax was used in the RLS migration. This syntax was added in PostgreSQL 17; Supabase runs PostgreSQL 15.
**Fix**: Remove `IF NOT EXISTS` from all `CREATE POLICY` statements. Rolled back the migration with `prisma migrate resolve --rolled-back 0003_rls`, fixed the SQL, then re-ran `prisma migrate deploy`.

### Seed script missing `--env-file`
**Problem**: `tsx prisma/seed.ts` doesn't automatically load `.env`. The seed script used Prisma client which needs `DATABASE_URL`.
**Fix**: Updated `package.json` `db:seed` script to `tsx --env-file .env prisma/seed.ts`.

### 404 on `/feed`
**Problem**: `src/app/page.tsx` redirected to `/feed`, but `(feed)` is a Next.js route group — it maps to `/`, not `/feed`. Navigating to `/feed` hit a 404.
**Fix**: Changed `page.tsx` to re-export the feed page (`export { default } from './(feed)/page'`). Changed `process/page.tsx` redirect target from `/feed` to `/`.

### OPFS cache eviction on every refresh
**Problem**: `checkModelCache` compared `file.size !== expectedBytes`. The env var was a round number (`2000000000`) and never matched the actual downloaded file size, causing a re-download on every page load.
**Fix**: Removed the size comparison. Cache is now valid if the file exists and has `size > 0`. The `_expectedBytes` parameter is kept but unused.

### Feed not updating after inference completes
**Problem**: After the full pipeline (create source → infer → save → `router.refresh()`), the feed remained empty. `useState(initialItems)` in `FeedPageClient` only uses `initialItems` on first mount — React ignores prop changes to state that already exists. `router.refresh()` delivered new data from the server but the feed state stayed stale.
**Fix**: Added `useEffect(() => { setItems(initialItems) }, [initialItems])` in `FeedPageClient` to sync state when the server component re-renders with fresh data.

### Progress bar for generation phase
**Problem**: The `processingProgress` value during the `inferring` phase was hardcoded to `100`, so the progress bar jumped immediately to full rather than animating as tokens streamed.
**Fix**: Added `inferenceProgress` and `tokenCount` to `useInference` state. The token streaming callback computes `Math.min(99, Math.round((tokenCount / ESTIMATED_MAX_TOKENS) * 100))` on each token. `processingProgress` in `FeedPageClient` now reads `inference.inferenceProgress` during the `inferring` phase.

### UX / visual issues (post-first-render review)
- **QUOTE visual**: Was rendering the hook text again inside the blockquote. Fixed to show the body text instead.
- **Content centering**: Cards lacked horizontal padding — added `px-6 max-w-lg mx-auto` to constrain card content on wide screens.
- **Button weight parity**: "Got it!" and "Review Later" buttons had unequal visual weight. Both are now `outline` style with equal sizing.
- **WCAG pinch-to-zoom**: `maximumScale: 1` was set in viewport meta, disabling pinch-to-zoom (accessibility violation). Removed.
- **Broken card counter**: Counter in the mastery dots area showed incorrect values. Removed from MVP.
- **Add button prominence**: TopBar button relabelled to "Add Content" with clear primary styling.

### Vercel deployment fixes

**`next.config.ts` — `allowedOrigins` blocked server actions in production**
`serverActions: { allowedOrigins: ['localhost:3000'] }` was left in from development. Server actions called from the production domain were rejected. Removed the restriction entirely — Next.js defaults to same-origin only, which is correct for production.

**`src/app/page.tsx` — duplicate route caused `clientReferenceManifest` invariant**
Both `app/page.tsx` (re-exporting `(feed)/page`) and `app/(feed)/page.tsx` resolved to the `/` route. Next.js route groups don't add path segments, so both files mapped to the same path. During static generation, Next.js threw `Invariant: Expected clientReferenceManifest to be defined`. Fix: deleted `app/page.tsx` — the `(feed)` route group's `page.tsx` already owns `/`.

**`src/workers/inference.worker.ts` — `InstanceType<>` fails on private constructor**
`InstanceType<typeof LlmInference>` caused a TypeScript error because `LlmInference` has a private constructor, which TypeScript does not allow as a constraint for `InstanceType<>`. Fixed by typing `llmInstance` as `import('@mediapipe/tasks-genai').LlmInference` directly.

**`src/workers/opfs-cache.ts` — `Uint8Array<ArrayBufferLike>` not assignable to `FileSystemWritableFileStream.write()`**
The `write()` method's type signature expects `Uint8Array<ArrayBuffer>`, but `ReadableStreamDefaultReader.read()` returns `Uint8Array<ArrayBufferLike>` (which includes `SharedArrayBuffer`). In practice the data is always a plain `ArrayBuffer`, so a cast `value as unknown as Uint8Array<ArrayBuffer>` is safe.

**`src/tests/unit/useInference.test.ts` — narrowed literal type incompatible with `run()` return**
`typeof mockValidItems` narrowed `visual_type` to the literal `"TIP"`, but `run()` returns `ValidatedFeedItem[] | null` with the full `VisualType` enum. Changed the result variable type to `ValidatedFeedItem[] | null`.

---

## 16. Agent Build History

Feedify was built using a 6-agent team in the Claude Code multi-agent system. Each agent ran as a background subprocess using the `Agent` tool with `run_in_background: true`.

### Phase 0 — Foundation (parallel)

**A4 `voltagent-lang:typescript-pro`**
Created the shared type contract before any other agent wrote code. Rationale: all other agents need to import from these files — shipping them first eliminates import errors downstream.
- `tsconfig.json` — strict mode, bundler moduleResolution, @/* alias
- `src/types/index.ts` — FeedItem, ContentSource, VisualType/SourceType/SourceStatus enums
- `src/types/worker.ts` — discriminated union Worker message protocol
- `src/types/api.ts` — ApiResponse<T> generic, request/response interfaces
- `src/lib/schemas.ts` — Zod schemas with validation constraints

**A5 `voltagent-lang:sql-pro`** (parallel with A4)
Created the entire database layer. Decision to use DB-level CHECK constraints in addition to Zod: application code can be bypassed (direct DB access, future migrations), but CHECK constraints cannot.
- `prisma/schema.prisma` — full schema with enums, relations, snake_case mapping
- 3 migration SQL files (init, indexes, RLS)
- `src/lib/db.ts` — Prisma singleton (globalThis pattern prevents connection pool exhaustion during Next.js hot reload)
- `prisma/seed.ts` — dev seed with all 5 VisualType variants

### Phase 0 → 1 — Scaffold (sequential, after A4+A5)

**A1 Phase 0 `voltagent-lang:nextjs-developer`**
Could not use `create-next-app` because the directory was non-empty (A4/A5 already created files). All files written manually.
- `package.json`, `next.config.ts`, `postcss.config.mjs`, `components.json`
- Root layout, home page redirect, feed stub, process page stub
- All 4 API routes with full validation and error handling
- Server actions + typed Prisma query helpers
- `src/workers/index.ts` stub for A2

Key decision in `next.config.ts`: COOP/COEP headers configured here (not middleware) because they must apply to the webpack dev server in development, which doesn't run Next.js middleware.

### Phase 1 — Engine + UI (parallel)

**A2 `voltagent-qa-sec:performance-engineer`**
The highest-risk component. Key decisions:
- **OPFS stream-write**: `writeModelToCache` uses `ReadableStream` → `FileSystemWritableFileStream` pipe to avoid RAM spike. A 1.4 GB `ArrayBuffer` would exhaust browser memory on many mobile devices.
- **process.env.NEXT_PUBLIC_*** instead of `self.*`: webpack replaces `process.env.NEXT_PUBLIC_*` at build time even inside Worker bundles. Using `self.*` would require a TypeScript `declare` for `WorkerGlobalScope` augmentation.
- **Comlink `proxy()` for callbacks**: Raw function references can't be transferred across MessageChannel. Comlink's `proxy()` creates a transparent proxy that marshals calls back across the channel.
- **Temperature 0.1**: Low temperature produces more deterministic, schema-adherent JSON output at the cost of some creativity in hook/body phrasing.

Files: `inference.worker.ts`, `opfs-cache.ts`, `prompt-builder.ts`, `json-repair.ts`, `srs-calculator.ts`, `worker-client.ts`, `model-loader.ts`

**A3 `voltagent-core-dev:ui-designer`** (parallel with A2)
Key decisions:
- **100dvh throughout**: Mobile Safari's dynamic viewport requires `dvh` units. `100vh` would cause the bottom action buttons to be partially obscured by the browser chrome.
- **`scrollbar-width: none` + `::-webkit-scrollbar { display: none }`**: Both are needed — Firefox uses `scrollbar-width`, Chrome/Safari use the webkit pseudo-element.
- **feed.css separate file**: Scroll-snap properties not expressible as Tailwind utilities without adding custom plugin config; isolated in a standalone CSS file.
- **OKLCH colors**: Perceptually uniform color space, better for dark-mode palettes than HSL. All brand colors defined in `globals.css` @theme.
- **VisualArea code fence stripping**: `visual_code` from the AI includes ` ```typescript\n...\n``` ` wrapper. The CODE visual area strips these before rendering in the `<pre>` block.

Files: 17 files across `src/styles/`, `src/components/ui/`, `src/components/feed/`, `src/components/input/`, `src/components/overlay/`, `src/components/nav/`

### Phase 2 — Integration (sequential, after A2+A3)

**A1 Phase 2 `voltagent-lang:nextjs-developer`**
Wired together all outputs from A2 and A3.
- Key decision: `showOverlay` gate — `ModelLoadingOverlay` is shown only when `status === 'loading-model'` AND `SourceInput` modal is **closed**. Without this guard, both the full-screen overlay and the modal's inline progress bar would appear simultaneously.
- `useInference.ts` cache detection: `firstProgressValue` closure captures the first `onProgress` value. If it's 95 (OPFS cache hit skips 0–90% download), `isCached` is set to `true`.
- Comlink `proxy()` wrapping moved to `useInference.ts` instead of inline in components — single place to handle the Comlink API.

Files: `useInference.ts`, `ClientProviders.tsx`, updated `layout.tsx`, `FeedPageClient.tsx`, updated `(feed)/page.tsx`, updated `process/page.tsx`

### Phase 3 — Quality (sequential, last)

**A6 `voltagent-qa-sec:test-automator`**
- Vitest `setup.ts` mocks `Worker` and `navigator.storage` (OPFS) — both absent in JSDOM
- `useInference.test.ts` mocks `worker-client` module entirely via `vi.mock()` — avoids needing an actual Worker in jsdom
- E2e `mastery.spec.ts` uses `page.route()` to intercept and mock the PATCH API — tests the request shape without requiring a real database
- `scroll-snap.spec.ts` uses `getComputedStyle` assertions — verifies the CSS is actually applied, not just that the class is present

Files: 14 files across `vitest.config.ts`, `playwright.config.ts`, `src/tests/`, `e2e/`, `.github/workflows/`

---

## 17. Parallel Execution Timeline

```
T+0s   A4 (types) ─────────────────────────────► done ~48s
       A5 (schema) ───────────────────────────────────────────► done ~65s

T+65s  A1 Phase 0 (scaffold) ────────────────────────────────────────────────► done ~174s

T+239s A2 (worker) ───────────────────────────────────► done ~151s
       A3 (UI) ──────────────────────────────────────────────────────────────► done ~218s

T+457s A1 Phase 2 (integration) ──────────────────────────────────────────────► done ~111s

T+568s A6 (tests + CI) ────────────────────────────────────────────────────────► done ~193s

Total wall-clock time: ~761s (~12.7 minutes)
Total files written: ~73
```
