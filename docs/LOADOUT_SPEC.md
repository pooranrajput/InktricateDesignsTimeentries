# Load-out feature spec

Add event packing lists and production tracking to the Inktricate timesheet app.

## What this is

Bindiya uploads a Dubsado contract or invoice PDF. The app reads the line items into a packing
manifest grouped by venue, and she moves each line through production stages day by day until
everything is packed for load-out.

The unit that matters is **physical pieces**, not tasks. A job with 480 thank-you cards and one
welcome sign is 481 pieces across two trucks, and that count is what tells her whether she is
actually ready.

## Non-negotiables

- The Anthropic API key lives in Replit Secrets and is used **server-side only**. It must never
  reach the browser bundle.
- PDF upload is authenticated the same way the rest of the app is. Client contracts contain
  pricing and personal contact details.
- Existing timesheet behaviour does not change. This is additive.

## Data model

Adjust types to whatever the repo already uses. If the app is on SQLite, `jsonb` becomes `text`
holding JSON and `serial` becomes `integer primary key autoincrement`.

```sql
create table events (
  id           serial primary key,
  client       text not null,           -- "Rajitha + Ambar"
  invoice_no   text,                    -- "306"
  event_date   date,
  source_file  text,                    -- original PDF filename
  created_at   timestamptz default now()
);

create table venues (
  id        serial primary key,
  event_id  integer not null references events(id) on delete cascade,
  name      text not null,              -- "Home Puja", "Plaza"
  position  integer not null default 0  -- document order
);

create table items (
  id          serial primary key,
  venue_id    integer not null references venues(id) on delete cascade,
  name        text not null,
  qty         integer not null default 1,
  spec        text,                     -- "3ft x 7ft, 3D lotuses, irregular shape"
  stage       integer not null default 0,  -- index into the stage list below
  oversized   boolean default false,
  dependency  text,                     -- "Floral arrangement from Design House"
  needs_check boolean default false,    -- venue assignment uncertain
  position    integer not null default 0,
  updated_at  timestamptz default now()
);

create table event_services (
  id       serial primary key,
  event_id integer not null references events(id) on delete cascade,
  label    text not null               -- "Delivery / setup / breakdown - Plaza"
);

create table kit_checks (
  event_id integer not null references events(id) on delete cascade,
  line     text not null,
  checked  boolean default false,
  primary key (event_id, line)
);
```

Stages, in order. `stage` is the array index, 0 through 4:

```
0  Not started
1  In design
2  In production
3  Ready
4  Packed
```

### Link to the timesheet

Add a nullable `event_id` to the existing time entries table, foreign-keyed to `events`. Leave it
nullable so historical entries and non-event work still save. This is what eventually answers
"how many hours does a Plaza-sized job actually cost us," which feeds pricing.

## Routes

| Method | Path | Does |
|---|---|---|
| GET | `/api/events` | List events, newest first, with piece counts |
| GET | `/api/events/:id` | One event with venues, items, services, kit checks |
| POST | `/api/events/import` | Accept a PDF, parse it, create the event, return it |
| PATCH | `/api/items/:id` | Update `stage` (and optionally spec, qty, flags) |
| PUT | `/api/events/:id/kit` | Upsert one kit check `{ line, checked }` |
| DELETE | `/api/events/:id` | Cascade delete |

`PATCH /api/items/:id` should validate `stage` is an integer 0-4 and reject anything else.

## The import route

This is the only genuinely tricky part. Flow:

1. Accept `multipart/form-data`, one PDF, cap it at ~10MB. Reject non-PDF mimetypes.
2. Base64 the buffer.
3. Call the Anthropic Messages API server-side with a `document` content block plus the extraction
   prompt below. Use `claude-sonnet-4-5` or newer, `max_tokens: 4000` (a large invoice produces a
   lot of JSON — do not leave this at 1000).
4. Concatenate all `type: "text"` blocks from `data.content`, strip any stray markdown fence,
   `JSON.parse`.
