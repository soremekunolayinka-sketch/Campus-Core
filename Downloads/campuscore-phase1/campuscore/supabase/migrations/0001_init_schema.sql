-- ============================================================================
-- CampusCore — 0001_init_schema.sql
-- Phase 1: Core multi-tenant schema
-- Apply via: supabase db push  (or supabase migration up)
-- ============================================================================

create extension if not exists "pgcrypto"; -- for gen_random_uuid()

-- ----------------------------------------------------------------------------
-- 1. ORGANIZATIONAL HIERARCHY
-- ----------------------------------------------------------------------------

create table universities (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  short_name    text not null,
  slug          text not null unique,
  logo_url      text,
  created_at    timestamptz not null default now()
);

create table faculties (
  id            uuid primary key default gen_random_uuid(),
  university_id uuid not null references universities(id) on delete cascade,
  name          text not null,
  slug          text not null,
  created_at    timestamptz not null default now(),
  unique (university_id, slug)
);

create table departments (
  id                  uuid primary key default gen_random_uuid(),
  faculty_id          uuid not null references faculties(id) on delete cascade,
  university_id       uuid not null references universities(id) on delete cascade, -- denormalized for fast RLS
  name                text not null,
  slug                text not null,
  curriculum_version  text,
  created_at          timestamptz not null default now(),
  unique (faculty_id, slug)
);

create table organizations (
  id            uuid primary key default gen_random_uuid(),
  department_id uuid not null references departments(id) on delete cascade,
  university_id uuid not null references universities(id) on delete cascade, -- denormalized
  name          text not null,
  short_name    text not null,
  logo_url      text,
  created_at    timestamptz not null default now(),
  unique (department_id, short_name)
);

create table academic_sessions (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name            text not null, -- e.g. "2025/2026"
  start_date      date not null,
  end_date        date not null,
  is_active       boolean not null default false,
  created_at      timestamptz not null default now(),
  unique (organization_id, name)
);

