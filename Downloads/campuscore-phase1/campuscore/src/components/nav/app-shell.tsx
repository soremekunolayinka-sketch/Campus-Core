"use client";

import { useState } from "react";
import { SidebarNav } from "@/components/nav/sidebar-nav";
import type { RoleName } from "@/lib/auth/permissions";

interface AppShellProps {
  roles: RoleName[];
  fullName: string;
  children: React.ReactNode;
}

/**
 * Desktop: persistent 220px sidebar, as before.
 * Mobile (<md): sidebar becomes a slide-in drawer behind a top bar with a
 * hamburger button, closing on navigation or backdrop tap. This is the
 * "Navigation Improvements" item from the Phase 3 spec — same SidebarNav
 * component either way, just a different container around it.
 */
export function AppShell({ roles, fullName, children }: AppShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen md:grid md:grid-cols-[220px_1fr]">
      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:hidden">
        <span className="text-sm font-semibold text-slate-900">CampusCore</span>
        <button
          onClick={() => setMobileNavOpen(true)}
          aria-label="Open navigation menu"
          className="rounded-md p-2 text-slate-600 hover:bg-slate-100"
        >
          <MenuIcon />
        </button>
      </div>

      {/* Mobile drawer + backdrop */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileNavOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-64 shadow-lg">
            <SidebarNav roles={roles} fullName={fullName} onNavigate={() => setMobileNavOpen(false)} />
          </div>
        </div>
      )}

      {/* Desktop persistent sidebar */}
      <div className="hidden md:block">
        <SidebarNav roles={roles} fullName={fullName} />
      </div>

      <div className="overflow-y-auto">{children}</div>
    </div>
  );
}

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}
