"use client";

import { useAuth } from "@/src/components/providers/AuthProvider";
import { Header } from "@/src/components/layout/Header";
import { Sidebar } from "@/src/components/layout/Sidebar";
import type { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  return (
    <div className="min-h-screen theme-bg-page theme-text">
      <div className="mx-auto flex max-w-7xl">
        <Sidebar userRole={user?.Roles?.[0] ?? "Student"} />
        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <Header />
          <main className="min-w-0 flex-1 p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}






