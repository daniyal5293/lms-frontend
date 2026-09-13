"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/src/components/providers/AuthProvider";
import type { Role } from "@/src/lib/types";

export function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: Role[];
}) {
  const router = useRouter();
  const { accessToken, isReady, user } = useAuth();

  useEffect(() => {
    if (!isReady) return;

    if (!accessToken || !user) {
      router.replace("/login");
      return;
    }

    if (allowedRoles && !user.Roles.some((role) => allowedRoles.includes(role))) {
      router.replace("/dashboard");
    }
  }, [accessToken, allowedRoles, isReady, router, user]);

  if (!isReady || !accessToken || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center theme-bg-page theme-text-muted">
        Checking access...
      </div>
    );
  }

  if (allowedRoles && !user.Roles.some((role) => allowedRoles.includes(role))) {
    return (
      <div className="flex min-h-screen items-center justify-center theme-bg-page theme-text-muted">
        Redirecting...
      </div>
    );
  }

  return <>{children}</>;
}






