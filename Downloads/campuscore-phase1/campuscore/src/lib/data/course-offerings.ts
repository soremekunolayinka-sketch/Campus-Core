"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface OfferingFormState {
  error: string | null;
}

function parseOfferingForm(formData: FormData) {
  const status = String(formData.get("status") ?? "C");
  const parsedStatus: "C" | "E" | "R" = status === "E" || status === "R" ? status : "C";

  return {
    course_id: String(formData.get("course_id") ?? ""),
    semester_id: String(formData.get("semester_id") ?? ""),
    level: Number(formData.get("level") ?? 100),
    status: parsedStatus
  };
}

export async function createOffering(
  _prevState: OfferingFormState,
  formData: FormData
): Promise<OfferingFormState> {
  const supabase = createClient();
  const values = parseOfferingForm(formData);

  if (!values.course_id || !values.semester_id) {
    return { error: "Course and semester are required." };
  }

  const { error } = await supabase.from("course_offerings").insert(values);

  if (error) {
    // Most likely cause: unique (course_id, semester_id) constraint —
    // this course already has an offering in that semester.
    return { error: error.message };
  }

  revalidatePath("/admin/course-offerings");
  redirect("/admin/course-offerings");
}

export async function updateOffering(
  offeringId: string,
  _prevState: OfferingFormState,
  formData: FormData
): Promise<OfferingFormState> {
  const supabase = createClient();
  const values = parseOfferingForm(formData);

  if (!values.course_id || !values.semester_id) {
    return { error: "Course and semester are required." };
  }

  const { error } = await supabase.from("course_offerings").update(values).eq("id", offeringId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/course-offerings");
  redirect("/admin/course-offerings");
}

export async function deleteOffering(formData: FormData) {
  const offeringId = String(formData.get("offering_id"));
  const supabase = createClient();

  // `on delete cascade` from enrollments/resources/assignments/timetable_slots
  // to course_offerings means deleting an offering removes everything
  // built on it. No confirmation step in Phase 2 — inline warning only.
  const { error } = await supabase.from("course_offerings").delete().eq("id", offeringId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/course-offerings");
}
