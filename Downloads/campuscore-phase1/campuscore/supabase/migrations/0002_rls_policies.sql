-- ============================================================================
-- CampusCore — 0002_rls_policies.sql
-- Phase 1: Row Level Security — the single enforcement layer (Blueprint v2 §1.1)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Helper functions — used throughout policies below.
-- All are STABLE (not VOLATILE) so Postgres can cache them per statement.
-- ----------------------------------------------------------------------------

-- Maps the Supabase auth session to our internal users.id
create or replace function current_user_id()
returns uuid
language sql stable
as $$
  select id from users where auth_id = auth.uid()
$$;

create or replace function is_platform_owner()
returns boolean
language sql stable
as $$
  select exists (
    select 1 from platform_admins where user_id = current_user_id()
  )
$$;

create or replace function has_role_in_scope(role_name text, scope_key text, scope_value uuid)
returns boolean
language sql stable
as $$
  select exists (
    select 1
    from user_roles ur
    join roles r on r.id = ur.role_id
    where ur.user_id = current_user_id()
      and r.name = role_name
      and (ur.scope_json ->> scope_key)::uuid = scope_value
  )
$$;

-- organization_admin OR university_admin OR platform_owner for a given organization
create or replace function is_org_admin_or_above(target_organization_id uuid)
returns boolean
language sql stable
as $$
  select
    is_platform_owner()
    or has_role_in_scope('organization_admin', 'organization_id', target_organization_id)
    or exists (
      select 1
      from user_roles ur
      join roles r on r.id = ur.role_id
      join organizations o on o.id = target_organization_id
      where ur.user_id = current_user_id()
        and r.name = 'university_admin'
        and (ur.scope_json ->> 'university_id')::uuid = o.university_id
    )
$$;

create or replace function is_class_governor_for(target_organization_id uuid, target_level integer)
returns boolean
language sql stable
as $$
  select exists (
    select 1
    from user_roles ur
    join roles r on r.id = ur.role_id
    where ur.user_id = current_user_id()
      and r.name = 'class_governor'
      and (ur.scope_json ->> 'organization_id')::uuid = target_organization_id
      and (ur.scope_json ->> 'level')::integer = target_level
  )
$$;

create or replace function is_course_rep_for(target_course_offering_id uuid)
returns boolean
language sql stable
as $$
  select exists (
    select 1
    from user_roles ur
    join roles r on r.id = ur.role_id
    where ur.user_id = current_user_id()
      and r.name = 'course_rep'
      and (ur.scope_json ->> 'course_offering_id')::uuid = target_course_offering_id
  )
$$;

-- Is the current user enrolled (active or completed) in this course offering?
create or replace function is_enrolled_in(target_course_offering_id uuid)
returns boolean
language sql stable
as $$
  select exists (
    select 1 from enrollments
    where student_id = current_user_id()
      and course_offering_id = target_course_offering_id
      and status in ('active', 'completed')
  )
$$;

-- Any staff-level relationship to a course offering: course rep, the level's
-- class governor, or org admin and above for the offering's organization.
create or replace function has_staff_access_to(target_course_offering_id uuid)
returns boolean
language sql stable
as $$
  select
    is_course_rep_for(target_course_offering_id)
    or exists (
      select 1
      from course_offerings co
      join courses c on c.id = co.course_id
      join organizations o on o.department_id = c.department_id
      where co.id = target_course_offering_id
        and (
          is_class_governor_for(o.id, co.level)
          or is_org_admin_or_above(o.id)
        )
    )
$$;

-- ----------------------------------------------------------------------------
-- Enable RLS on every tenant-scoped / user-scoped table
-- ----------------------------------------------------------------------------

alter table universities enable row level security;
alter table faculties enable row level security;
alter table departments enable row level security;
alter table organizations enable row level security;
alter table academic_sessions enable row level security;
alter table semesters enable row level security;
alter table courses enable row level security;
alter table lecturers enable row level security;
alter table course_offerings enable row level security;
alter table users enable row level security;
alter table roles enable row level security;
alter table user_roles enable row level security;
alter table platform_admins enable row level security;
alter table enrollments enable row level security;
alter table resources enable row level security;
alter table assignments enable row level security;
alter table student_assignment_progress enable row level security;
alter table timetable_slots enable row level security;
alter table announcements enable row level security;
alter table course_discussions enable row level security;
alter table planner_tasks enable row level security;
alter table semester_goals enable row level security;
alter table calendar_events enable row level security;
alter table notifications enable row level security;
alter table audit_logs enable row level security;

-- ----------------------------------------------------------------------------
-- Organizational hierarchy — readable by any authenticated member of that
-- tenant; writable only by university_admin+ (or platform_owner).
-- ----------------------------------------------------------------------------

create policy "universities: members can read own" on universities
  for select using (
    is_platform_owner()
    or id = (select university_id from users where id = current_user_id())
  );
create policy "universities: platform_owner manages" on universities
  for all using (is_platform_owner());

