-- ============================================================================
-- CampusCore — 0005_phase3_additions.sql
-- Phase 3: additive schema changes only — no existing table redefined,
-- no existing RLS policy removed. See README Phase 3 section for rationale.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Announcement read tracking (didn't exist — required for read/unread UI)
-- ----------------------------------------------------------------------------

create table announcement_reads (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references users(id) on delete cascade,
  announcement_id   uuid not null references announcements(id) on delete cascade,
  read_at           timestamptz not null default now(),
  unique (user_id, announcement_id)
);

alter table announcement_reads enable row level security;

create policy "announcement_reads: owner manages own read state" on announcement_reads
  for all using (user_id = current_user_id());

-- ----------------------------------------------------------------------------
-- 2. Missing announcement visibility policies (Phase 1 gap: only
--    'organization' and 'course_offering' scopes had a SELECT policy —
--    'university', 'faculty', 'department' scoped announcements were
--    invisible to everyone, including their intended audience. This is a
--    bug fix, not new functionality.
-- ----------------------------------------------------------------------------

create policy "announcements: university-scoped visible to university members" on announcements
  for select using (
    scope = 'university'
    and scope_id = (select university_id from users where id = current_user_id())
  );

create policy "announcements: department-scoped visible to department members" on announcements
  for select using (
    scope = 'department'
    and scope_id = (select department_id from users where id = current_user_id())
  );

-- 'faculty' scope needs a join — users has department_id, not faculty_id directly.
create policy "announcements: faculty-scoped visible to faculty members" on announcements
  for select using (
    scope = 'faculty'
    and exists (
      select 1 from departments d
      where d.id = (select department_id from users where id = current_user_id())
        and d.faculty_id = announcements.scope_id
    )
  );

-- Matching write policies for admins (no UI built for these yet — Phase 2's
-- admin announcement creation only covered course/org scope implicitly via
-- the existing "staff create for their scope" policy; these close the gap
-- symmetrically so a future admin screen doesn't hit a missing policy).
create policy "announcements: university_admin+ creates university-scoped" on announcements
  for insert with check (
    scope = 'university' and has_role_in_scope('university_admin', 'university_id', scope_id)
    or (scope = 'university' and is_platform_owner())
  );

create policy "announcements: org_admin+ creates department-scoped" on announcements
  for insert with check (
    scope = 'department'
    and exists (
      select 1 from departments d join organizations o on o.department_id = d.id
      where d.id = scope_id and is_org_admin_or_above(o.id)
    )
  );

-- ----------------------------------------------------------------------------
-- 3. Storage buckets — required for Learning Resources and Avatar upload.
--    Cannot be added without touching storage; this is the "absolutely
--    necessary" exception, not a core-schema redesign.
-- ----------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('course-resources', 'course-resources', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- course-resources: private bucket. Path convention is
-- `{course_offering_id}/{resource_id}-{filename}` — the policies below
-- extract course_offering_id from the path and reuse the SAME helper
-- functions (is_enrolled_in / has_staff_access_to) already governing the
-- `resources` table (0002_rls_policies.sql), so file-level access matches
-- row-level access exactly rather than being a second, divergent rule set.
create policy "course-resources: enrolled or staff can read" on storage.objects
  for select using (
    bucket_id = 'course-resources'
    and (
      is_enrolled_in((storage.foldername(name))[1]::uuid)
      or has_staff_access_to((storage.foldername(name))[1]::uuid)
    )
  );

create policy "course-resources: staff can upload" on storage.objects
  for insert with check (
    bucket_id = 'course-resources'
    and has_staff_access_to((storage.foldername(name))[1]::uuid)
  );

create policy "course-resources: uploader or staff can delete" on storage.objects
  for delete using (
    bucket_id = 'course-resources'
    and (owner = auth.uid() or has_staff_access_to((storage.foldername(name))[1]::uuid))
  );

-- avatars: public bucket (read requires no policy — public buckets serve
-- object bytes directly via URL). Writes are restricted to the user's own
-- folder, keyed by their Supabase Auth id (not our internal users.id,
-- since it's available directly as auth.uid() without an extra lookup).
-- Path convention: `{auth_uid}/avatar.<ext>`.
create policy "avatars: users manage their own avatar folder" on storage.objects
  for all using (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ----------------------------------------------------------------------------
-- 4. enroll_student RPC — mobile-compatibility pattern (see README Phase 3
--    section). SECURITY INVOKER (the default, stated explicitly here) is
--    deliberate: this function runs AS the calling user, so the existing
--    `enrollments: org_admin+ writes` RLS policy still gates it exactly as
--    it gates a direct insert. This is NOT a service-role shortcut — it's
--    the same permission check, just expressed once in Postgres instead of
--    once in a Next.js Server Action (and, later, again in a mobile app).
-- ----------------------------------------------------------------------------

create or replace function enroll_student(
  p_student_id uuid,
  p_course_offering_id uuid,
  p_enrollment_type text default 'normal'
)
returns enrollments
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_semester_id uuid;
  v_session_id  uuid;
  v_result      enrollments;
begin
  select co.semester_id, s.academic_session_id
    into v_semester_id, v_session_id
  from course_offerings co
  join semesters s on s.id = co.semester_id
  where co.id = p_course_offering_id;

  if v_semester_id is null then
    raise exception 'Course offering % not found', p_course_offering_id;
  end if;

  insert into enrollments (
    student_id, course_offering_id, semester_id, academic_session_id,
    enrollment_type, approved_by_user_id
  )
  values (
    p_student_id, p_course_offering_id, v_semester_id, v_session_id,
    p_enrollment_type,
    case when p_enrollment_type = 'special_approval' then current_user_id() else null end
  )
  returning * into v_result;

  return v_result;
end;
$$;
