"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserContext } from "@/lib/auth/session";

export interface RegistrationWindowFormState {
  error: string | null;
}

function parseForm(formData: FormData) {
  return {
    semester_id: String(formData.get("semester_id") ?? ""),
    opens_at: String(formData.get("opens_at") ?? ""),
    closes_at: String(formData.get("closes_at") ?? ""),
    requires_approval: formData.get("requires_approval") === "on",
    max_units_per_student: formData.get("max_units_per_student")
      ? Number(formData.get("max_units_per_student"))
      : null
  };
}

export async function createRegistrationWindow(
  _prevState: RegistrationWindowFormState,
  formData: FormData
): Promise<RegistrationWindowFormState> {
  const supabase = createClient();
  const ctx = await getCurrentUserContext();
  const values = parseForm(formData);

  if (!values.semester_id || !values.opens_at || !values.closes_at) {
    return { error: "Semester, opening date, and closing date are required." };
  }

  const { error } = await supabase.from("registration_windows").insert({
    ...values,
    created_by_user_id: ctx?.userId ?? null
  });

  if (error) return { error: error.message };

  revalidatePath("/admin/registration-windows");
  redirect("/admin/registration-windows");
}

export async function updateRegistrationWindow(
  windowId: string,
  _prevState: RegistrationWindowFormState,
  formData: FormData
): Promise<RegistrationWindowFormState> {
  const supabase = createClient();
  const values = parseForm(formData);

  if (!values.semester_id || !values.opens_at || !values.closes_at) {
    return { error: "Semester, opening date, and closing date are required." };
  }

  const { error } = await supabase.from("registration_windows").update(values).eq("id", windowId);

  if (error) return { error: error.message };

  revalidatePath("/admin/registration-windows");
  redirect("/admin/registration-windows");
}

export async function deleteRegistrationWindow(formData: FormData) {
  const windowId = String(formData.get("window_id"));
  const supabase = createClient();

  const { error } = await supabase.from("registration_windows").delete().eq("id", windowId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/registration-windows");
}
