"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserContext } from "@/lib/auth/session";

export interface CalendarEventFormState {
  error: string | null;
}

const EVENT_TYPES = ["registration", "test", "exam", "holiday", "milestone", "add_drop_deadline"] as const;

function parseForm(formData: FormData) {
  const rawType = String(formData.get("type") ?? "milestone");
  const type = EVENT_TYPES.includes(rawType as (typeof EVENT_TYPES)[number])
    ? (rawType as (typeof EVENT_TYPES)[number])
    : "milestone";

  return {
    title: String(formData.get("title") ?? "").trim(),
    type,
    start_date: String(formData.get("start_date") ?? ""),
    end_date: String(formData.get("end_date") ?? "") || null,
    description: String(formData.get("description") ?? "").trim() || null
  };
}

export async function createCalendarEvent(
  _prevState: CalendarEventFormState,
  formData: FormData
): Promise<CalendarEventFormState> {
  const supabase = createClient();
  const ctx = await getCurrentUserContext();
  const values = parseForm(formData);

  if (!values.title || !values.start_date) {
    return { error: "Title and start date are required." };
  }
  if (!ctx?.organizationId) {
    return { error: "No organization on your profile." };
  }

  const { error } = await supabase.from("calendar_events").insert({
    ...values,
    organization_id: ctx.organizationId
  });

  if (error) return { error: error.message };

  revalidatePath("/admin/calendar");
  redirect("/admin/calendar");
}

export async function updateCalendarEvent(
  eventId: string,
  _prevState: CalendarEventFormState,
  formData: FormData
): Promise<CalendarEventFormState> {
  const supabase = createClient();
  const values = parseForm(formData);

  if (!values.title || !values.start_date) {
    return { error: "Title and start date are required." };
  }

  const { error } = await supabase.from("calendar_events").update(values).eq("id", eventId);
  if (error) return { error: error.message };

  revalidatePath("/admin/calendar");
  redirect("/admin/calendar");
}

export async function deleteCalendarEvent(formData: FormData) {
  const eventId = String(formData.get("event_id"));
  const supabase = createClient();

  const { error } = await supabase.from("calendar_events").delete().eq("id", eventId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/calendar");
}
