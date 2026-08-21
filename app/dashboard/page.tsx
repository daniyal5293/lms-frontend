"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/src/components/providers/AuthProvider";
import { useNotifications } from "@/src/components/providers/NotificationProvider";
import { ProtectedRoute } from "@/src/components/auth/ProtectedRoute";
import { AppShell } from "@/src/components/layout/AppShell";
import { Card } from "@/src/components/ui/Card";
import { Badge } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import { PageHeader } from "@/src/components/ui/PageHeader";
import { listCourses } from "@/src/lib/api/courses.api";
import { listSections } from "@/src/lib/api/sections.api";
import { listTeachers } from "@/src/lib/api/teachers.api";
import type { Course, Section, Teacher } from "@/src/lib/types";
import { getStoredSessionUser } from "@/src/lib/api/auth.api";

export default function DashboardPage() {
  const { user } = useAuth();
  const { notify } = useNotifications();
  const [sections, setSections] = useState<Section[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);

  const currentUser = user ?? getStoredSessionUser();

  useEffect(() => {
    const load = async () => {
      try {
        const [courseData, sectionData, teacherData] = await Promise.allSettled([
          listCourses(),
          listSections(),
          listTeachers(),
        ]);

        if (courseData.status === "fulfilled") setCourses(courseData.value);
        if (sectionData.status === "fulfilled") setSections(sectionData.value);
        if (teacherData.status === "fulfilled") setTeachers(teacherData.value);

        if (courseData.status === "rejected" || sectionData.status === "rejected" || teacherData.status === "rejected") {
          notify("error", "Dashboard unavailable", "Some data could not be loaded right now.");
        }
      } catch {
        notify("error", "Dashboard failure", "Unable to load the dashboard.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [notify]);

  const stats = useMemo(
    () => [
      { label: "Courses", value: courses.length.toString(), tone: "default" },
      { label: "Sections", value: sections.length.toString(), tone: "info" },
      { label: "Teachers", value: teachers.length.toString(), tone: "success" },
    ],
    [courses.length, sections.length, teachers.length],
  );

  return (
    <ProtectedRoute>
      <AppShell>
        <PageHeader
          title="Dashboard"
          description={`Welcome back, ${currentUser?.FullName ?? "User"}. Here is the current platform overview.`}
          actions={<Button variant="secondary">Overview</Button>}
        />

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label} className="bg-[#171717]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#888888]">{stat.label}</p>
                <h2 className="mt-2 text-3xl font-semibold text-white">{loading ? "--" : stat.value}</h2>
              </div>
              <Badge tone={stat.tone as "default" | "info" | "success"}>{stat.label}</Badge>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">College overview</h3>
            <Badge tone="info">Live</Badge>
          </div>
          <div className="space-y-4 text-sm text-[#d4d4d4]">
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-[#111111] p-3">
              <span>Active user role</span>
              <span className="font-medium text-white">{currentUser?.Roles?.[0] ?? "Student"}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-[#111111] p-3">
              <span>Course count</span>
              <span className="font-medium text-white">{courses.length}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-[#111111] p-3">
              <span>Section count</span>
              <span className="font-medium text-white">{sections.length}</span>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="mb-4 text-lg font-semibold text-white">Permissions</h3>
          <div className="space-y-3">
            {(currentUser?.Roles ?? ["Student"]).map((role) => (
              <Badge key={role} tone={role === "Admin" ? "warning" : role === "Teacher" ? "info" : "success"}>
                {role}
              </Badge>
            ))}
          </div>
        </Card>
      </div>
      </AppShell>
    </ProtectedRoute>
  );
}
