# CampusCore — Phase 1 (Foundation)

Digital workspace for university students. First deployment: **Civil Engineering
Scholars' Society (CESS), BOUESTI**. Developed by **Soremekun Olayinka (Structyinks)**.

This is Phase 1 only, per the approved blueprint (`CampusCore_Technical_Blueprint_v3.md`):
project setup, Supabase configuration, database schema, authentication,
multi-tenancy structure, role system, and initial BOUESTI/CESS seed data.
No course workspace, enrollment management UI, resource moderation UI, or
bulk import UI is built yet — those are Phase 3.

---

## 1. Prerequisites

- Node.js 20+
- A free [Supabase](https://supabase.com) project
- The [Supabase CLI](https://supabase.com/docs/guides/cli) (`npm install -g supabase`)

## 2. Set up the database

1. Create a new Supabase project.
2. Link the CLI to it: `supabase link --project-ref <your-project-ref>`
3. Apply the migrations, in order, from `supabase/migrations/`:
   - `0001_init_schema.sql` — all tables
   - `0002_rls_policies.sql` — Row Level Security (the actual access-control
     enforcement layer — see the note in Section 4 below)
   - `0003_audit_triggers.sql` — audit log trigger infrastructure
   - `0004_seed_bouesti_cess.sql` — BOUESTI/CESS tenant hierarchy + a
     representative slice of the Civil Engineering curriculum

   Run: `supabase db push` (applies any migrations not yet applied), or
   paste each file into the SQL Editor in the Supabase dashboard in order.

## 3. Configure the app

```bash
cp .env.example .env.local
```

Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from
your project's **Settings → API** page. `SUPABASE_SERVICE_ROLE_KEY` and
`SUPABASE_PROJECT_ID` aren't required to run Phase 1 locally — they're used
by future bulk-import jobs (Phase 3) and the `db:types` script.

## 4. Install and run

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` — you'll be redirected to `/login`.

## 5. Verifying Phase 1 end-to-end

1. Go to `/register`, create an account. This calls `supabase.auth.signUp`
   and then inserts a matching row into `public.users` (the "profile
   completion" step — see `src/app/(auth)/register/page.tsx`).
2. You'll land on `/dashboard`, which reads your role grants (empty by
   default — you're just a base student) and your enrollments (empty,
   since Phase 1 ships no enrollment UI yet).
3. **Test multi-tenancy/RLS is actually working**, not just "the app looks
   fine": open the Supabase SQL Editor and try querying `users` or
   `enrollments` as the `anon` role without a session — it should return
   nothing. Then check that a second test account, in a different
   (manually seeded) organization, cannot see the first account's data
   even via a direct API call.
4. **Grant yourself an admin role for testing** — no UI exists for this
   yet (that's Phase 3+). Run in the SQL Editor:

   ```sql
   insert into user_roles (user_id, role_id, scope_json)
   select u.id, r.id, jsonb_build_object('organization_id', u.organization_id)
   from users u, roles r
   where u.email = 'your-test-email@example.com' and r.name = 'organization_admin';
   ```

5. **Test the enrollment-not-level access rule** (Blueprint v3 §1): insert
   a row into `enrollments` linking your test user to any seeded
   `course_offerings` row, then reload `/dashboard` — it should appear in
   "Your enrolled courses," regardless of your `current_level`.
6. **Test audit logging**: update any `resources` or `enrollments` row
   (once you've created one) and confirm a corresponding row appears in
   `audit_logs` automatically — this is the trigger from
   `0003_audit_triggers.sql` firing, not application code.

## 6. Known issue to resolve before production deployment

`npm audit` flags a set of Next.js 14.2.x advisories (DoS/cache-poisoning
classes) whose fixes only land in Next 15/16. Next 14.2.35 (pinned here) is
the newest patch on the 14.2 line, but a full fix means a **major-version
upgrade** — which involves real breaking changes in this codebase
specifically (`cookies()`/`headers()` become async in the App Router,
affecting `src/lib/supabase/server.ts` and `src/middleware.ts`).

I deliberately did **not** fold that migration into this Phase 1 pass — it
wasn't part of what was approved, and doing it silently alongside unrelated
foundation work is exactly the kind of scope creep worth avoiding. Recommend
treating "Next.js 15/16 migration" as an explicit, reviewed task before this
goes anywhere near real student data — flagging it now so it doesn't get
lost.

## 7. Phase 2 — Application Layer

Phase 2 adds: a shared app shell (role-aware sidebar nav + logout), `/profile`,
`/admin` (stat cards), `/admin/users` (read-only list), `/admin/courses` and
`/admin/course-offerings` (full CRUD), and `/admin/enrollments` (search a
student, pick a course offering, enroll — replacing manual SQL). No schema
changes were made; every mutation runs through the same cookie-scoped
Supabase client as reads, so **RLS is still the real enforcement layer** —
these pages don't bypass it, they just give you a UI in front of it.

### Granting yourself an admin role to test the `/admin/*` pages

No role-assignment UI exists yet (out of Phase 2 scope). Run this in the
Supabase SQL Editor once you have a registered test account:

```sql
insert into user_roles (user_id, role_id, scope_json)
select u.id, r.id, jsonb_build_object('organization_id', u.organization_id)
from users u, roles r
where u.email = 'your-test-email@example.com' and r.name = 'organization_admin';
```

Log out and back in (or just reload) — the "Administration" section should
now appear in the sidebar, and `/admin` should load instead of redirecting
you to `/dashboard`.

### Testing checklist

1. **Nav is role-aware**: a plain student account sees only Dashboard / My
   Courses / Profile / Logout — no Administration section.
2. **Admin dashboard counts are accurate**: create a course, an offering,
   and an enrollment, and confirm the stat cards update.
3. **Course CRUD**: create a course, edit it, confirm the list reflects
   changes, delete it — confirm any course_offerings built on it are gone
   too (cascade).
4. **Course Offering CRUD**: create an offering for an existing course +
   semester + level, confirm the unique-per-semester constraint surfaces a
   clear error if you try to duplicate one.
5. **Enrollment flow**: from `/admin/enrollments/new`, search for a
   student by name or matric number, pick an offering, submit as
   `carryover`. Confirm it appears in the enrollments list, and — this is
   the important one — **log in as that student and confirm the course
   shows up on their `/dashboard` regardless of their `current_level`**,
   exactly like the manual-SQL test from Phase 1's verification steps.
6. **RLS still holds**: log in as a second, non-admin student account and
   confirm `/admin` redirects them to `/dashboard` — both via the UI and,
   for a real test, via a direct authenticated API call to
   `/rest/v1/courses` with a POST — it should be rejected by RLS, not just
   hidden by the UI.

### Known simplifications (flagged, not hidden)

- **Student search** in the enrollment form filters a client-side list of
  all users in your organization. Fine at CESS/BOUESTI scale; would need a
  server-side debounced search once an organization has hundreds+ of
  students.
- **`/admin/users` is read-only.** Role assignment (granting
  course_rep/class_governor/organization_admin from the UI instead of SQL)
  wasn't in the Phase 2 spec — flagging it as a natural next step.
- **No delete confirmation dialogs yet** on course/offering delete — both
  cascade to dependent rows (offerings → courses; enrollments/resources/etc.
  → offerings). Enrollment removal is a soft "Withdraw" (sets `status`,
  never deletes), which is intentionally safer.
- **`/admin/settings` is a placeholder** — wasn't detailed in the Phase 2
  spec beyond the nav item.

## 8. Phase 3 — Student Experience

Phase 3 adds a real migration (**0005_phase3_additions.sql** — apply it via
`supabase db push`, same as before) plus the student-facing application
layer built on top of it.

### Migration 0005 — what it adds and why

- **`announcement_reads` table** — didn't exist; read/unread status is
  impossible without it. Owner-only RLS.
- **Fixed a real Phase 1 bug**: `university`, `faculty`, and `department`
  scoped announcements had no SELECT policy at all — they were invisible
  to everyone, including their intended audience. Fixed with three new
  policies mirroring the existing `organization`/`course_offering` ones.
- **Two storage buckets**: `course-resources` (private, path-based RLS
  reusing the exact same `is_enrolled_in()`/`has_staff_access_to()`
  functions that already gate the `resources` table — file access and row
  access are governed by one rule, not two that could drift) and `avatars`
  (public read, write restricted to the user's own folder).
- **`enroll_student()` Postgres function** — the mobile-compatibility
  pattern described below, applied for real by refactoring Phase 2's
  `createEnrollment` Server Action to call it.

### The mobile-compatibility pattern

Because the app talks to Supabase directly (not a custom API), a future
React Native/Expo client can reuse the *same* RLS-protected tables via
`@supabase/supabase-js`, which is isomorphic. The one thing that wouldn't
naturally carry over is business logic written as a **Next.js Server
Action** — so where a Server Action encodes a real rule (not just
"insert and redirect"), that rule now lives in a **Postgres function**
instead, callable identically via `supabase.rpc(...)` from web or mobile.
`enroll_student()` is the first, demonstrated example; apply the same
move to future rules as they come up, rather than retrofitting everything
speculatively now.

### What was built

- **Responsive navigation** (`src/components/nav/app-shell.tsx`): persistent
  sidebar ≥768px, slide-in drawer + backdrop + hamburger below that. Same
  `SidebarNav` component either way.
- **Dashboard**: academic summary (enrolled courses, total units, unread
  announcements), quick actions, recent announcements with unread dots,
  enrolled courses list (carried over from Phase 1/2).
- **My Courses** (`/courses`) + **course workspace** (`/courses/[offeringId]`):
  lecturer info, resources list with signed download links (5-minute
  expiry, regenerated per page load — not stored/cached), upload form
  shown *only* to Course Reps/Governors/Admins for that specific offering.
- **Announcements** (`/announcements`, `/announcements/[id]`): list across
  every visibility scope, detail view marks read via a client-side effect
  (not a server-render mutation) calling a Server Action.
- **Profile**: editable name, avatar upload (via the new `avatars`
  bucket), password change (via `supabase.auth.updateUser`). Matric
  number/level intentionally left non-editable — administrative fields,
  not self-service ones.

### Known, deliberate scope boundaries (not oversights)

- **Resource upload is staff-only**, not available to plain students, per
  the existing RLS moderation model from your Phase 1 review. If you want
  any enrolled student to upload, that's a real RLS policy change I
  didn't make without asking — flag it explicitly.
- **No admin UI to create announcements yet** — test by inserting directly:
  ```sql
  insert into announcements (scope, scope_id, title, body, created_by_user_id)
  values ('organization', '00000000-0000-0000-0000-000000000004',
          'Welcome back', 'Second semester begins Feb 1.', '<your admin user id>');
  ```
- **No resource moderation UI yet** — approve a pending upload via:
  ```sql
  update resources set moderation_status = 'approved', moderated_at = now()
  where id = '<resource id>';
  ```

### Testing checklist

1. Apply `0005` (`supabase db push`), confirm `announcement_reads` exists
   and `select * from storage.buckets` shows both new buckets.
2. **Nav**: resize below 768px — hamburger + drawer should appear; tapping
   a link should close the drawer.
3. **Dashboard**: counts should match reality after enrolling a student
   and inserting an announcement (see SQL above).
4. **My Courses → course workspace**: as an enrolled student, confirm
   lecturer info and approved resources show; confirm the upload form is
   *absent* for a plain student and *present* for an account holding
   `course_rep` scoped to that offering.
5. **Announcements**: unread dot on `/announcements` and the dashboard;
   opening a detail page should clear it (reload the list to confirm).
6. **Profile**: change your name, upload an avatar, change your password
   — then log out and back in with the new password to confirm it
   actually took effect (not just that the form said "Saved").
7. **RLS still holds**: as a non-staff student, attempt (via direct API
   call, not just the UI) to POST to the `resources` table for a course
   you're not staff on — should be rejected.

## 9. Phase 4 — Student Academic Operations

Migration **0006_registration_and_academic_ops.sql** (additive only — no
existing table redefined, no existing RLS policy removed):

- **`registration_windows`** table + RLS (org members read, org_admin+ manage).
- **`enrollments.status`** gains `pending_approval` and `rejected`. Nothing
  about `is_enrolled_in()` changed — it already only recognized
  `active`/`completed`, so these new statuses correctly grant zero access
  until an admin approves.
- **Two new, narrow RLS policies** on `enrollments`: students may INSERT a
  row for *themselves*, of type `normal` only, while a registration window
  is open — and may UPDATE their own `active`/`pending_approval` rows to
  `withdrawn` under the same window-open condition. The existing
  `org_admin+ writes` policy from Phase 1 is untouched — it still covers
  every admin override (carryover, repeat, elective, special-approval).
- **`register_for_course()` / `drop_course()`** — `SECURITY INVOKER`
  Postgres functions, following the exact mobile-compatibility pattern
  from `enroll_student()`. Neither takes a student id parameter — they
  always act on `current_user_id()`, so a student can never register or
  drop on someone else's behalf even if the RPC were called directly. Hard
  invariants (self, `normal` type, window open) are enforced twice — once
  in the function, once in RLS — so a direct table write bypassing the
  function is equally safe. Soft business rules (duplicate check, unit
  cap) live only in the function, not RLS, since they're validation, not
  a security boundary.
- **`timetable_slots`** gains `session_type` (`lecture`/`practical`/`exam`)
  and `exam_date`; `day_of_week` becomes nullable. A check constraint
  enforces exactly one of `day_of_week`/`exam_date` is set, matching
  `session_type`.
- **`calendar_events`** gains the `add_drop_deadline` type (semester
  start/end continue to use the existing `milestone` type).

### What was built

- **Admin**: Registration Periods, Timetable, Academic Calendar — full CRUD,
  all following the exact Phase 2 pattern (Server Action → form component →
  list/new/edit pages → `requireRole`). No new architectural pattern.
- **Student registration** (`/register-courses`): shows the open/upcoming/
  closed window state, compulsory and elective offerings for the student's
  current level (a UX default for *what's shown*, not an access-control
  rule — see the code comment in `registration.ts`), a live running unit
  total, and disables registering a course that would exceed the window's
  unit cap. Register/Drop buttons call the RPCs directly via
  `useTransition`, not a `useFormState` form, since these aren't
  traditional form submissions.
- **Student timetable** (`/timetable`): weekly grid for lecture/practical,
  separate list for exams — scoped to enrolled courses via the existing
  `timetable_slots` RLS (`is_enrolled_in()`), same as resources always were.
- **Student academic calendar** (`/calendar`): upcoming/past split with a
  simple days-remaining countdown.
- **Dashboard**: registration status card, upcoming deadlines (next 3
  calendar events), updated quick links.

### Known, deliberate scope note

The Phase 4 architecture review (see the standalone roadmap doc) recommended
operational hardening — automated RLS tests, pagination, rate limiting, the
unresolved Next.js security advisory — **before** shipping a self-service
write feature like registration. That hardening was not part of this pass;
it's still open. The registration RPC's own validation (window checks,
duplicate checks, unit caps, self-only invariants enforced twice) is real
protection for *this* feature specifically, but it doesn't substitute for
the broader hardening recommended for the platform as it takes on real
write volume.

### Testing checklist

1. Apply `0006` (`supabase db push`).
2. As org_admin, open a registration window for the active semester (try
   both with and without `requires_approval`, and with a unit cap).
3. As a student, visit `/register-courses` — confirm the window banner
   matches reality, compulsory/elective sections list only your level's
   offerings, and registering updates the running unit total immediately
   (via `router.refresh()`).
4. Register enough courses to hit the unit cap — the next course's
   Register button should be disabled with a tooltip explaining why.
5. Try registering the same course twice (e.g., open two tabs) — the
   second attempt should surface the RPC's "already registered" error,
   not silently succeed.
6. With `requires_approval` on, confirm the course shows "Pending" on both
   `/register-courses` and the dashboard; approve it via
   `update enrollments set status = 'active' where id = '<id>'` and
   confirm it flips to "Approved" — a real admin approval UI is still a
   follow-up, not built in this pass.
7. Drop a course — confirm it's removed from the registered list and the
   unit total updates.
8. Close the registration window (edit its `closes_at` to the past) —
   confirm the browse/register UI disappears and Drop buttons vanish too
   (dropping is also window-gated).
9. **RLS still holds**: as a student, attempt (via direct API call) to
   INSERT an enrollment with `enrollment_type = 'carryover'` or for a
   different `student_id` — both should be rejected; only `normal` +
   self is permitted through the new self-service policy.
10. Add timetable entries (lecture, practical, and an exam) for a course
    you're enrolled in — confirm `/timetable` shows lecture/practical
    under the correct weekday and the exam under the exam list with its
    date.
11. Add calendar events of a few types — confirm `/calendar` sorts them
    into upcoming/past correctly and the dashboard's "Upcoming deadlines"
    shows the nearest three.

## 10. What's NOT built yet (accurate as of Phase 4)

- Assignment tracking UI (`StudentAssignmentProgress` — schema exists,
  Phase 1; no UI yet)
- Resource moderation UI — approve/reject still SQL-only (see Section 8)
- Admin announcement creation UI — still SQL-only (see Section 8)
- **Registration approval UI** — approving a `pending_approval` enrollment
  is still SQL-only (see Section 9, testing step 6); a real "Approve"
  button on `/admin/enrollments` is the natural next small addition
- Results, GPA/CGPA, Transcript (new module — needs new tables, see the
  architecture roadmap doc)
- Discussions, Quizzes (new modules — needs new tables)
- Bulk import CSV flows (students/curriculum/enrollments)
- Push/real-time notification delivery — schema-ready, intentionally not
  implemented yet
- Messaging (new module)
- Role assignment UI (`/admin/users` is read-only)
- Engineering Tools module
- Audit log viewer UI
- Platform Owner / University Admin onboarding UI
- **Operational hardening** flagged in the Phase 4 architecture review but
  not part of this pass: automated RLS tests, pagination on admin lists,
  server-side student search, rate limiting, and the still-unresolved
  Next.js security advisory (Section 6)

Resolved since Phase 1: enrollment management (Phase 2), course workspace
+ resources + announcements + profile (Phase 3), self-service course
registration + timetable + academic calendar (Phase 4).

## 11. Generating real database types

Once your schema is live:

```bash
npm run db:types
```

This replaces the hand-written stub at `src/types/database.ts` with types
generated from your actual Supabase schema.

---

**License / attribution:** see `LICENSE`. Developed by Soremekun Olayinka
(Structyinks) for the Civil Engineering Scholars' Society, BOUESTI Chapter.
