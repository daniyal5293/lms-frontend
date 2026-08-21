"use client";

import { useAuth } from "@/src/components/providers/AuthProvider";
import { Header } from "@/src/components/layout/Header";
import { Sidebar } from "@/src/components/layout/Sidebar";
import type { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#111111] text-white">
      <div className="mx-auto flex max-w-[1600px]">
        <Sidebar userRole={user?.Roles?.[0] ?? "Student"} />
        <div className="flex min-h-screen flex-1 flex-col">
          <Header />
          <main className="flex-1 p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
