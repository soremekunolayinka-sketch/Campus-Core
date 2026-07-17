"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface EnrollmentFormState {
  error: string | null;
}

const ENROLLMENT_TYPES = ["normal", "carryover", "repeat", "elective", "special_approval"] as const;

export async function createEnrollment(
  _prevState: EnrollmentFormState,
  formData: FormData
): Promise<EnrollmentFormState> {
  const supabase = createClient();

  const studentId = String(formData.get("student_id") ?? "");
  const courseOfferingId = String(formData.get("course_offering_id") ?? "");
  const rawType = String(formData.get("enrollment_type") ?? "normal");
  const enrollmentType = ENROLLMENT_TYPES.includes(rawType as (typeof ENROLLMENT_TYPES)[number])
    ? (rawType as (typeof ENROLLMENT_TYPES)[number])
    : "normal";

  if (!studentId || !courseOfferingId) {
    return { error: "Student and course offering are required." };
  }

  // Delegates to the enroll_student() Postgres function (see
  // supabase/migrations/0005_phase3_additions.sql) rather than deriving
  // semester_id/academic_session_id inline here. This is the
  // mobile-compatibility pattern: the rule now lives once, in the
  // database, callable identically from this web Server Action today and
  // from a future React Native app via supabase.rpc(...) tomorrow — with
  // no duplicated logic to drift between the two. The RPC runs
  // SECURITY INVOKER, so it's still gated by the caller's own RLS
  // permissions, exactly as the previous inline insert was.
  const { error } = await supabase.rpc("enroll_student", {
    p_student_id: studentId,
    p_course_offering_id: courseOfferingId,
    p_enrollment_type: enrollmentType
  });

  if (error) {
    // Most likely cause: unique (student_id, course_offering_id) —
    // this student is already enrolled in this offering.
    return { error: error.message };
  }

  revalidatePath("/admin/enrollments");
  redirect("/admin/enrollments");
}

export async function withdrawEnrollment(formData: FormData) {
  const enrollmentId = String(formData.get("enrollment_id"));
  const supabase = createClient();

  // Soft: sets status rather than deleting, preserving enrollment history
  // per Blueprint v2 §3.4 ("preserves history").
  const { error } = await supabase.from("enrollments").update({ status: "withdrawn" }).eq("id", enrollmentId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/enrollments");
}
