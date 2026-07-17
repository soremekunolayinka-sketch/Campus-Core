"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface ResourceUploadState {
  error: string | null;
  success: boolean;
}

const CATEGORIES = ["lecture_note", "past_question", "external_link", "other"] as const;

/**
 * Runs through the RLS-scoped client — both the storage upload (gated by
 * the "course-resources: staff can upload" storage policy, which reuses
 * has_staff_access_to()) and the `resources` row insert (gated by
 * "resources: course_rep/governor/org_admin+ can upload") will simply
 * fail with a permission error if the caller isn't staff for this
 * offering. This function grants nothing on its own.
 */
export async function uploadResource(
  courseOfferingId: string,
  _prevState: ResourceUploadState,
  formData: FormData
): Promise<ResourceUploadState> {
  const supabase = createClient();

  const file = formData.get("file") as File | null;
  const title = String(formData.get("title") ?? "").trim();
  const rawCategory = String(formData.get("category") ?? "other");
  const category = CATEGORIES.includes(rawCategory as (typeof CATEGORIES)[number])
    ? (rawCategory as (typeof CATEGORIES)[number])
    : "other";

  if (!file || file.size === 0) {
    return { error: "Please choose a file.", success: false };
  }
  if (!title) {
    return { error: "Title is required.", success: false };
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not signed in.", success: false };
  }

  const { data: profile } = await supabase.from("users").select("id").eq("auth_id", user.id).single();
  if (!profile) {
    return { error: "Profile not found.", success: false };
  }

  const resourceId = randomUUID();
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const path = `${courseOfferingId}/${resourceId}-${safeName}`;

  const { error: uploadError } = await supabase.storage.from("course-resources").upload(path, file, {
    contentType: file.type || "application/octet-stream"
  });

  if (uploadError) {
    return { error: uploadError.message, success: false };
  }

  const { error: insertError } = await supabase.from("resources").insert({
    id: resourceId,
    course_offering_id: courseOfferingId,
    title,
    category,
    file_url: path,
    file_type: file.type || null,
    file_size_bytes: file.size,
    uploaded_by_user_id: profile.id
  });

  if (insertError) {
    // Best-effort cleanup so a failed row insert doesn't leave an orphaned file.
    await supabase.storage.from("course-resources").remove([path]);
    return { error: insertError.message, success: false };
  }

  revalidatePath(`/courses/${courseOfferingId}`);
  return { error: null, success: true };
}
