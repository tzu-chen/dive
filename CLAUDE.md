# CLAUDE.md — Dive

A personal, self-hosted reading tracker. Single user, no auth. Main purpose: motivate the user to read more by making the app a pleasure to open. Visual reference: see /docs/mockups/*.html. These are the source of truth for aesthetic decisions. When in doubt, match the mockups over the tokens.

## North stars

1. **Aesthetics first.** This app is a motivation tool. If a technical choice makes the app less pleasant to use, it's the wrong choice. Warm & literary: cream paper, serif headings, stylized book spines, leather-brown accents. See `design-tokens.md` (to be created alongside scaffolding).
2. **Single-user, single-device-aware.** No auth, no multi-tenancy. But access from phone + laptop must work — this is why we have a backend instead of localStorage.
3. **Sessions are the source of truth.** All derived stats (streak, pages-per-day, progress percent, current page) must recompute from the `sessions` table. Never denormalize counters. If a stat can't be derived from sessions, question whether it should exist.
4. **Small surface area.** This is a personal project. Prefer boring, stable tools over clever ones. Every dependency must justify itself.

## Stack

- **Framework:** Next.js (App Router) + TypeScript, strict mode.
- **Data layer:** tRPC over REST-style route handlers. One router per resource (`books`, `sessions`, `notes`, `stats`). Client uses `@tanstack/react-query` via tRPC's React bindings.
- **Database:** SQLite via `better-sqlite3` (synchronous, no pool, fine for single-user). Drizzle ORM for schema + queries. Migrations in `/drizzle`.
- **Styling:** CSS Modules. No Tailwind, no CSS-in-JS runtime. Global tokens in `/styles/tokens.css` as CSS custom properties. Serif: Lora or EB Garamond (self-hosted via `next/font/google`). Sans: Inter for UI chrome only.
- **Book metadata:** Open Library Search API (no key required) for autocomplete + cover fetch. Fall back to Google Books if Open Library misses. Cache lookups in a `book_metadata_cache` table to avoid re-hitting APIs.
- **Deployment:** Run directly with `npm run start` on whatever machine the user is using. SQLite file + fetched cover images live in `./data` (gitignored). No Docker, no process manager — start it when you want it, Ctrl-C when you don't.
- **Testing:** Vitest for unit tests of stat derivation logic (streak, progress). Playwright optional later. Don't add tests for trivial CRUD.

## Data model

See `schema.ts` (Drizzle). High-level:

```
books
  id (uuid)
  title, authors (json string[]), isbn_13, open_library_id
  page_count, published_year
  cover_url (remote) | cover_path (local, if downloaded)
  status: 'want' | 'reading' | 'finished' | 'abandoned'
  started_at, finished_at, abandoned_at (nullable)
  created_at, updated_at

sessions
  id (uuid)
  book_id (fk)
  read_on (date, not datetime — one session per day per book max)
  start_page, end_page
  note (text, nullable — optional thoughts on this session)
  created_at

notes
  id (uuid)
  book_id (fk)
  kind: 'quote' | 'thought'
  body (text)
  page (int, nullable)
  created_at

book_metadata_cache
  query_hash (primary key)
  response_json
  fetched_at
```

Constraints:
- `sessions.end_page >= start_page`
- One session per `(book_id, read_on)` pair — logging twice on the same day updates the existing row.
- A book can have `status = 'reading'` and have zero sessions (just started, haven't logged yet).

## Derived stats (always computed from sessions)

Put these in `/server/stats.ts`. Pure functions, fully unit-tested.

- **Current page (per book):** `max(end_page)` across sessions for that book.
- **Progress percent:** `current_page / page_count`.
- **Daily pages:** sum of `(end_page - start_page)` across all sessions for a given date.
- **Streak:** longest run of consecutive days ending today (or yesterday if today has no session yet — don't break the streak until day's end). Any book counts.
- **7-day dot row:** boolean per day for the last 7 days, "did any session happen."
- **Books finished this year:** count of books where `status = 'finished'` and `finished_at` year matches.
- **Abandoned books do NOT count toward yearly goal.**

## Routes

App Router pages:
- `/` — dashboard (currently reading, streak/stats, up-next queue). Primary view.
- `/book/[id]` — book detail: session log form, session history, notes, status actions (finish / abandon).
- `/library` — all books, filterable by status.
- `/add` — search by title/ISBN, pick from Open Library results, manual-override fields for every auto-filled value.

All data access via tRPC procedures under `/server/routers/`.

## Key UX details (from mockup, don't drift)

- Stylized book spines are the fallback; real cover art from Open Library preferred when available. Download covers to `/data/covers/{book_id}.jpg` on first fetch so the app stays fast and works offline.
- Currently-reading cards: spine on the left, title/author/progress on the right, full-width "log pages" button on mobile.
- Streak shown as 7 dots on mobile header; on desktop shown as a number + "days" in a metric card.
- "Log a session" form is the primary action on `/book/[id]` — prominent, prefilled with today's date and `start_page = current page`.
- Notes styled as "paper slips" with a tan left border accent. Quotes rendered in italic serif; thoughts in regular serif.
- No emoji. No icons from icon libraries unless necessary — lean on typography.
- Always "sentence case" for all UI text. Lowercase metric labels ("streak", "today", "library") — this is a deliberate stylistic choice.

## File layout

```
/app                      # Next.js App Router pages
  /page.tsx               # dashboard
  /book/[id]/page.tsx
  /library/page.tsx
  /add/page.tsx
  /api/trpc/[trpc]/route.ts
/components
  /BookSpine.tsx          # the stylized spine component
  /ProgressBar.tsx
  /SessionForm.tsx
  /MetricCard.tsx
  /NoteCard.tsx
/server
  /db.ts                  # drizzle client
  /schema.ts              # drizzle schema
  /stats.ts               # pure derivation functions
  /openlibrary.ts         # metadata lookup + cover fetch
  /routers/
    books.ts
    sessions.ts
    notes.ts
    stats.ts
  /trpc.ts
/styles
  /tokens.css             # CSS custom properties (colors, fonts, spacing)
  /globals.css
/drizzle                  # migrations
/data                     # gitignored — sqlite file + covers
  /reading.db
  /covers/
Dockerfile
docker-compose.yml
```

## Design tokens (starter values — tune when building)

```css
--paper:         #FAF6EE;
--paper-raised: #FFFDF8;
--paper-sunken: #F3EBDA;
--ink:           #3A2A1A;
--ink-muted:    #5A3E24;
--ink-faded:    #8B6E4E;
--leather:       #8B5E3C;
--gilt:          #C9A876;
--thread:        #E8DCC4;
--border-soft:  rgba(139, 94, 52, 0.15);
--border-firm:  rgba(139, 94, 52, 0.30);

--font-serif: 'Lora', Georgia, serif;
--font-sans:  'Inter', system-ui, sans-serif;
```

## Development workflow

- `npm run dev` — Next.js dev server + auto-run migrations on boot.
- `npm run build && npm run start` — production server (also auto-runs migrations). Bind to `0.0.0.0` so the phone can reach it: `HOSTNAME=0.0.0.0 npm run start`.
- `npm run db:migrate` — apply Drizzle migrations.
- `npm run db:studio` — Drizzle Studio to inspect the DB.
- `npm test` — Vitest for stat derivation.

## What NOT to build (yet)

- No auth. If user ever shares the app, revisit.
- No social features, no sharing, no public pages.
- No reading goals beyond the yearly book count + daily page target.
- No reminders / push notifications.
- No import from Goodreads/StoryGraph — can add later as a one-off script.
- No dark mode — the paper aesthetic is light-first. Dark mode would require a parallel design pass. Don't half-ass it.
- No PWA / offline mode initially. If the user wants "add to home screen" later, revisit.

## Conventions

- TypeScript strict. No `any` except at clear IO boundaries with a cast + comment.
- Server code never imports client code. Shared types go in `/server/types.ts` and are re-exported from tRPC routers.
- Dates stored as ISO strings in SQLite (no date type). Use a single `dateUtil.ts` for parsing/formatting — do not sprinkle `new Date()` across the codebase.
- All database writes go through tRPC mutations. No direct DB calls from page components.
- Prefer server components for data fetching where possible; use tRPC client hooks in client components for interactive pieces (log session form, etc.).
- Do not add a new dependency without noting it in the PR description with a one-line justification.

## Open questions for future iterations

- Yearly GitHub-style heatmap on a `/stats` page.
- Separate "quotes" tab on the book detail page vs. mixing with thoughts.
- Export to JSON backup button.
- Mobile bottom nav: stick with text-only, or add simple line icons.
