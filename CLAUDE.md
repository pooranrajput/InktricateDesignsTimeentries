# Inktricate Designs — Time Entries

Internal app for Inktricate Designs, a luxury handcrafted wedding stationery and signage studio in
Parlin, NJ. Tracks staff time and (in progress) event production and packing.

## Stack

Express 4 + Vite/React 18 SPA, TypeScript throughout, ESM, run via tsx. Postgres on Neon via
Drizzle ORM. wouter for routing, TanStack Query for data, Radix + shadcn/ui + Tailwind for UI.
Passport local strategy with express-session, sessions in Postgres.

## Conventions — follow these, don't invent new ones

- **Schema lives in `shared/schema.ts`.** There is no migration system. Add or change tables by
  editing that file and running `npm run db:push`, which diffs straight against the database.
- **Data access goes through `server/storage.ts`** — the `IStorage` interface and its
  implementation. Routes call `storage.*`, not `db` directly. A few QuickBooks routes break this;
  don't copy them.
- **Routes are defined in `server/routes.ts`** inside `registerRoutes(app)`. Handler shape:
  `async (req, res)`, try/catch, `parseInt` path params, Zod `.parse()` on bodies using schemas
  from `shared/schema.ts`, `z.ZodError` → 400, everything else → 500.
- **Auth is middleware:** `isAuthenticated` on anything user-facing, `isAdmin` where it matters.
  Both defined at the top of `routes.ts`. Client fetches use `credentials: "include"`.
- **Components live under `client/src/`** — `components/` (with `ui/`, `admin/`, `employee/`),
  `pages/`, `hooks/`, `lib/`. Aliases: `@/*` → `client/src/*`, `@shared/*` → `shared/*`.
- Server fetches use the `apiRequest` helper in `client/src/lib/queryClient.ts`.

## Guardrails

- **`db:push` runs against a live database with real data.** Always show me the proposed diff and
  wait for confirmation before running it. If it proposes dropping or renaming a column on a
  populated table, stop and tell me rather than accepting.
- **Secrets stay server-side.** Anything in `process.env` used from `client/src/` ends up in the
  Vite bundle. API keys are read in `server/` only, never passed to the client.
- Don't reformat or refactor files you weren't asked to touch. Keep diffs reviewable.
- Ask before adding a dependency.

## Brand

These are the real Inktricate colors. Do not substitute or "improve" them:

- Sage / olive `#8A9A5B` — headers, hero bands
- Forest `#2F4A3C` — accents, completed states, primary buttons
- Mint `#EDF2E6` / cream `#FAF9F3` — section backgrounds
- Charcoal `#2B2B2B` — body text

Business location is Parlin, NJ. Not Jersey City, not Newark.

## Active work

Load-out feature: event packing lists and production tracking, built from Dubsado contract PDFs.
Full spec, schema, routes and build order in @docs/LOADOUT_SPEC.md — read it before working on
anything under `events`, `venues`, `items`, or `loadout`.
