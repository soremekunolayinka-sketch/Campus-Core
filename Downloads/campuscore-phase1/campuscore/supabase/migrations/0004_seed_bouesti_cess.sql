-- ============================================================================
-- CampusCore — 0004_seed_bouesti_cess.sql
-- Phase 1: Initial seed data for the first deployment
--
-- NOTE ON USERS: Supabase Auth owns auth.users; real people are created via
-- the sign-up flow (or an admin invite), which then inserts a matching row
-- into public.users. We do NOT fabricate auth.users here. This seed covers
-- the tenant hierarchy, roles catalog, and a representative slice of the
-- BOUESTI Civil Engineering curriculum so Phase 1 can be tested end-to-end.
-- The FULL curriculum (all ~90 courses across 100-500L from the uploaded
-- document) is intentionally seeded as a representative subset here —
-- complete catalog entry is exactly what the Bulk Import CSV flow
-- (Blueprint v3 §3, Phase 3) exists to handle at real scale.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Roles catalog (fixed, not tenant-scoped)
-- ----------------------------------------------------------------------------
insert into roles (name) values
  ('platform_owner'),
  ('university_admin'),
  ('organization_admin'),
  ('class_governor'),
  ('course_rep'),
  ('student')
on conflict (name) do nothing;

-- ----------------------------------------------------------------------------
-- Tenant hierarchy: BOUESTI → Faculty of Engineering → Civil Engineering → CESS
-- ----------------------------------------------------------------------------
insert into universities (id, name, short_name, slug)
values (
  '00000000-0000-0000-0000-000000000001',
  'Bamidele Olumilua University of Education, Science and Technology',
  'BOUESTI',
  'bouesti'
);

insert into faculties (id, university_id, name, slug)
values (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  'Faculty of Engineering',
  'engineering'
);

insert into departments (id, faculty_id, university_id, name, slug, curriculum_version)
values (
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  'Civil Engineering',
  'civil-engineering',
  '2025/2026 curriculum (as uploaded)'
);

insert into organizations (id, department_id, university_id, name, short_name)
values (
  '00000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000001',
  'Civil Engineering Scholars'' Society',
  'CESS'
);

insert into academic_sessions (id, organization_id, name, start_date, end_date, is_active)
values (
  '00000000-0000-0000-0000-000000000005',
  '00000000-0000-0000-0000-000000000004',
  '2025/2026',
  '2025-09-01',
  '2026-07-31',
  true
);

insert into semesters (id, academic_session_id, name, start_date, end_date, is_active)
values
  ('00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000005', 'First Semester', '2025-09-01', '2026-01-31', false),
  ('00000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000005', 'Second Semester', '2026-02-01', '2026-07-31', true);

-- ----------------------------------------------------------------------------
-- Representative course catalog (from the uploaded BOUESTI curriculum doc)
-- One department_id for all — 00000000-0000-0000-0000-000000000003
-- ----------------------------------------------------------------------------
insert into courses (department_id, code, title, units, default_status, lecture_hours, practical_hours) values
  ('00000000-0000-0000-0000-000000000003', 'MTH 111', 'Elementary Mathematics I (Algebra and Trigonometry)', 2, 'C', 30, 0),
  ('00000000-0000-0000-0000-000000000003', 'PHY 111', 'General Physics I', 2, 'C', 30, 0),
  ('00000000-0000-0000-0000-000000000003', 'CHM 111', 'General Chemistry I', 2, 'C', 30, 0),
  ('00000000-0000-0000-0000-000000000003', 'GST 111', 'Communication in English', 2, 'C', 15, 45),
  ('00000000-0000-0000-0000-000000000003', 'CEE 101', 'Introduction to Civil Engineering I', 2, 'C', 30, 0),
  ('00000000-0000-0000-0000-000000000003', 'BOUESTI-EEE 103', 'Basic Artificial Intelligence in Engineering', 3, 'C', 30, 45),
  ('00000000-0000-0000-0000-000000000003', 'GET 101', 'Engineer in Society', 1, 'C', 15, 0),
  ('00000000-0000-0000-0000-000000000003', 'PHY 112', 'General Physics II', 2, 'C', 30, 0),
  ('00000000-0000-0000-0000-000000000003', 'GET 102', 'Engineering Graphics and Solid Modelling I', 2, 'C', 15, 45),
  ('00000000-0000-0000-0000-000000000003', 'BOUESTI-CEE 102', 'Introduction to Civil Engineering II', 3, 'C', 45, 0),
  ('00000000-0000-0000-0000-000000000003', 'GET 201', 'Applied Electricity I', 3, 'C', 30, 45),
  ('00000000-0000-0000-0000-000000000003', 'GET 205', 'Fundamentals of Fluid Mechanics', 3, 'C', 45, 0),
  ('00000000-0000-0000-0000-000000000003', 'GET 208', 'Strength of Materials', 3, 'C', 45, 0),
  ('00000000-0000-0000-0000-000000000003', 'CEE 201', 'Civil Engineering Drawing', 2, 'E', 15, 45),
  ('00000000-0000-0000-0000-000000000003', 'BOUESTI-CEE 214', 'Elements of Structural Detailing', 1, 'C', 0, 45),
  ('00000000-0000-0000-0000-000000000003', 'GET 301', 'Engineering Mathematics III', 3, 'C', 45, 0),
  ('00000000-0000-0000-0000-000000000003', 'CEE 301', 'Fluid Mechanics', 3, 'C', 30, 45),
  ('00000000-0000-0000-0000-000000000003', 'CEE 305', 'Soil Mechanics', 3, 'C', 30, 45),
  ('00000000-0000-0000-0000-000000000003', 'CEE 306', 'Design of Structures I', 2, 'C', 30, 0),
  ('00000000-0000-0000-0000-000000000003', 'CEE 308', 'Engineering Surveying and Photogrammetry I', 2, 'C', 15, 45),
  ('00000000-0000-0000-0000-000000000003', 'BOUESTI-CEE 403', 'Structural Mechanics II', 3, 'C', 30, 15),
  ('00000000-0000-0000-0000-000000000003', 'BOUESTI-CEE 411', 'Design of Structures II', 3, 'C', 45, 0),
  ('00000000-0000-0000-0000-000000000003', 'BOUESTI-CEE 409', 'Hydraulic Engineering', 3, 'C', 30, 15),
  ('00000000-0000-0000-0000-000000000003', 'BOUESTI-CEE 415', 'Introduction to Geographic Information Systems (GIS)', 1, 'C', 0, 45),
  ('00000000-0000-0000-0000-000000000003', 'GET 501', 'Engineering Project Management', 3, 'C', 45, 0),
  ('00000000-0000-0000-0000-000000000003', 'BOUESTI-CEE 501', 'Design of Structures III', 3, 'C', 45, 0),
  ('00000000-0000-0000-0000-000000000003', 'BOUESTI-CEE 503', 'Water Resources Engineering', 3, 'C', 45, 0),
  ('00000000-0000-0000-0000-000000000003', 'CEE 504', 'Project', 6, 'C', 0, 270),
  ('00000000-0000-0000-0000-000000000003', 'CEE 506', 'Construction Engineering', 3, 'E', 30, 45)
