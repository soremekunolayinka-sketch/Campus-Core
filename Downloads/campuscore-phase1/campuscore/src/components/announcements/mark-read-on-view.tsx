"use client";

import { useEffect } from "react";
import { markAnnouncementRead } from "@/lib/data/announcement-actions";

/** Fires once on mount — deliberately a client effect, not a mutation during
 * server render, so viewing (a GET) stays side-effect-free at the render
 * layer and the "mark read" write happens as its own explicit action. */
export function MarkReadOnView({ announcementId }: { announcementId: string }) {
  useEffect(() => {
    markAnnouncementRead(announcementId);
  }, [announcementId]);

  return null;
}
