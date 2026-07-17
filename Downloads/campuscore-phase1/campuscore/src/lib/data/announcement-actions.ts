"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserContext } from "@/lib/auth/session";

/**
 * Idempotent by design (unique(user_id, announcement_id) + ignoreDuplicates)
 * — safe to call every time an announcement is viewed, not just the first.
 * Gated by the "announcement_reads: owner manages own read state" RLS
 * policy — a user can only ever write their own read receipts.
 */
export async function markAnnouncementRead(announcementId: string) {
  const ctx = await getCurrentUserContext();
  if (!ctx) return;

  const supabase = createClient();
  await supabase
    .from("announcement_reads")
    .upsert({ user_id: ctx.userId, announcement_id: announcementId }, { onConflict: "user_id,announcement_id", ignoreDuplicates: true });

  revalidatePath("/announcements");
  revalidatePath("/dashboard");
}