create policy "faculties: members can read own university" on faculties
  for select using (
    is_platform_owner()
    or university_id = (select university_id from users where id = current_user_id())
  );
create policy "faculties: university_admin+ manages" on faculties
  for insert with check (is_platform_owner() or has_role_in_scope('university_admin','university_id',university_id));
create policy "faculties: university_admin+ updates" on faculties
  for update using (is_platform_owner() or has_role_in_scope('university_admin','university_id',university_id));
create policy "faculties: university_admin+ deletes" on faculties
  for delete using (is_platform_owner() or has_role_in_scope('university_admin','university_id',university_id));

create policy "departments: members can read own university" on departments
  for select using (
    is_platform_owner()
    or university_id = (select university_id from users where id = current_user_id())
  );
create policy "departments: university_admin+ writes" on departments
  for all using (is_platform_owner() or has_role_in_scope('university_admin','university_id',university_id));

create policy "organizations: members can read own university" on organizations
  for select using (
    is_platform_owner()
    or university_id = (select university_id from users where id = current_user_id())
  );
create policy "organizations: university_admin+ writes" on organizations
  for all using (is_platform_owner() or has_role_in_scope('university_admin','university_id',university_id));

create policy "academic_sessions: members can read own org" on academic_sessions
  for select using (
    is_platform_owner()
    or organization_id = (select organization_id from users where id = current_user_id())
  );
create policy "academic_sessions: org_admin+ writes" on academic_sessions
  for all using (is_org_admin_or_above(organization_id));

create policy "semesters: members can read own org's sessions" on semesters
  for select using (
    is_platform_owner()
    or exists (
      select 1 from academic_sessions s
      where s.id = academic_session_id
        and s.organization_id = (select organization_id from users where id = current_user_id())
    )
  );
create policy "semesters: org_admin+ writes" on semesters
  for all using (
    exists (
      select 1 from academic_sessions s
      where s.id = academic_session_id and is_org_admin_or_above(s.organization_id)
    )
  );

-- ----------------------------------------------------------------------------
-- Course catalog — readable by anyone in the department's university tenant;
-- writable by org_admin+.
-- ----------------------------------------------------------------------------

create policy "courses: readable within own university" on courses
  for select using (
    is_platform_owner()
    or exists (
      select 1 from departments d
      where d.id = department_id
        and d.university_id = (select university_id from users where id = current_user_id())
    )
  );
create policy "courses: org_admin+ writes" on courses
  for all using (
    exists (
      select 1 from departments d
      join organizations o on o.department_id = d.id
      where d.id = department_id and is_org_admin_or_above(o.id)
    )
  );

create policy "lecturers: readable within own university" on lecturers
  for select using (
    is_platform_owner()
    or exists (
      select 1 from departments d
      where d.id = department_id
        and d.university_id = (select university_id from users where id = current_user_id())
    )
  );
create policy "lecturers: org_admin+ writes" on lecturers
  for all using (
    exists (
      select 1 from departments d
      join organizations o on o.department_id = d.id
      where d.id = department_id and is_org_admin_or_above(o.id)
    )
  );

create policy "course_offerings: readable within own university" on course_offerings
  for select using (
    is_platform_owner()
    or exists (
      select 1 from courses c
      join departments d on d.id = c.department_id
      where c.id = course_id
        and d.university_id = (select university_id from users where id = current_user_id())
    )
  );
create policy "course_offerings: org_admin+ writes" on course_offerings
  for all using (
    exists (
      select 1 from courses c
      join organizations o on o.department_id = c.department_id
      where c.id = course_id and is_org_admin_or_above(o.id)
    )
  );

-- ----------------------------------------------------------------------------
-- Users — a user can read/update their own row; admins can read users within
-- their scope; nobody can self-elevate roles (handled by user_roles policies).
-- ----------------------------------------------------------------------------

create policy "users: read own row" on users
  for select using (auth_id = auth.uid());
create policy "users: insert own row (profile completion after sign-up)" on users
  for insert with check (auth_id = auth.uid());
create policy "users: update own row" on users
  for update using (auth_id = auth.uid());
create policy "users: org_admin+ read within org" on users
  for select using (is_org_admin_or_above(organization_id));
create policy "users: platform_owner full access" on users
  for all using (is_platform_owner());

create policy "roles: readable by all authenticated" on roles
  for select using (auth.uid() is not null);

create policy "user_roles: read own roles" on user_roles
  for select using (user_id = current_user_id());
create policy "user_roles: org_admin+ manage within their org/university scope" on user_roles
  for all using (
    is_platform_owner()
    or exists (
      select 1 from users u
      where u.id = user_roles.user_id
        and is_org_admin_or_above(u.organization_id)
    )
  );

create policy "platform_admins: platform_owner only" on platform_admins
  for all using (is_platform_owner());

-- ----------------------------------------------------------------------------
-- Enrollments — the access-control backbone (Blueprint v2 §3.4 / v3 §1)
-- ----------------------------------------------------------------------------