;

-- Sample lecturers
insert into lecturers (department_id, full_name, title, email) values
  ('00000000-0000-0000-0000-000000000003', 'Adebayo Ogunleye', 'Engr. Dr.', 'a.ogunleye@bouesti.edu.ng'),
  ('00000000-0000-0000-0000-000000000003', 'Funmilayo Adeyemi', 'Engr. Prof.', 'f.adeyemi@bouesti.edu.ng'),
  ('00000000-0000-0000-0000-000000000003', 'Chinedu Okafor', 'Engr.', 'c.okafor@bouesti.edu.ng');

-- Course offerings for the active semester (Second Semester 2025/2026),
-- spanning a mix of levels to exercise the enrollment/carryover model.
insert into course_offerings (course_id, semester_id, level, status)
select id,
  '00000000-0000-0000-0000-000000000007', -- Second Semester (active)
  case
    when code in ('MTH 111','PHY 111','CHM 111','GST 111','CEE 101','BOUESTI-EEE 103','GET 101') then 100
    when code in ('PHY 112','GET 102','BOUESTI-CEE 102','GET 201','GET 205','GET 208','CEE 201','BOUESTI-CEE 214') then 200
    when code in ('GET 301','CEE 301','CEE 305','CEE 306','CEE 308') then 300
    when code in ('BOUESTI-CEE 403','BOUESTI-CEE 411','BOUESTI-CEE 409','BOUESTI-CEE 415') then 400
    else 500
  end as level,
  default_status
from courses
where department_id = '00000000-0000-0000-0000-000000000003';

-- Sample calendar events for the active session
insert into calendar_events (organization_id, title, type, start_date, end_date, description) values
  ('00000000-0000-0000-0000-000000000004', 'Second Semester Registration', 'registration', '2026-02-01', '2026-02-14', 'Course registration window for Second Semester 2025/2026'),
  ('00000000-0000-0000-0000-000000000004', 'Continuous Assessment Tests', 'test', '2026-04-06', '2026-04-17', 'CA tests across all 100–500 level courses'),
  ('00000000-0000-0000-0000-000000000004', 'Second Semester Examinations', 'exam', '2026-06-15', '2026-07-10', 'End of semester examinations');

-- ----------------------------------------------------------------------------
-- NOTE: platform_owner / university_admin / organization_admin role grants
-- are intentionally NOT seeded with fabricated user rows. After the first
-- real person signs up via Supabase Auth (creating their `users` row), run:
--
--   insert into user_roles (user_id, role_id, scope_json)
--   select u.id, r.id, '{}'::jsonb
--   from users u, roles r
--   where u.email = '<first admin email>' and r.name = 'platform_owner';
--
-- and similarly for university_admin / organization_admin with the
-- appropriate scope_json ({ "university_id": ... } / { "organization_id": ... }).
-- This keeps auth.users as the single source of truth for real identities.
-- ----------------------------------------------------------------------------
