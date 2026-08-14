# Load-out feature spec

Add event packing lists and production tracking to the Inktricate timesheet app.

Written against this repo's actual stack: Express 4 + Drizzle ORM on Neon Postgres, React 18 +
Vite SPA with wouter and TanStack Query, Passport session auth, Tailwind + shadcn/ui.

## What this is

Bindiya uploads a Dubsado contract or invoice PDF. The app reads the line items into a packing
manifest grouped by venue, and she moves each line through production stages day by day until
everything is packed for load-out.

The unit that matters is **physical pieces**, not tasks. A job with 480 thank-you cards and one
welcome sign is 481 pieces across two trucks, and that count is what tells her whether she is
actually ready.

## Non-negotiables

- The Anthropic API key lives in Replit Secrets, read via `process.env`, used **server-side only**.
  It must never reach the Vite client bundle.
- Every new route carries `isAuthenticated`. Client contracts contain pricing and personal contact
  details.
- All data access goes through `server/storage.ts` (`IStorage` + impl), matching the existing
  domain pattern. Routes stay thin. Do not query `db` inline from `routes.ts`.
- Existing timesheet behaviour does not change. This is additive.

## Schema

There is no migration system here. Tables are added by editing `shared/schema.ts` and running
`npm run db:push`, which diffs the schema straight against the database.

Add five tables following the existing `pgTable` conventions in that file, plus `relations()` and
`createInsertSchema` validators exported alongside the rest:

**`events`** — `id` serial PK, `client` text not null, `invoiceNo` text, `eventDate` date,
`sourceFile` text, `createdAt` timestamp defaultNow.

**`venues`** — `id` serial PK, `eventId` integer FK → `events.id` cascade delete, `name` text not
null, `position` integer default 0 (preserves document order).

**`items`** — `id` serial PK, `venueId` integer FK → `venues.id` cascade delete, `name` text not
null, `qty` integer default 1, `spec` text, `stage` integer default 0, `oversized` boolean default
false, `dependency` text, `needsCheck` boolean default false, `position` integer default 0,
`updatedAt` timestamp defaultNow.

**`eventServices`** — `id` serial PK, `eventId` integer FK cascade, `label` text not null.

**`kitChecks`** — composite PK on (`eventId`, `line`); `eventId` integer FK cascade, `line` text,
`checked` boolean default false.

Then one change to the existing table: add a **nullable** `eventId` integer FK on `timeEntries`,
referencing `events.id`. Nullable matters — historical entries and non-event work must keep saving.

Stages, in order. `stage` is the array index, 0 through 4:

```
0  Not started
1  In design
2  In production
3  Ready
4  Packed
```

### Before running db:push

`timeEntries` is populated. Adding a nullable column is low risk, but read the diff drizzle-kit
prints before confirming — push is interactive and will ask about anything it reads as destructive.
If it proposes dropping or renaming anything on an existing table, stop and say so rather than
accepting.

## Storage layer

Add to `IStorage` and the implementing class. Suggested surface:

```ts
getEvents(): Promise<EventSummary[]>            // includes piece counts
getEvent(id: number): Promise<EventDetail | undefined>  // venues, items, services, kit
createEventFromManifest(manifest, sourceFile): Promise<EventDetail>  // transactional
updateItemStage(itemId: number, stage: number): Promise<Item>
setKitCheck(eventId: number, line: string, checked: boolean): Promise<void>
deleteEvent(id: number): Promise<void>
```

`createEventFromManifest` wraps its inserts in a transaction so a partial parse cannot leave a
half-built event behind.

## Routes

Into `server/routes.ts` alongside the rest, all with `isAuthenticated`:

| Method | Path | Does |
|---|---|---|
| GET | `/api/events` | List events, newest first, with piece counts |
| GET | `/api/events/:id` | One event with venues, items, services, kit checks |
| POST | `/api/events/import` | Accept a PDF, parse it, create the event, return it |
| PATCH | `/api/items/:id` | Update `stage` |
| PUT | `/api/events/:id/kit` | Upsert one kit check `{ line, checked }` |
| DELETE | `/api/events/:id` | Cascade delete |

Follow the existing handler shape: `async (req, res)`, try/catch, `parseInt` path params, Zod
`.parse()` on bodies using schemas from `shared/schema.ts`, `z.ZodError` → 400, else 500.

`PATCH /api/items/:id` must validate `stage` is an integer 0–4 and reject anything else.

## The import route

Two net-new capabilities for this codebase. Neither exists today.

**Multipart upload.** Every current route consumes `express.json()`. Add `multer` with memory
storage, applied only to this route — not globally, so nothing else changes. One file, 10MB cap,
reject anything whose mimetype is not `application/pdf`.

**Outbound Anthropic call.** Add `@anthropic-ai/sdk`. Key from `process.env.ANTHROPIC_API_KEY`,
same pattern as `DATABASE_URL` and `SESSION_SECRET`.

Flow:

1. Multer gives you the buffer. Base64 it.
2. Call the Messages API with a `document` content block plus the extraction prompt below.
   `claude-sonnet-4-5` or newer, `max_tokens: 4000` — a large invoice produces a lot of JSON.
3. Concatenate all `type: "text"` blocks from the response, strip any stray markdown fence,
   `JSON.parse`.
4. Validate the parsed shape with a Zod schema before writing anything. If `venues` is missing or
   empty, return 422 with a readable message rather than writing junk rows.