5. Validate the parsed shape before writing. If `venues` is missing or empty, return a 422 with a
   readable message rather than writing junk rows.
6. Insert inside a transaction so a partial parse cannot leave half an event behind.

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
keeps working. But run it against three or four past invoices before trusting it. The known
ambiguity: items that appear after a venue header but belong to a different venue. The parser
assigns by document order and cannot know better. That is what `needs_check` is for — surface it
in the UI rather than silently guessing.

## UI

`inktricate-loadout.jsx` is a working reference implementation. It is **not** drop-in ready.
Three things must change when porting:

1. **`window.storage` does not exist outside a Claude artifact.** Every `window.storage.get/set`
   call becomes a fetch against the routes above. Optimistic update on stage change, roll back on
   error.
2. **The API call in `handlePdf` has no auth header** because the artifact environment proxies it.
   Point it at `/api/events/import` instead and let the server hold the key.
3. **`seedEvent` is demo data.** Delete it. Empty state should say what to do next: upload a
   contract.

Also check whether the timesheet app already has Tailwind. If not, either add it or convert the
classes — the colors are already inline styles, so only layout classes are affected.

The `CREW_KIT` constant stays hardcoded for now. It is the same list every job. If Bindiya wants
to edit it later, move it to its own table then.

### Brand colors

Already correct in the reference file, do not substitute:

- Sage / olive `#8A9A5B` — header band
- Forest `#2F4A3C` — accents, completed states, primary buttons
- Mint `#EDF2E6` and cream `#FAF9F3` — section backgrounds
- Charcoal `#2B2B2B` — body text

## Build order

Ship it in this sequence so each step is testable on its own:

1. Migration and models. Seed one event by hand from invoice 306 and confirm the counts read
   1,017 pieces for Home Puja and 767 for Plaza.
2. Read + stage-update routes, wired to the ported UI. This alone is already useful to her.
3. Crew kit persistence.
4. PDF import route last. It is the highest-risk piece and everything else works without it.
5. `event_id` on time entries, plus a venue picker on the timer.

## Suggested Claude Code prompts

Run these one at a time on a branch, not all at once.

**First, before any code:**

> Read this repo and tell me: the framework, the database and query layer, how migrations are
> run, how routes are defined, how auth works on existing routes, and whether Tailwind is set up.
> Don't write any code yet — just report what you find and flag anything in LOADOUT_SPEC.md that
> won't fit the existing patterns.

**Then per step:**

> Implement step 1 of LOADOUT_SPEC.md: the migration and models. Follow the existing migration
> and model conventions in this repo rather than the SQL in the spec verbatim. Seed one event
> from the invoice 306 data in inktricate-loadout.jsx so I can verify the piece counts.

> Implement step 2: the GET and PATCH routes, authenticated the same way existing routes are.
> Then port inktricate-loadout.jsx into our component structure, replacing every window.storage
> call with a fetch against those routes. Delete the seedEvent constant and add an empty state.

> Implement step 4: the PDF import route. The Anthropic key must come from process.env and stay
> server-side. Use the extraction prompt in LOADOUT_SPEC.md as written. Validate the parsed JSON
> before writing, wrap the inserts in a transaction, and return a 422 with a readable message if
> parsing fails.

## Setup checklist

- [ ] `git checkout -b loadout`
- [ ] Copy `LOADOUT_SPEC.md` and `inktricate-loadout.jsx` into the repo (spec in `docs/`, component
      wherever components live)
- [ ] Commit them before generating code, so Claude Code has a clean diff to work against
- [ ] Add `ANTHROPIC_API_KEY` to Replit Secrets
- [ ] Confirm the key is not referenced anywhere client-side before deploying
- [ ] Test import against three past Dubsado invoices, not just invoice 306
- [ ] Merge to main, deploy, hand it to Bindiya with one real upcoming job already loaded
