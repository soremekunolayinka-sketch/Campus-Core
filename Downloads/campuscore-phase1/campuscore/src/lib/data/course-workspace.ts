import { createClient } from "@/lib/supabase/server";

export interface CourseWorkspaceData {
  found: boolean;
  hasAccess: boolean;
  organizationId: string | null;
  offering: {
    id: string;
    level: number;
    status: string;
    courseCode: string;
    courseTitle: string;
    units: number;
    description: string | null;
  } | null;
  lecturers: { id: string; fullName: string; title: string | null; email: string | null }[];
  resources: {
    id: string;
    title: string;
    description: string | null;
    category: string;
    moderationStatus: string;
    fileType: string | null;
    downloadUrl: string | null;
    uploadedByUserId: string;
  }[];
}

/**
 * All reads here go through the RLS-scoped client — a student who isn't
 * enrolled simply gets `hasAccess: false` and no resources, not because
 * this function filters them out, but because the underlying
 * `is_enrolled_in()` check inside the resources/announcements RLS
 * policies already returns nothing for them. The explicit enrollment
 * check below is purely so the UI can show a clear message instead of an
 * empty page.
 */
export async function getCourseWorkspaceData(offeringId: string, userId: string): Promise<CourseWorkspaceData> {
  const supabase = createClient();

  const { data: offeringRow } = await supabase
    .from("course_offerings")
    .select("id, level, status, lecturer_ids, courses(code, title, units, description, department_id)")
    .eq("id", offeringId)
    .single();

  if (!offeringRow) {
    return { found: false, hasAccess: false, organizationId: null, offering: null, lecturers: [], resources: [] };
  }

  const course = offeringRow.courses as unknown as {
    code: string;
    title: string;
    units: number;
    description: string | null;
    department_id: string;
  } | null;

  const [{ data: enrollmentRow }, { data: orgRow }] = await Promise.all([
    supabase
      .from("enrollments")
      .select("id")
      .eq("student_id", userId)
      .eq("course_offering_id", offeringId)
      .in("status", ["active", "completed"])
      .maybeSingle(),
    supabase.from("organizations").select("id").eq("department_id", course?.department_id ?? "").maybeSingle()
  ]);

  const hasAccess = !!enrollmentRow;

  let lecturers: CourseWorkspaceData["lecturers"] = [];
  const lecturerIds = (offeringRow.lecturer_ids ?? []) as string[];
  if (lecturerIds.length > 0) {
    const { data: lecturerRows } = await supabase
      .from("lecturers")
      .select("id, full_name, title, email")
      .in("id", lecturerIds);
    lecturers = (lecturerRows ?? []).map((l) => ({
      id: l.id,
      fullName: l.full_name,
      title: l.title,
      email: l.email
    }));
  }

  let resources: CourseWorkspaceData["resources"] = [];
  if (hasAccess) {
    const { data: resourceRows } = await supabase
      .from("resources")
      .select("id, title, description, category, moderation_status, file_url, file_type, uploaded_by_user_id")
      .eq("course_offering_id", offeringId)
      .order("created_at", { ascending: false });

    resources = await Promise.all(
      (resourceRows ?? []).map(async (r) => {
        let downloadUrl: string | null = null;
        if (r.file_url) {
          const { data: signed } = await supabase.storage
            .from("course-resources")
            .createSignedUrl(r.file_url, 300); // 5 minutes — generated fresh per page load
          downloadUrl = signed?.signedUrl ?? null;
        }
        return {
          id: r.id,
          title: r.title,
          description: r.description,
          category: r.category,
          moderationStatus: r.moderation_status,
          fileType: r.file_type,
          downloadUrl,
          uploadedByUserId: r.uploaded_by_user_id
        };
      })
    );
  }

  return {
    found: true,
    hasAccess,
    organizationId: orgRow?.id ?? null,
    offering: course
      ? {
          id: offeringRow.id,
          level: offeringRow.level,
          status: offeringRow.status,
          courseCode: course.code,
          courseTitle: course.title,
          units: course.units,
          description: course.description
        }
      : null,
    lecturers,
    resources
  };
}
