"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ProtectedRoute } from "@/src/components/auth/ProtectedRoute";
import { AppShell } from "@/src/components/layout/AppShell";
import { useNotifications } from "@/src/components/providers/NotificationProvider";
import { StudentForm, toStudentPayload, type StudentFormValues } from "@/src/components/admin/StudentForm";
import { Card } from "@/src/components/ui/Card";
import { PageHeader } from "@/src/components/ui/PageHeader";
import { ApiError } from "@/src/lib/api/client";
import { getStudentById, updateStudent } from "@/src/lib/api/students.api";
import type { Student } from "@/src/lib/types";

const read = (student: Student, pascal: keyof Student, camel: keyof Student) => String(student[pascal] ?? student[camel] ?? "");

function toFormValues(student: Student): StudentFormValues {
  return {
    fullName: read(student, "FullName", "fullName"),
    email: read(student, "Email", "email"),
    studentCode: read(student, "StudentCode", "studentCode"),
    phoneNumber: read(student, "PhoneNumber", "phoneNumber"),
    fatherName: read(student, "FatherName", "fatherName"),
    gender: read(student, "Gender", "gender"),
    majorSubject: read(student, "MajorSubject", "majorSubject"),
    cohortId: read(student, "CohortId", "cohortId"),
    campusId: read(student, "CampusId", "campusId"),
    departmentId: read(student, "DepartmentId", "departmentId"),
    sectionId: read(student, "SectionId", "sectionId"),
    dateOfBirth: read(student, "DateOfBirth", "dateOfBirth").slice(0, 10),
    enrollmentDate: read(student, "EnrollmentDate", "enrollmentDate").slice(0, 10),
    cnic: read(student, "CNIC", "cnic"),
  };
}

export default function EditStudentPage() {
  const router = useRouter();
  const routeParams = useParams<{ id: string }>();
  const studentId = routeParams.id;
  const { notify } = useNotifications();
  const [initialValues, setInitialValues] = useState<StudentFormValues | null>(null);

  useEffect(() => {
    getStudentById(studentId)
      .then((student) => setInitialValues(toFormValues(student)))
      .catch((error) => notify("error", "Student load failed", error instanceof ApiError ? error.message : "Unable to load student."));
  }, [notify, studentId]);

  return (
    <ProtectedRoute allowedRoles={["Admin"]}>
      <AppShell>
        <PageHeader title="Edit Student" description="Update student details, cohort, campus and enrollment." />
        <Card>
          {!initialValues ? (
            <div className="py-10 text-center theme-text-muted">Loading student...</div>
          ) : (
            <StudentForm
              initialValues={initialValues}
              submitLabel="Save Changes"
              submittingLabel="Saving..."
              onCancel={() => router.back()}
              onSubmit={async (values) => {
                try {
                  await updateStudent(studentId, toStudentPayload(values));
                  notify("success", "Student updated", "The student record was updated successfully.");
                  router.push(`/admin/students/${studentId}`);
                } catch (error) {
                  notify("error", "Update failed", error instanceof ApiError ? error.message : "Unable to update student.");
                }
              }}
            />
          )}
        </Card>
      </AppShell>
    </ProtectedRoute>
  );
}
