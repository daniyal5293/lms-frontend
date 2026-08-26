import type { Teacher, User } from "@/src/lib/types";

export function getTeacherEntityId(
  teachers: Teacher[],
  user: User | null | undefined
): string {
  if (!user) return "";

  const teacher = teachers.find(
    (item) =>
      (item.Email ?? item.email ?? "").toLowerCase() ===
      (user.Email ?? "").toLowerCase()
  );

  return (
    itemTeacherId(teacher) ||
    ""
  );
}

function itemTeacherId(teacher: Teacher | undefined): string {
  return (
    teacher?.teacher_id ??
    teacher?.Id ??
    teacher?.id ??
    ""
  );
}