create table semesters (
  id                    uuid primary key default gen_random_uuid(),
  academic_session_id   uuid not null references academic_sessions(id) on delete cascade,
  name                  text not null, -- "First Semester" | "Second Semester"
  start_date            date not null,
  end_date              date not null,
  is_active             boolean not null default false,
  created_at            timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 2. COURSE CATALOG
-- ----------------------------------------------------------------------------

create table courses (
  id                uuid primary key default gen_random_uuid(),
  department_id     uuid not null references departments(id) on delete cascade,
  code              text not null,          -- "CEE 214"
  title             text not null,
  units             integer not null default 0,
  default_status    text not null default 'C' check (default_status in ('C','E','R')),
  lecture_hours     integer default 0,
  practical_hours   integer default 0,
  description       text,
  learning_outcomes text[],
  course_contents   text,
  created_at        timestamptz not null default now(),
  unique (department_id, code)
);

create table lecturers (
  id            uuid primary key default gen_random_uuid(),
  department_id uuid not null references departments(id) on delete cascade,
  full_name     text not null,
  title         text,       -- "Engr. Dr.", "Prof.", etc.
  email         text,
  bio           text,
  avatar_url    text,
  created_at    timestamptz not null default now()
);

-- Level is a TAG on course_offerings, not a hierarchy node (Blueprint v2 §1.1, v3 §1)
create table course_offerings (
  id            uuid primary key default gen_random_uuid(),
  course_id     uuid not null references courses(id) on delete cascade,
  semester_id   uuid not null references semesters(id) on delete cascade,
  level         integer not null,           -- 100, 200, 300, 400, 500 — classification only
  status        text not null default 'C' check (status in ('C','E','R')), -- can differ per offering/session
  lecturer_ids  uuid[] default '{}',
  created_at    timestamptz not null default now(),
  unique (course_id, semester_id)
);

-- ----------------------------------------------------------------------------
-- 3. USERS, ROLES, ACADEMIC PROGRESS
-- ----------------------------------------------------------------------------

-- Mirrors auth.users (Supabase Auth) 1:1 via auth_id
create table users (
  id                    uuid primary key default gen_random_uuid(),
  auth_id               uuid not null unique references auth.users(id) on delete cascade,
  email                 text not null unique,
  full_name             text not null,
  matric_number         text,
  university_id         uuid references universities(id) on delete set null,
  department_id         uuid references departments(id) on delete set null,
  organization_id       uuid references organizations(id) on delete set null,
  admission_session_id  uuid references academic_sessions(id) on delete set null,
  current_session_id    uuid references academic_sessions(id) on delete set null,
  current_level         integer,             -- dashboard personalization ONLY — never used for access control
  avatar_url            text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create table roles (
  id    uuid primary key default gen_random_uuid(),
  name  text not null unique check (name in (
    'platform_owner', 'university_admin', 'organization_admin',
    'class_governor', 'course_rep', 'student'
  ))
);

-- scope_json shape by role (Blueprint v3 §2.1):
--   platform_owner       -> {}
--   university_admin     -> { "university_id": "..." }
--   organization_admin   -> { "organization_id": "..." }
--   class_governor       -> { "organization_id": "...", "level": 300 }
--   course_rep           -> { "course_offering_id": "..." }
--   student              -> {}
create table user_roles (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  role_id     uuid not null references roles(id) on delete cascade,
  scope_json  jsonb not null default '{}',
  granted_by  uuid references users(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index idx_user_roles_user on user_roles(user_id);

create table platform_admins (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null unique references users(id) on delete cascade,
  granted_by  uuid references users(id) on delete set null,
  granted_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 4. ENROLLMENT — source of truth for course access (Blueprint v2 §3.4)
-- ----------------------------------------------------------------------------

create table enrollments (
  id                    uuid primary key default gen_random_uuid(),
  student_id            uuid not null references users(id) on delete cascade,
  course_offering_id    uuid not null references course_offerings(id) on delete cascade,
  academic_session_id   uuid not null references academic_sessions(id) on delete cascade,
  semester_id           uuid not null references semesters(id) on delete cascade,
  enrollment_type       text not null default 'normal' check (
    enrollment_type in ('normal','carryover','repeat','elective','special_approval')
  ),
  status                text not null default 'active' check (status in ('active','completed','withdrawn')),
  approved_by_user_id   uuid references users(id) on delete set null,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique (student_id, course_offering_id)
);
create index idx_enrollments_student on enrollments(student_id);
create index idx_enrollments_offering on enrollments(course_offering_id);

-- ----------------------------------------------------------------------------
-- 5. COURSE WORKSPACE MODULES
-- ----------------------------------------------------------------------------

create table resources (
  id                    uuid primary key default gen_random_uuid(),
  course_offering_id    uuid not null references course_offerings(id) on delete cascade,
  title                 text not null,
  description           text,
  category              text not null default 'other', -- lecture_note | past_question | external_link | other
  file_url              text,
  file_type             text,
  file_size_bytes        bigint,
  uploaded_by_user_id   uuid not null references users(id) on delete cascade,
  moderation_status     text not null default 'pending_review' check (
    moderation_status in ('pending_review','approved','rejected','archived')
  ),
  moderated_by_user_id  uuid references users(id) on delete set null,
  moderated_at          timestamptz,
  rejection_reason      text,
  created_at            timestamptz not null default now()
);
create index idx_resources_offering on resources(course_offering_id);
create index idx_resources_moderation on resources(moderation_status);

create table assignments (
  id                    uuid primary key default gen_random_uuid(),
  course_offering_id    uuid not null references course_offerings(id) on delete cascade,
  title                 text not null,
  description           text,
  deadline              timestamptz not null,
  attachment_url        text,
  created_by_user_id    uuid not null references users(id) on delete cascade,
  created_at            timestamptz not null default now()
);

create table student_assignment_progress (
  id            uuid primary key default gen_random_uuid(),
  student_id    uuid not null references users(id) on delete cascade,
  assignment_id uuid not null references assignments(id) on delete cascade,
  status        text not null default 'not_started' check (status in ('not_started','in_progress','completed')),
  completed_at  timestamptz,
  unique (student_id, assignment_id)
);

create table timetable_slots (
  id                    uuid primary key default gen_random_uuid(),
  course_offering_id    uuid not null references course_offerings(id) on delete cascade,
  lecturer_id           uuid references lecturers(id) on delete set null,
  venue                 text,
  day_of_week           integer not null check (day_of_week between 0 and 6), -- 0=Sunday
  start_time            time not null,
  end_time              time not null,
  created_at            timestamptz not null default now()
);

create table announcements (
  id                  uuid primary key default gen_random_uuid(),
  scope               text not null check (
    scope in ('university','faculty','department','organization','course_offering')
  ),
  scope_id            uuid not null, -- polymorphic: id in whichever table `scope` names
  title               text not null,
  body                text not null,
  priority            text not null default 'normal' check (priority in ('low','normal','high')),
  created_by_user_id  uuid not null references users(id) on delete cascade,
  created_at          timestamptz not null default now(),
  expires_at          timestamptz
);
create index idx_announcements_scope on announcements(scope, scope_id);

-- Reserved for Phase 5 (Blueprint v2 §3.5) — table exists now, feature not built
create table course_discussions (
  id                    uuid primary key default gen_random_uuid(),
  course_offering_id    uuid not null references course_offerings(id) on delete cascade,
  created_by_user_id    uuid not null references users(id) on delete cascade,
  created_at            timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 6. PLANNER & CALENDAR
-- ----------------------------------------------------------------------------

create table planner_tasks (
  id                          uuid primary key default gen_random_uuid(),
  user_id                     uuid not null references users(id) on delete cascade,
  title                       text not null,
  description                 text,
  due_date                    date,
  priority                    text not null default 'normal' check (priority in ('low','normal','high')),
  is_completed                boolean not null default false,
  recurrence                  text not null default 'none' check (recurrence in ('none','daily','weekly')),
  linked_course_offering_id   uuid references course_offerings(id) on delete set null,
  created_at                  timestamptz not null default now()
);
create index idx_planner_tasks_user on planner_tasks(user_id);

create table semester_goals (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references users(id) on delete cascade,
  semester_id   uuid not null references semesters(id) on delete cascade,
  title         text not null,
  target_date   date,
  is_completed  boolean not null default false,
  created_at    timestamptz not null default now()
);

create table calendar_events (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references organizations(id) on delete cascade,
  title             text not null,
  type              text not null check (
    type in ('registration','test','exam','holiday','milestone')
  ),
  start_date        date not null,
  end_date          date,
  description       text,
  created_at        timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 7. NOTIFICATIONS (Blueprint v2 §3.7)
-- ----------------------------------------------------------------------------

create table notifications (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references users(id) on delete cascade,
  title                 text not null,
  message               text not null,
  type                  text not null check (
    type in ('assignment_due','announcement','timetable_change','system','custom')
  ),
  read_status           boolean not null default false,
  related_entity_type   text,
  related_entity_id     uuid,
  created_at            timestamptz not null default now()
);
create index idx_notifications_user on notifications(user_id, read_status);

-- ----------------------------------------------------------------------------
-- 8. AUDIT LOG (Blueprint v3 §5)
-- ----------------------------------------------------------------------------

create table audit_logs (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references users(id) on delete set null,
  action            text not null,
  module            text not null,
  organization_id   uuid references organizations(id) on delete set null,
  university_id     uuid references universities(id) on delete set null,
  details           jsonb not null default '{}',
  created_at        timestamptz not null default now()
);
create index idx_audit_logs_org on audit_logs(organization_id, created_at desc);
create index idx_audit_logs_university on audit_logs(university_id, created_at desc);

-- ----------------------------------------------------------------------------
-- updated_at helper trigger, applied to tables that track it
-- ----------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_users_updated_at before update on users
  for each row execute function set_updated_at();

create trigger trg_enrollments_updated_at before update on enrollments
  for each row execute function set_updated_at();
