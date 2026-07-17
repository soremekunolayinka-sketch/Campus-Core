-- ============================================================================
-- CampusCore — 0006_registration_and_academic_ops.sql
-- Phase 4: Student Course Registration, Timetable (exam support), Calendar.
-- Additive only — no existing table is redefined, no existing RLS policy
-- is removed. See README Phase 4 section for rationale.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Registration windows
-- ----------------------------------------------------------------------------

create table registration_windows (
  id                      uuid primary key default gen_random_uuid(),
  semester_id             uuid not null references semesters(id) on delete cascade,
  opens_at                timestamptz not null,
  closes_at               timestamptz not null,
  requires_approval       boolean not null default false,
  max_units_per_student   integer, -- null = no cap
  created_by_user_id      uuid references users(id) on delete set null,
  created_at              timestamptz not null default now(),
  check (closes_at > opens_at)
);
create index idx_registration_windows_semester on registration_windows(semester_id);

alter table registration_windows enable row level security;

create policy "registration_windows: org members read own org windows" on registration_windows
  for select using (
    exists (
      select 1 from semesters s
      join academic_sessions ases on ases.id = s.academic_session_id
      where s.id = semester_id
        and ases.organization_id = (select organization_id from users where id = current_user_id())
    )
  );

create policy "registration_windows: org_admin+ manages" on registration_windows
  for all using (
    exists (
      select 1 from semesters s
      join academic_sessions ases on ases.id = s.academic_session_id
      where s.id = semester_id and is_org_admin_or_above(ases.organization_id)
    )
  );

-- ----------------------------------------------------------------------------
-- 2. enrollments.status gains 'pending_approval' and 'rejected'
--    (is_enrolled_in() already only recognizes 'active'/'completed' — a
--    pending_approval or rejected row correctly grants NO access as-is,
--    no change needed to that function.)
-- ----------------------------------------------------------------------------

alter table enrollments drop constraint enrollments_status_check;
alter table enrollments add constraint enrollments_status_check
  check (status in ('active', 'completed', 'withdrawn', 'pending_approval', 'rejected'));

-- Helpful for the "sum units this semester" check inside register_for_course().
create index idx_enrollments_student_semester on enrollments(student_id, semester_id);

-- ----------------------------------------------------------------------------
-- 3. Shared helper: is a registration window currently open for this offering?
-- ----------------------------------------------------------------------------

create or replace function is_registration_open_for(target_course_offering_id uuid)
returns boolean
language sql stable
as $$
  select exists (
    select 1
    from course_offerings co
    join registration_windows rw on rw.semester_id = co.semester_id
    where co.id = target_course_offering_id
      and now() between rw.opens_at and rw.closes_at
  )
$$;

-- ----------------------------------------------------------------------------
-- 4. Narrow self-service RLS on enrollments — additive, alongside the
--    existing "enrollments: org_admin+ writes" policy from 0002, which is
--    untouched. Self-service registration NEVER creates carryover/repeat/
--    elective/special_approval rows — those stay exclusively admin-driven
--    via the existing admin flow.
-- ----------------------------------------------------------------------------

create policy "enrollments: student self-registers during an open window" on enrollments
  for insert with check (
    student_id = current_user_id()
    and enrollment_type = 'normal'
    and is_registration_open_for(course_offering_id)
  );

create policy "enrollments: student self-drops during an open window" on enrollments
  for update using (
    student_id = current_user_id()
    and enrollment_type = 'normal'
    and status in ('active', 'pending_approval')
    and is_registration_open_for(course_offering_id)
  );

-- ----------------------------------------------------------------------------
-- 5. timetable_slots: support dated exam entries alongside weekly recurring
--    lecture/practical slots. day_of_week becomes nullable (exam entries use
--    exam_date instead); a check constraint keeps exactly one of the two
--    populated, matching session_type.
-- ----------------------------------------------------------------------------

alter table timetable_slots alter column day_of_week drop not null;
alter table timetable_slots add column session_type text not null default 'lecture'
  check (session_type in ('lecture', 'practical', 'exam'));
