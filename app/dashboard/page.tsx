"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/src/components/providers/AuthProvider";
import { useNotifications } from "@/src/components/providers/NotificationProvider";
import { ProtectedRoute } from "@/src/components/auth/ProtectedRoute";
import { AdminDashboard, HodDashboard, TeacherDashboard } from "@/src/components/dashboard/RoleDashboards";
import { AppShell } from "@/src/components/layout/AppShell";
import { Card } from "@/src/components/ui/Card";
import { Badge } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import { PageHeader } from "@/src/components/ui/PageHeader";
import { listCourses } from "@/src/lib/api/courses.api";
import { listSections } from "@/src/lib/api/sections.api";
import { listTeachers } from "@/src/lib/api/teachers.api";
import type { Course, Section, Teacher, User } from "@/src/lib/types";
import { getStoredSessionUser } from "@/src/lib/api/auth.api";

/** Students and other roles keep the general overview. */
function GeneralOverview({ currentUser }: { currentUser: User | null }) {
  const { notify } = useNotifications();
  const [sections, setSections] = useState<Section[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);

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
    <>
      <div className="mb-3 grid gap-2.5 md:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label} className="theme-bg-surface">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm theme-text-muted">{stat.label}</p>
                <h2 className="mt-1 text-xl font-semibold theme-text">{loading ? "--" : stat.value}</h2>
              </div>
              <Badge tone={stat.tone as "default" | "info" | "success"}>{stat.label}</Badge>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <h3 className="mb-2 text-sm font-semibold theme-text">Permissions</h3>
        <div className="flex flex-wrap gap-2">
          {(currentUser?.Roles ?? ["Student"]).map((role) => (
            <Badge key={role} tone={role === "Admin" ? "warning" : role === "Teacher" ? "info" : "success"}>
              {role}
            </Badge>
          ))}
        </div>
      </Card>
    </>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [view, setView] = useState<"department" | "classes">("department");

  const currentUser = user ?? getStoredSessionUser();
  const roles = currentUser?.Roles ?? [];
  const isAdmin = roles.includes("Admin");
  const isHod = roles.includes("HOD");
  const isTeacher = roles.includes("Teacher");

  return (
    <ProtectedRoute>
      <AppShell>
        <PageHeader
          title="Dashboard"
          description={`Welcome back, ${currentUser?.FullName ?? "User"}.`}
          actions={
            !isAdmin && isHod && isTeacher ? (
              <>
                <Button variant={view === "department" ? "primary" : "ghost"} onClick={() => setView("department")}>
                  Department
                </Button>
                <Button variant={view === "classes" ? "primary" : "ghost"} onClick={() => setView("classes")}>
                  My classes
                </Button>
              </>
            ) : null
          }
        />

        {isAdmin ? (
          <AdminDashboard />
        ) : isHod && (view === "department" || !isTeacher) ? (
          <HodDashboard />
        ) : isHod || isTeacher ? (
          <TeacherDashboard />
        ) : (
          <GeneralOverview currentUser={currentUser} />
        )}
      </AppShell>
    </ProtectedRoute>
  );
}
