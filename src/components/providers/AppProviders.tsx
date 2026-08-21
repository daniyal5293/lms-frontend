"use client";

import { AuthProvider } from "@/src/components/providers/AuthProvider";
import { NotificationProvider } from "@/src/components/providers/NotificationProvider";
import type { ReactNode } from "react";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <NotificationProvider>{children}</NotificationProvider>
    </AuthProvider>
  );
}
