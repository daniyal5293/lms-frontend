"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { logoutUser } from "@/src/lib/api/auth.api";
import { useAuth } from "@/src/components/providers/AuthProvider";
import { useNotifications } from "@/src/components/providers/NotificationProvider";
import { cn, getInitials } from "@/src/lib/utils";
import type { Role } from "@/src/lib/types";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { notify } = useNotifications();
  const [menuOpen, setMenuOpen] = useState(false);

  const currentUser = user;
  const role = currentUser?.Roles?.[0] ?? "Student";
  const mobileNavigationByRole: Record<Role, { label: string; href: string }[]> = {
    Admin: [{ label: "Dashboard", href: "/dashboard" }, { label: "Teachers", href: "/admin/teachers" }, { label: "Students", href: "/admin/students" }, { label: "Courses", href: "/admin/courses" }, { label: "Sections", href: "/admin/sections" }, { label: "Roles", href: "/admin/roles" }],
    Teacher: [{ label: "Dashboard", href: "/dashboard" }, { label: "Exams", href: "/teacher" }, { label: "Attendance", href: "/teacher/attendance" }, { label: "Students", href: "/teacher/students" }],
    Student: [{ label: "Dashboard", href: "/dashboard" }, { label: "Student Area", href: "/student" }],
    HOD: [{ label: "Dashboard", href: "/dashboard" }, { label: "HOD Area", href: "/hod" }, { label: "Fee Management", href: "/hod/fee-management" }],
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      logout();
      notify("success", "Signed out", "You have been signed out successfully.");
      router.push("/login");
    } catch {
      logout();
      router.push("/login");
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-black/10 theme-bg-page backdrop-blur">
      <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex items-center gap-3 lg:hidden">
          <button
            type="button"
            onClick={() => setMenuOpen((current) => !current)}
            className="rounded-xl border border-black/10 theme-bg-surface px-3 py-2 text-sm theme-text"
            aria-label="Toggle navigation"
          >
            Menu
          </button>
          <Link href="/dashboard" className="text-base font-semibold theme-text">
            LMS Portal
          </Link>
        </div>

        <div className="hidden items-center gap-2 text-sm theme-text-muted lg:flex">
          <span className="theme-text">{pathname}</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden rounded-xl border border-black/10 theme-bg-surface px-3 py-2 text-sm theme-text-soft sm:block">
            {currentUser?.Roles?.[0] ?? "User"}
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-black/10 theme-bg-surface px-2 py-1.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full theme-bg-primary text-xs font-semibold theme-text-on-primary">
              {getInitials(currentUser?.FullName ?? currentUser?.Email ?? "U")}
            </div>
            <div className="hidden text-left sm:block">
              <p className="text-sm font-medium theme-text">{currentUser?.FullName ?? "User"}</p>
              <p className="text-[11px] theme-text-muted">{currentUser?.Email ?? ""}</p>
            </div>
          </div>
          <Link
            href="/account/change-password"
            className="rounded-xl border border-black/10 bg-transparent px-3 py-2 text-sm theme-text transition hover:bg-black/5"
          >
            Change password
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-xl border border-black/10 bg-transparent px-3 py-2 text-sm theme-text transition hover:bg-black/5"
          >
            Logout
          </button>
        </div>
      </div>

      {menuOpen ? (
        <div className="border-t border-black/10 theme-bg-page p-4 lg:hidden">
          <nav className="space-y-2">
            {[...mobileNavigationByRole[role], { label: "Change password", href: "/account/change-password" }].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "block rounded-xl px-3 py-2 text-sm",
                  pathname === item.href ? "theme-bg-primary-soft theme-text" : "theme-text-soft",
                )}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      ) : null}
    </header>
  );
}






