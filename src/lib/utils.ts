import type { Role, Section, Student, User } from "@/src/lib/types";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/** Display label including intermediate class, e.g. "XI - Pre-Engineering (A)". */
export function formatSectionLabel(
  section?: Pick<Section, "Name" | "sectionName" | "IntermediateClass" | "intermediateClass"> | null,
  fallback = "Section",
) {
  if (!section) return fallback;
  const name = section.Name ?? section.sectionName ?? "";
  const intermediate = section.IntermediateClass ?? section.intermediateClass ?? "";
  if (intermediate && name) {
    if (name.startsWith(`${intermediate} -`) || name.startsWith(`${intermediate} `)) return name;
    return `${intermediate} - ${name}`;
  }
  return name || intermediate || fallback;
}

export function studentSectionLabel(student: Student) {
  const section = student.Section ?? student.section;
  if (typeof section === "string" && section.trim()) return section;
  if (section && typeof section === "object") return formatSectionLabel(section);
  return "Unassigned";
}

export function formatDate(value?: string | null) {
  if (!value) return "Not provided";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-PK", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function formatCurrency(value?: number | string | null) {
  if (value === null || value === undefined || value === "") return "Not provided";

  const numeric = typeof value === "string" ? Number(value) : value;

  if (Number.isNaN(numeric)) {
    return value.toString();
  }

  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(numeric);
}

export function getUserRoleLabel(user?: User | null) {
  if (!user) return "User";
  return user.Roles?.[0] ?? "User";
}

export function isUserInRole(user: User | null | undefined, roles: Role | Role[]) {
  if (!user) return false;

  const allowed = Array.isArray(roles) ? roles : [roles];
  return user.Roles.some((role) => allowed.includes(role));
}

export function getInitials(name?: string | null) {
  if (!name) return "U";

  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "U";
}
