import type { TeacherSectionCourse } from "@/src/lib/types";
import { formatSectionShort } from "@/src/lib/utils";

export function assignmentSectionName(assignment: TeacherSectionCourse) {
  return (
    assignment.Section?.SectionName ??
    assignment.Section?.sectionName ??
    assignment.Section?.Name ??
    assignment.Section?.name ??
    assignment.section?.SectionName ??
    assignment.section?.sectionName ??
    assignment.section?.Name ??
    assignment.section?.name ??
    ""
  );
}

export function assignmentClass(assignment: TeacherSectionCourse) {
  return (
    assignment.Section?.IntermediateClass ??
    assignment.section?.IntermediateClass ??
    assignment.section?.intermediateClass ??
    ""
  );
}

export function assignmentCourseName(assignment: TeacherSectionCourse) {
  return (
    assignment.Course?.CourseName ??
    assignment.Course?.courseName ??
    assignment.course?.CourseName ??
    assignment.course?.courseName ??
    "Course"
  );
}

/** Section label with class, e.g. "XI · Pre-Eng. (A)". */
export function assignmentSectionLabel(assignment: TeacherSectionCourse) {
  return formatSectionShort(assignmentClass(assignment), assignmentSectionName(assignment), "Section");
}

/** Course and section label, e.g. "Physics — XI · Pre-Eng. (A)". */
export function assignmentLabel(assignment: TeacherSectionCourse) {
  return `${assignmentCourseName(assignment)} — ${assignmentSectionLabel(assignment)}`;
}

/** Orders assignments by class, then course, then section so grouped lists read top to bottom. */
export function sortAssignments(assignments: TeacherSectionCourse[]) {
  return [...assignments].sort(
    (a, b) =>
      assignmentClass(a).localeCompare(assignmentClass(b)) ||
      assignmentCourseName(a).localeCompare(assignmentCourseName(b)) ||
      assignmentSectionName(a).localeCompare(assignmentSectionName(b)),
  );
}