create policy "enrollments: student reads own" on enrollments
  for select using (student_id = current_user_id());
create policy "enrollments: staff reads for their course offerings" on enrollments
  for select using (has_staff_access_to(course_offering_id));
create policy "enrollments: org_admin+ writes" on enrollments
  for all using (
    exists (
      select 1 from course_offerings co
      join courses c on c.id = co.course_id
      join organizations o on o.department_id = c.department_id
      where co.id = course_offering_id and is_org_admin_or_above(o.id)
    )
  );

-- ----------------------------------------------------------------------------
-- Resources — enrollment + approval gate for students; moderation for staff
-- (Blueprint v3 §4)
-- ----------------------------------------------------------------------------

create policy "resources: students see approved resources in enrolled courses" on resources
  for select using (
    moderation_status = 'approved'
    and is_enrolled_in(course_offering_id)
  );
create policy "resources: uploader sees their own submissions regardless of status" on resources
  for select using (uploaded_by_user_id = current_user_id());
create policy "resources: staff sees all statuses for their course offerings" on resources
  for select using (has_staff_access_to(course_offering_id));
create policy "resources: course_rep/governor/org_admin+ can upload" on resources
  for insert with check (has_staff_access_to(course_offering_id));
create policy "resources: org_admin+ moderates (approve/reject/archive)" on resources
  for update using (
    exists (
      select 1 from course_offerings co
      join courses c on c.id = co.course_id
      join organizations o on o.department_id = c.department_id
      where co.id = course_offering_id and is_org_admin_or_above(o.id)
    )
    or uploaded_by_user_id = current_user_id() -- uploader can edit their own pending/rejected submission
  );

-- ----------------------------------------------------------------------------
-- Assignments & progress
-- ----------------------------------------------------------------------------

create policy "assignments: enrolled students read" on assignments
  for select using (is_enrolled_in(course_offering_id));
create policy "assignments: staff manage" on assignments
  for all using (has_staff_access_to(course_offering_id));

create policy "assignment_progress: student manages own" on student_assignment_progress
  for all using (student_id = current_user_id());
create policy "assignment_progress: staff can read for their courses" on student_assignment_progress
  for select using (
    exists (
      select 1 from assignments a
      where a.id = assignment_id and has_staff_access_to(a.course_offering_id)
    )
  );

-- ----------------------------------------------------------------------------
-- Timetable & announcements
-- ----------------------------------------------------------------------------

create policy "timetable: enrolled students read" on timetable_slots
  for select using (is_enrolled_in(course_offering_id));
create policy "timetable: staff manage" on timetable_slots
  for all using (has_staff_access_to(course_offering_id));

-- Announcements are polymorphic by `scope`; a simple, safe default is:
-- any authenticated user within the same university tenant can read
-- university/faculty/department/organization-scoped announcements,
-- and course_offering-scoped ones require enrollment.
create policy "announcements: course-scoped visible to enrolled students" on announcements
  for select using (
    scope = 'course_offering' and is_enrolled_in(scope_id)
  );
create policy "announcements: org-scoped visible to org members" on announcements
  for select using (
    scope = 'organization'
    and scope_id = (select organization_id from users where id = current_user_id())
  );
create policy "announcements: staff create for their scope" on announcements
  for insert with check (
    (scope = 'course_offering' and has_staff_access_to(scope_id))
    or (scope = 'organization' and is_org_admin_or_above(scope_id))
  );

create policy "course_discussions: enrolled students read (reserved feature)" on course_discussions
  for select using (is_enrolled_in(course_offering_id));

-- ----------------------------------------------------------------------------
-- Planner, goals, calendar — personal or org-visible
-- ----------------------------------------------------------------------------

create policy "planner_tasks: owner only" on planner_tasks
  for all using (user_id = current_user_id());

create policy "semester_goals: owner only" on semester_goals
  for all using (user_id = current_user_id());

create policy "calendar_events: org members read" on calendar_events
  for select using (
    organization_id = (select organization_id from users where id = current_user_id())
  );
create policy "calendar_events: org_admin+ writes" on calendar_events
  for all using (is_org_admin_or_above(organization_id));

-- ----------------------------------------------------------------------------
-- Notifications — strictly personal
-- ----------------------------------------------------------------------------

create policy "notifications: owner only" on notifications
  for all using (user_id = current_user_id());

-- ----------------------------------------------------------------------------
-- Audit logs — admin visibility only, scoped (Blueprint v3 §5)
-- ----------------------------------------------------------------------------

create policy "audit_logs: org_admin reads own org" on audit_logs
  for select using (
    is_platform_owner()
    or (organization_id is not null and is_org_admin_or_above(organization_id))
    or (university_id is not null and has_role_in_scope('university_admin','university_id',university_id))
  );
-- Inserts happen only via SECURITY DEFINER trigger functions (0003), never
-- directly from client roles — no client-facing insert policy is defined.
