"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { logoutUser } from "@/src/lib/api/auth.api";
import { getStoredSessionUser } from "@/src/lib/api/auth.api";
import { useAuth } from "@/src/components/providers/AuthProvider";
import { useNotifications } from "@/src/components/providers/NotificationProvider";
import { cn, getInitials } from "@/src/lib/utils";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { notify } = useNotifications();
  const [menuOpen, setMenuOpen] = useState(false);

  const currentUser = user ?? getStoredSessionUser();

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
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#111111]/95 backdrop-blur">
      <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex items-center gap-3 lg:hidden">
          <button
            type="button"
            onClick={() => setMenuOpen((current) => !current)}
            className="rounded-xl border border-white/10 bg-[#171717] px-3 py-2 text-sm text-white"
            aria-label="Toggle navigation"
          >
            Menu
          </button>
          <Link href="/dashboard" className="text-base font-semibold text-white">
            LMS Portal
          </Link>
        </div>

        <div className="hidden items-center gap-2 text-sm text-[#888888] lg:flex">
          <span className="text-white">{pathname}</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden rounded-xl border border-white/10 bg-[#171717] px-3 py-2 text-sm text-[#d4d4d4] sm:block">
            {currentUser?.Roles?.[0] ?? "User"}
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#171717] px-2 py-1.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FF6B35] text-xs font-semibold text-white">
              {getInitials(currentUser?.FullName ?? currentUser?.Email ?? "U")}
            </div>
            <div className="hidden text-left sm:block">
              <p className="text-sm font-medium text-white">{currentUser?.FullName ?? "User"}</p>
              <p className="text-[11px] text-[#888888]">{currentUser?.Email ?? ""}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-xl border border-white/10 bg-transparent px-3 py-2 text-sm text-white transition hover:bg-white/5"
          >
            Logout
          </button>
        </div>
      </div>

      {menuOpen ? (
        <div className="border-t border-white/10 bg-[#111111] p-4 lg:hidden">
          <nav className="space-y-2">
            {[
              { label: "Dashboard", href: "/dashboard" },
              { label: "Teachers", href: "/admin/teachers" },
              { label: "Courses", href: "/admin/courses" },
              { label: "Sections", href: "/admin/sections" },
              { label: "Roles", href: "/admin/roles" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "block rounded-xl px-3 py-2 text-sm",
                  pathname === item.href ? "bg-[#FF6B35]/10 text-white" : "text-[#d4d4d4]",
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
