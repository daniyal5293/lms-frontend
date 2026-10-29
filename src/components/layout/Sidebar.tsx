"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/src/lib/utils";
import type { Role } from "@/src/lib/types";

type SidebarProps = {
  userRole?: Role;
};

const navigationByRole: Record<Role, { label: string; href: string }[]> = {
  Admin: [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Teachers", href: "/admin/teachers" },
    { label: "Students", href: "/admin/students" },
    { label: "Courses", href: "/admin/courses" },
    { label: "Sections", href: "/admin/sections" },
    { label: "Departments", href: "/admin/departments" },
    { label: "Cohorts", href: "/admin/cohorts" },
    { label: "Campuses", href: "/admin/campuses" },
    { label: "Roles", href: "/admin/roles" },
    { label: "Notifications", href: "/notifications" },
  ],
  Teacher: [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Exams", href: "/teacher" },
    { label: "Attendance", href: "/teacher/attendance" },
    { label: "Students", href: "/teacher/students" },
    { label: "Notifications", href: "/notifications" },
  ],
  Student: [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Student Area", href: "/student" },
    { label: "Notifications", href: "/notifications" },
  ],
  HOD: [
    { label: "Dashboard", href: "/dashboard" },
    { label: "HOD Area", href: "/hod" },
    { label: "Fee Management", href: "/hod/fee-management" },
    { label: "Notifications", href: "/notifications" },
  ],
};

export function Sidebar({ userRole = "Student" }: SidebarProps) {
  const pathname = usePathname() ?? "";
  const items = (navigationByRole[userRole] ?? navigationByRole.Student).filter(
    (item, index, allItems) => allItems.findIndex((candidate) => candidate.href === item.href) === index,
  );

  return (
    <aside className="hidden min-h-screen w-60 border-r border-black/10 theme-bg-page p-4 lg:flex lg:flex-col">
      <Link href="/dashboard" className="mb-6 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-black/5 theme-bg-surface shadow-sm">
          <Image src="/tcf-mark.png" alt="" width={32} height={25} priority />
        </span>
        <span>
          <span className="block text-[11px] uppercase tracking-widest theme-text-muted">The Citizens Foundation</span>
          <span className="block text-lg font-semibold theme-text">TCF Campus</span>
        </span>
      </Link>

      <nav className="space-y-1.5">
        {items.map((item) => {
          const active = pathname === item.href || (!item.href.startsWith("/teacher") && !item.href.startsWith("/hod") && pathname.startsWith(item.href + "/"));
          return (
            <Link
              key={`${item.label}-${item.href}`}
              href={item.href}
              className={cn(
                "flex items-center rounded-lg border px-3 py-2 text-sm transition",
                active
                  ? "theme-border-primary theme-bg-primary-soft theme-text"
                  : "border-transparent theme-text-soft hover:border-black/10 hover:bg-black/5 hover:theme-text",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-xl border border-black/10 theme-bg-surface p-3">
        <p className="text-xs uppercase tracking-widest theme-text-muted">Role</p>
        <div className="mt-2 text-lg font-semibold theme-text">{userRole}</div>
      </div>
    </aside>
  );
}






