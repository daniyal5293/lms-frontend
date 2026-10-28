"use client";

import { AuthProvider } from "@/src/components/providers/AuthProvider";
import { NotificationCenterProvider } from "@/src/components/providers/NotificationCenterProvider";
import { NotificationProvider } from "@/src/components/providers/NotificationProvider";
import type { ReactNode } from "react";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <NotificationProvider>
        <NotificationCenterProvider>{children}</NotificationCenterProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}






