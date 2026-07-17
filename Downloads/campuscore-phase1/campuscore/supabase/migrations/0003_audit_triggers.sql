-- ============================================================================
-- CampusCore — 0003_audit_triggers.sql
-- Phase 1: Audit Log foundation (Blueprint v3 §5)
-- Triggers write audit_logs automatically — cannot be silently skipped by
-- an application bug, the same principle applied to RLS in 0002.
-- ============================================================================

create or replace function write_audit_log()
returns trigger
language plpgsql
security definer -- runs with elevated privilege so it can always insert,
                  -- regardless of the acting user's own RLS grants
set search_path = public
as $$
declare
  acting_user_id   uuid;
  action_name      text;
  target_org_id    uuid;
  target_uni_id    uuid;
  row_details      jsonb;
begin
  acting_user_id := current_user_id();
  action_name := lower(TG_TABLE_NAME) || '.' ||
    (case TG_OP when 'INSERT' then 'created' when 'UPDATE' then 'updated' when 'DELETE' then 'deleted' end);

  if TG_OP = 'DELETE' then
    row_details := jsonb_build_object('old', to_jsonb(OLD));
  elsif TG_OP = 'UPDATE' then
    row_details := jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW));
  else
    row_details := jsonb_build_object('new', to_jsonb(NEW));
  end if;

  -- Best-effort org/university resolution per table so admins can scope
  -- their view (Blueprint v3 §5 "Visibility"). Falls back to null if the
  -- table has no direct organization/university relationship.
  begin
    case TG_TABLE_NAME
      when 'resources' then
        select o.id, o.university_id into target_org_id, target_uni_id
        from course_offerings co
        join courses c on c.id = co.course_id
        join organizations o on o.department_id = c.department_id
        where co.id = coalesce(NEW.course_offering_id, OLD.course_offering_id);
      when 'timetable_slots' then
        select o.id, o.university_id into target_org_id, target_uni_id
        from course_offerings co
        join courses c on c.id = co.course_id
        join organizations o on o.department_id = c.department_id
        where co.id = coalesce(NEW.course_offering_id, OLD.course_offering_id);
      when 'courses' then
        select o.id, o.university_id into target_org_id, target_uni_id
        from organizations o
        where o.department_id = coalesce(NEW.department_id, OLD.department_id)
        limit 1;
      when 'enrollments' then
        select o.id, o.university_id into target_org_id, target_uni_id
        from course_offerings co
        join courses c on c.id = co.course_id
        join organizations o on o.department_id = c.department_id
        where co.id = coalesce(NEW.course_offering_id, OLD.course_offering_id);
      when 'user_roles' then
        select u.organization_id, u.university_id into target_org_id, target_uni_id
        from users u where u.id = coalesce(NEW.user_id, OLD.user_id);
      else
        target_org_id := null;
        target_uni_id := null;
    end case;
  exception when others then
    target_org_id := null;
    target_uni_id := null;
  end;

  insert into audit_logs (user_id, action, module, organization_id, university_id, details)
  values (acting_user_id, action_name, TG_TABLE_NAME, target_org_id, target_uni_id, row_details);

  if TG_OP = 'DELETE' then
    return OLD;
  end if;
  return NEW;
end;
$$;

-- Attach to the sensitive tables named in Blueprint v3 §5
create trigger trg_audit_resources
  after insert or update or delete on resources
  for each row execute function write_audit_log();

create trigger trg_audit_timetable
  after insert or update or delete on timetable_slots
  for each row execute function write_audit_log();

create trigger trg_audit_courses
  after insert or update or delete on courses
  for each row execute function write_audit_log();

create trigger trg_audit_enrollments
  after insert or update or delete on enrollments
  for each row execute function write_audit_log();

create trigger trg_audit_user_roles
  after insert or update or delete on user_roles
  for each row execute function write_audit_log();

-- Explicit logging function for non-row-mutation events (e.g. bulk import
-- summaries — Blueprint v3 §3) — called from application/job code, not a
-- trigger, since there's no single row that represents "an import ran."
create or replace function log_audit_event(
  p_action text,
  p_module text,
  p_organization_id uuid,
  p_university_id uuid,
  p_details jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into audit_logs (user_id, action, module, organization_id, university_id, details)
  values (current_user_id(), p_action, p_module, p_organization_id, p_university_id, p_details);
end;
$$;