5. Hand the validated manifest to `storage.createEventFromManifest`.

### Extraction prompt

```
This is a wedding stationery and signage contract or invoice. Extract a packing manifest.

Section headers wrapped in asterisks (for example ****Plaza****) are venue groupings: every
line item after one belongs to that venue until the next header appears. Skip the zero-quantity
header rows themselves. File delivery, setup and breakdown lines as services, not packable items.

Set oversized to true for anything with a dimension over 24 inches or described as a welcome
sign, seating chart, or backdrop. Put any external supplier the item waits on into dependency.

Return ONLY raw JSON, no markdown fence and no preamble:
{"client":"","invoice":"","eventDate":"YYYY-MM-DD or empty string","venues":[{"name":"","items":[{"name":"","qty":0,"spec":"short physical description","oversized":false,"dependency":""}]}],"services":[]}
```

### Parser reality check

Dubsado exports are consistent per account, so once this reads Bindiya's template correctly it
keeps working. Run it against three or four past invoices before trusting it. The known ambiguity:
items that appear after a venue header but belong to a different venue. The parser assigns by
document order and cannot know better — that is what `needsCheck` is for. Surface it in the UI
rather than silently guessing.

## UI

`components/inktricate-loadout.jsx` at the repo root is a **reference implementation, not part of
the app tree**. The real component tree is `client/src/components/`.

Port it to a page at `client/src/pages/loadout.tsx` with a wouter route in `client/src/App.tsx`,
extracting pieces into `client/src/components/loadout/` as makes sense. Convert to TypeScript to
match the codebase.

Four things must change in the port:

1. **`window.storage` does not exist outside a Claude artifact.** Every get/set becomes TanStack
   Query against the routes above, using the existing `apiRequest` helper from
   `client/src/lib/queryClient.ts`. Stage changes should be an optimistic mutation with rollback
   on error — she is tapping these repeatedly and should not wait on a round trip.
2. **The API call in `handlePdf` has no auth header** because the artifact environment proxies it.
   Point it at `/api/events/import` as a `FormData` POST instead.
3. **`seedEvent` is demo data.** Delete it. Empty state should say what to do next: upload a
   contract.
4. **`structuredClone` mutation helpers go away** once server state lives in TanStack Query.

Tailwind is already set up, so the layout classes carry over as-is. The inline brand hex values
are fine to keep — they do not conflict with the HSL-variable theme.

`CREW_KIT` stays a hardcoded constant. It is the same list every job. If Bindiya wants to edit it
later, move it to its own table then.

### Brand colors

Already correct in the reference file, do not substitute:

- Sage / olive `#8A9A5B` — header band
- Forest `#2F4A3C` — accents, completed states, primary buttons
- Mint `#EDF2E6` and cream `#FAF9F3` — section backgrounds
- Charcoal `#2B2B2B` — body text

## Build order

Ship in this sequence so each step is testable on its own:

1. **Schema.** Add the five tables to `shared/schema.ts`, run `db:push`, seed one event by hand
   from invoice 306. Confirm piece counts read 1,017 for Home Puja and 767 for Plaza.
2. **Storage + read/update routes.** Everything except import.
3. **UI port.** Page, route, TanStack Query wiring, empty state. This alone is already useful —
   she can hand-enter the Rajitha job and track it next weekend.
4. **Kit persistence.**
5. **PDF import.** Multer + Anthropic SDK. Highest risk, and everything above works without it.
6. **`eventId` on `timeEntries`** plus a venue picker on the timer.

## Suggested Claude Code prompts

One at a time, on `claude/loadout-wlxns4`.

> Step 1: add the events, venues, items, eventServices and kitChecks tables to shared/schema.ts,
> following the existing pgTable conventions including relations() and createInsertSchema exports.
> Don't touch timeEntries yet. Show me the schema diff, then run db:push and show me what
> drizzle-kit proposes before confirming it.

> Step 2: add the load-out methods to IStorage and its implementation in server/storage.ts, then
> the GET, PATCH, PUT and DELETE routes in server/routes.ts. Match the existing handler shape and
> put isAuthenticated on every route. No inline db queries in routes.ts.

> Step 3: port components/inktricate-loadout.jsx to client/src/pages/loadout.tsx in TypeScript,
> with a wouter route in App.tsx. Replace every window.storage call with TanStack Query using the
> apiRequest helper. Stage changes should be optimistic with rollback. Delete seedEvent and add an
> empty state that prompts uploading a contract.

> Step 5: add the PDF import route. Add multer with memory storage applied only to this route, and
> @anthropic-ai/sdk. Key from process.env.ANTHROPIC_API_KEY, server-side only — it must not appear
> in anything Vite bundles. Use the extraction prompt in docs/LOADOUT_SPEC.md as written. Validate
> the parsed JSON with Zod before writing, wrap inserts in a transaction, return 422 with a
> readable message on parse failure.

## Setup checklist

- [x] Branch created
- [ ] Working on `claude/loadout-wlxns4`, not local `loadout`
- [ ] `docs/LOADOUT_SPEC.md` and the reference `.jsx` committed before any code is generated
- [ ] `ANTHROPIC_API_KEY` in Replit Secrets
- [ ] Grep the built client bundle for the key before deploying — `npm run build` then search
      `dist/` for `sk-ant`
- [ ] Test import against three past Dubsado invoices, not just #306
- [ ] Merge, deploy, hand it to Bindiya with the Rajitha job already loaded
