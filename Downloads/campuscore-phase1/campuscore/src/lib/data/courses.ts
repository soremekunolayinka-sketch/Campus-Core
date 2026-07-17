"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Every mutation here runs through the same cookie-scoped client used for
 * normal reads (src/lib/supabase/server.ts createClient — NOT
 * createAdminClient). That means the `courses: org_admin+ writes` RLS
 * policy is the thing actually deciding whether this succeeds. If the
 * signed-in user isn't an org_admin+ for the target department's
 * organization, Supabase returns a permission error here — this file
 * doesn't (and can't) grant access on its own.
 */

export interface CourseFormState {
  error: string | null;
}

function parseCourseForm(formData: FormData) {
  const status = String(formData.get("default_status") ?? "C");
  const default_status: "C" | "E" | "R" = status === "E" || status === "R" ? status : "C";

  return {
    department_id: String(formData.get("department_id") ?? ""),
    code: String(formData.get("code") ?? "").trim(),
    title: String(formData.get("title") ?? "").trim(),
    units: Number(formData.get("units") ?? 0),
    default_status,
    lecture_hours: Number(formData.get("lecture_hours") ?? 0),
    practical_hours: Number(formData.get("practical_hours") ?? 0)
  };
}

export async function createCourse(_prevState: CourseFormState, formData: FormData): Promise<CourseFormState> {
  const supabase = createClient();
  const values = parseCourseForm(formData);

  if (!values.department_id || !values.code || !values.title) {
    return { error: "Department, code, and title are required." };
  }

  const { error } = await supabase.from("courses").insert(values);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/courses");
  redirect("/admin/courses");
}

export async function updateCourse(
  courseId: string,
  _prevState: CourseFormState,
  formData: FormData
): Promise<CourseFormState> {
  const supabase = createClient();
  const values = parseCourseForm(formData);

  if (!values.department_id || !values.code || !values.title) {
    return { error: "Department, code, and title are required." };
  }

  const { error } = await supabase.from("courses").update(values).eq("id", courseId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/courses");
  redirect("/admin/courses");
}

export async function deleteCourse(formData: FormData) {
  const courseId = String(formData.get("course_id"));
  const supabase = createClient();

  // Note: course_offerings.course_id is `on delete cascade`, so deleting a
  // course also deletes every course_offering built on it (and, in turn,
  // any resources/assignments/enrollments tied to those offerings). No
  // confirmation step exists in Phase 2 yet — the UI warns inline instead.
  const { error } = await supabase.from("courses").delete().eq("id", courseId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/courses");
}
