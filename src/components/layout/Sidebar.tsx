"use client";

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
    { label: "Courses", href: "/admin/courses" },
    { label: "Sections", href: "/admin/sections" },
    { label: "Roles", href: "/admin/roles" },
  ],
  Teacher: [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Teacher Area", href: "/teacher" },
  ],
  Student: [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Student Area", href: "/student" },
  ],
  HOD: [
    { label: "Dashboard", href: "/dashboard" },
    { label: "HOD Area", href: "/hod" },
  ],
};

export function Sidebar({ userRole = "Student" }: SidebarProps) {
  const pathname = usePathname();
  const items = navigationByRole[userRole] ?? navigationByRole.Student;

  return (
    <aside className="hidden min-h-screen w-72 border-r border-white/10 bg-[#111111] p-6 lg:flex lg:flex-col">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF6B35] font-bold text-white">L</div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#888888]">College</p>
          <h1 className="text-lg font-semibold text-white">LMS Portal</h1>
        </div>
      </div>

      <nav className="space-y-2">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center rounded-xl border px-3 py-2.5 text-sm transition",
                active
                  ? "border-[#FF6B35] bg-[#FF6B35]/10 text-white"
                  : "border-transparent text-[#d4d4d4] hover:border-white/10 hover:bg-white/5 hover:text-white",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-2xl border border-white/10 bg-[#171717] p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-[#888888]">Role</p>
        <div className="mt-2 text-lg font-semibold text-white">{userRole}</div>
      </div>
    </aside>
  );
}
