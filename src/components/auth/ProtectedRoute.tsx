"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { getStoredSessionUser } from "@/src/lib/api/auth.api";
import { getStoredAccessToken } from "@/src/lib/api/client";
import type { Role } from "@/src/lib/types";

export function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: Role[];
}) {
  const router = useRouter();
  const accessToken = getStoredAccessToken();
  const user = getStoredSessionUser();

  useEffect(() => {
    if (!accessToken || !user) {
      router.replace("/login");
      return;
    }

    if (allowedRoles && !user.Roles.some((role) => allowedRoles.includes(role))) {
      router.replace("/dashboard");
    }
  }, [accessToken, allowedRoles, router, user]);

  if (!accessToken || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#111111] text-[#888888]">
        Checking access...
      </div>
    );
  }

  if (allowedRoles && !user.Roles.some((role) => allowedRoles.includes(role))) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#111111] text-[#888888]">
        Redirecting...
      </div>
    );
  }

  return <>{children}</>;
}
