"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clsx } from "clsx";
import { createClient } from "@/lib/supabase/client";
import type { RoleName } from "@/lib/auth/permissions";

interface NavItem {
  label: string;
  href: string;
}

const STUDENT_NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "My Courses", href: "/courses" },
  { label: "Register Courses", href: "/register-courses" },
  { label: "Timetable", href: "/timetable" },
  { label: "Calendar", href: "/calendar" },
  { label: "Announcements", href: "/announcements" },
  { label: "Profile", href: "/profile" }
];

const ADMIN_NAV: NavItem[] = [
  { label: "Admin Dashboard", href: "/admin" },
  { label: "Users", href: "/admin/users" },
  { label: "Courses", href: "/admin/courses" },
  { label: "Course Offerings", href: "/admin/course-offerings" },
  { label: "Enrollments", href: "/admin/enrollments" },
  { label: "Registration Periods", href: "/admin/registration-windows" },
  { label: "Timetable", href: "/admin/timetable" },
  { label: "Calendar", href: "/admin/calendar" },
  { label: "Settings", href: "/admin/settings" }
];

const ADMIN_ROLES: RoleName[] = ["platform_owner", "university_admin", "organization_admin"];

export function SidebarNav({
  roles,
  fullName,
  onNavigate
}: {
  roles: RoleName[];
  fullName: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isAdmin = roles.some((r) => ADMIN_ROLES.includes(r));

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <nav className="flex h-full flex-col justify-between border-r border-slate-200 bg-white p-4">
      <div>
        <div className="mb-6 px-2">
          <p className="text-sm font-semibold text-slate-900">CampusCore</p>
          <p className="text-xs text-slate-500">{fullName}</p>
        </div>

        <ul className="space-y-1">
          {STUDENT_NAV.map((item) => (
            <NavLink key={item.href + item.label} item={item} active={pathname === item.href} onNavigate={onNavigate} />
          ))}
        </ul>

        {isAdmin && (
          <>
            <p className="mb-1 mt-6 px-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Administration
            </p>
            <ul className="space-y-1">
              {ADMIN_NAV.map((item) => (
                <NavLink key={item.href + item.label} item={item} active={pathname === item.href} onNavigate={onNavigate} />
              ))}
            </ul>
          </>
        )}
      </div>

      <button
        onClick={handleLogout}
        className="rounded-md px-3 py-2 text-left text-sm font-medium text-slate-600 hover:bg-slate-100"
      >
        Logout
      </button>
    </nav>
  );
}

function NavLink({ item, active, onNavigate }: { item: NavItem; active: boolean; onNavigate?: () => void }) {
  return (
    <li>
      <Link
        href={item.href}
        onClick={onNavigate}
        className={clsx(
          "block rounded-md px-3 py-2 text-sm font-medium transition-colors",
          active ? "bg-brand text-brand-foreground" : "text-slate-700 hover:bg-slate-100"
        )}
      >
        {item.label}
      </Link>
    </li>
  );
}
