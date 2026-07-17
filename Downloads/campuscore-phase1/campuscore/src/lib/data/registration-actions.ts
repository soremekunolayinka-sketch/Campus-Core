"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface RegistrationActionResult {
  error: string | null;
}

/**
 * Deliberately thin — all the actual rules (window open, duplicate check,
 * unit cap, self-only) live in the register_for_course()/drop_course()
 * Postgres functions (0006 migration), exactly per the mobile-
 * compatibility rule from the Phase 4 review: this Server Action only
 * calls the RPC and handles the web-specific concern (revalidating the
 * page). A future mobile app calls the same RPC directly.
 */
export async function registerForCourse(courseOfferingId: string): Promise<RegistrationActionResult> {
  const supabase = createClient();
  const { error } = await supabase.rpc("register_for_course", { p_course_offering_id: courseOfferingId });

  if (error) return { error: error.message };

  revalidatePath("/register-courses");
  revalidatePath("/dashboard");
  return { error: null };
}

export async function dropCourse(enrollmentId: string): Promise<RegistrationActionResult> {
  const supabase = createClient();
  const { error } = await supabase.rpc("drop_course", { p_enrollment_id: enrollmentId });

  if (error) return { error: error.message };

  revalidatePath("/register-courses");
  revalidatePath("/dashboard");
  return { error: null };
}
