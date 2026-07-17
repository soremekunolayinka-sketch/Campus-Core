import { redirect } from "next/navigation";
import { getCurrentUserContext } from "@/lib/auth/session";
import { AppShell } from "@/components/nav/app-shell";

/**
 * Shared shell for every signed-in route: /dashboard, /profile, /admin/*.
 * A Next.js route group — (app) adds no URL segment, so this layout wraps
 * those paths without changing them.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getCurrentUserContext();

  if (!ctx) {
    redirect("/login");
  }

  return (
    <AppShell roles={ctx.roles.map((r) => r.role)} fullName={ctx.fullName}>
      {children}
    </AppShell>
  );
}
