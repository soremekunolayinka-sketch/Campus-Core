"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface TimetableFormState {
  error: string | null;
}

const SESSION_TYPES = ["lecture", "practical", "exam"] as const;

function parseForm(formData: FormData) {
  const rawType = String(formData.get("session_type") ?? "lecture");
  const session_type = SESSION_TYPES.includes(rawType as (typeof SESSION_TYPES)[number])
    ? (rawType as (typeof SESSION_TYPES)[number])
    : "lecture";

  const isExam = session_type === "exam";

  return {
    course_offering_id: String(formData.get("course_offering_id") ?? ""),
    lecturer_id: String(formData.get("lecturer_id") ?? "") || null,
    venue: String(formData.get("venue") ?? "").trim() || null,
    session_type,
    day_of_week: isExam ? null : Number(formData.get("day_of_week") ?? 1),
    exam_date: isExam ? String(formData.get("exam_date") ?? "") || null : null,
    start_time: String(formData.get("start_time") ?? ""),
    end_time: String(formData.get("end_time") ?? "")
  };
}

export async function createTimetableSlot(
  _prevState: TimetableFormState,
  formData: FormData
): Promise<TimetableFormState> {
  const supabase = createClient();
  const values = parseForm(formData);

  if (!values.course_offering_id || !values.start_time || !values.end_time) {
    return { error: "Course offering, start time, and end time are required." };
  }
  if (values.session_type === "exam" && !values.exam_date) {
    return { error: "Exam date is required for an exam session." };
  }

  const { error } = await supabase.from("timetable_slots").insert(values);
  if (error) return { error: error.message };

  revalidatePath("/admin/timetable");
  redirect("/admin/timetable");
}

export async function updateTimetableSlot(
  slotId: string,
  _prevState: TimetableFormState,
  formData: FormData
): Promise<TimetableFormState> {
  const supabase = createClient();
  const values = parseForm(formData);

  if (!values.course_offering_id || !values.start_time || !values.end_time) {
    return { error: "Course offering, start time, and end time are required." };
  }
  if (values.session_type === "exam" && !values.exam_date) {
    return { error: "Exam date is required for an exam session." };
  }

  const { error } = await supabase.from("timetable_slots").update(values).eq("id", slotId);
  if (error) return { error: error.message };

  revalidatePath("/admin/timetable");
  redirect("/admin/timetable");
}

export async function deleteTimetableSlot(formData: FormData) {
  const slotId = String(formData.get("slot_id"));
  const supabase = createClient();

  const { error } = await supabase.from("timetable_slots").delete().eq("id", slotId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/timetable");
}