alter table timetable_slots add column exam_date date;
alter table timetable_slots add constraint timetable_slots_type_date_check check (
  (session_type = 'exam' and exam_date is not null and day_of_week is null)
  or (session_type in ('lecture', 'practical') and day_of_week is not null and exam_date is null)
);

-- ----------------------------------------------------------------------------
-- 6. calendar_events: add 'add_drop_deadline' type (semester start/end use
--    the existing 'milestone' type — no new type needed for those).
-- ----------------------------------------------------------------------------

alter table calendar_events drop constraint calendar_events_type_check;
alter table calendar_events add constraint calendar_events_type_check
  check (type in ('registration', 'test', 'exam', 'holiday', 'milestone', 'add_drop_deadline'));

-- ----------------------------------------------------------------------------
-- 7. register_for_course() — SECURITY INVOKER, always registers the
--    caller (never takes a student id param), so it can never be used to
--    register someone else even if called directly. Hard invariants
--    (self, normal type, window open) are enforced twice — here AND by
--    the RLS policy in section 4 — so a direct table insert bypassing
--    this function is equally safe. Soft business rules (duplicate check,
--    unit cap) live only here, not in RLS, since they're validation, not
--    a security boundary.
-- ----------------------------------------------------------------------------

create or replace function register_for_course(p_course_offering_id uuid)
returns enrollments
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_semester_id     uuid;
  v_session_id      uuid;
  v_window          registration_windows;
  v_current_units   integer;
  v_course_units    integer;
  v_already         boolean;
  v_result          enrollments;
begin
  select co.semester_id, s.academic_session_id, c.units
    into v_semester_id, v_session_id, v_course_units
  from course_offerings co
  join semesters s on s.id = co.semester_id
  join courses c on c.id = co.course_id
  where co.id = p_course_offering_id;

  if v_semester_id is null then
    raise exception 'Course offering % not found', p_course_offering_id;
  end if;

  select * into v_window
  from registration_windows
  where semester_id = v_semester_id and now() between opens_at and closes_at
  limit 1;

  if v_window.id is null then
    raise exception 'Registration is not currently open for this course.';
  end if;

  select exists (
    select 1 from enrollments
    where student_id = current_user_id()
      and course_offering_id = p_course_offering_id
      and status in ('active', 'pending_approval', 'completed')
  ) into v_already;

  if v_already then
    raise exception 'You are already registered for this course.';
  end if;

  if v_window.max_units_per_student is not null then
    select coalesce(sum(c.units), 0) into v_current_units
    from enrollments e
    join course_offerings co on co.id = e.course_offering_id
    join courses c on c.id = co.course_id
    where e.student_id = current_user_id()
      and e.semester_id = v_semester_id
      and e.status in ('active', 'pending_approval');

    if v_current_units + v_course_units > v_window.max_units_per_student then
      raise exception 'Registering this course would exceed the % unit limit for this semester.', v_window.max_units_per_student;
    end if;
  end if;

  insert into enrollments (
    student_id, course_offering_id, semester_id, academic_session_id,
    enrollment_type, status
  )
  values (
    current_user_id(), p_course_offering_id, v_semester_id, v_session_id,
    'normal',
    case when v_window.requires_approval then 'pending_approval' else 'active' end
  )
  returning * into v_result;

  return v_result;
end;
$$;

-- ----------------------------------------------------------------------------
-- 8. drop_course() — self-service withdrawal, same invariants as above.
-- ----------------------------------------------------------------------------

create or replace function drop_course(p_enrollment_id uuid)
returns enrollments
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_result enrollments;
begin
  update enrollments
  set status = 'withdrawn', updated_at = now()
  where id = p_enrollment_id
    and student_id = current_user_id()
    and enrollment_type = 'normal'
    and status in ('active', 'pending_approval')
    and is_registration_open_for(course_offering_id)
  returning * into v_result;

  if v_result.id is null then
    raise exception 'This course cannot be dropped — it may already be dropped, or the registration window has closed.';
  end if;

  return v_result;
end;
$$;
