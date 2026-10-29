"use client";

import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/src/components/auth/ProtectedRoute";
import { AppShell } from "@/src/components/layout/AppShell";
import { useNotifications } from "@/src/components/providers/NotificationProvider";
import { StudentForm, emptyStudentForm, toStudentPayload } from "@/src/components/admin/StudentForm";
import { Card } from "@/src/components/ui/Card";
import { PageHeader } from "@/src/components/ui/PageHeader";
import { ApiError } from "@/src/lib/api/client";
import { createStudent } from "@/src/lib/api/students.api";

export default function NewStudentPage() {
  const router = useRouter();
  const { notify } = useNotifications();

  return (
    <ProtectedRoute allowedRoles={["Admin"]}>
      <AppShell>
        <PageHeader title="Create Student" description="Add a student account and assign it to a cohort, campus and section." />
        <Card>
          <StudentForm
            initialValues={emptyStudentForm}
            submitLabel="Create Student"
            submittingLabel="Creating..."
            onCancel={() => router.back()}
            onSubmit={async (values) => {
              try {
                await createStudent(toStudentPayload(values));
                notify("success", "Student created", "The student account was created successfully.");
                router.push("/admin/students");
              } catch (error) {
                notify("error", "Student creation failed", error instanceof ApiError ? error.message : "Unable to create student.");
              }
            }}
          />
        </Card>
      </AppShell>
    </ProtectedRoute>
  );
}
