"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserContext } from "@/lib/auth/session";

export interface ProfileActionState {
  error: string | null;
  success: boolean;
}

/**
 * Only `full_name` is editable here — matric_number, university/department/
 * organization, admission/current session are administrative fields, not
 * self-service ones, and are intentionally excluded ("update allowed
 * fields" from the Phase 3 spec, not "update any field").
 */
export async function updateProfileName(
  _prevState: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const ctx = await getCurrentUserContext();
  if (!ctx) return { error: "Not signed in.", success: false };

  const fullName = String(formData.get("full_name") ?? "").trim();
  if (!fullName) return { error: "Name cannot be empty.", success: false };

  const supabase = createClient();
  const { error } = await supabase.from("users").update({ full_name: fullName }).eq("id", ctx.userId);

  if (error) return { error: error.message, success: false };

  revalidatePath("/profile");
  return { error: null, success: true };
}

export async function updateAvatar(
  _prevState: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const supabase = createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in.", success: false };

  const file = formData.get("avatar") as File | null;
  if (!file || file.size === 0) return { error: "Please choose an image.", success: false };
  if (!file.type.startsWith("image/")) return { error: "File must be an image.", success: false };

  const ext = file.name.split(".").pop() ?? "jpg";
  // Fixed filename per user (not randomUUID) so re-uploading overwrites
  // rather than accumulating orphaned old avatars in storage.
  const path = `${user.id}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { contentType: file.type, upsert: true });

  if (uploadError) return { error: uploadError.message, success: false };

  const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(path);
  // Cache-bust so the new avatar shows immediately instead of a stale
  // browser-cached image at the same URL.
  const avatarUrl = `${publicUrlData.publicUrl}?v=${randomUUID()}`;

  const { error: updateError } = await supabase.from("users").update({ avatar_url: avatarUrl }).eq("auth_id", user.id);

  if (updateError) return { error: updateError.message, success: false };

  revalidatePath("/profile");
  return { error: null, success: true };
}

export async function changePassword(
  _prevState: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const newPassword = String(formData.get("new_password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");

  if (newPassword.length < 6) return { error: "Password must be at least 6 characters.", success: false };
  if (newPassword !== confirmPassword) return { error: "Passwords do not match.", success: false };

  const supabase = createClient();
  // Operates on the caller's own session — Supabase Auth requires no
  // separate authorization check here beyond an active session, which
  // createClient() already carries via the request's cookies.
  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) return { error: error.message, success: false };

  return { error: null, success: true };
}
