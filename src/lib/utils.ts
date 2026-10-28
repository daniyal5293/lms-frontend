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

const PROGRAM_SHORT_NAMES: Array<[RegExp, string]> = [
  [/\b(?:complete\s+)?pre[\s-]?engineering\b/gi, "Pre-Eng."],
  [/\b(?:complete\s+)?pre[\s-]?medical\b/gi, "Pre-Med."],
];

/** Shortens long program names, e.g. "Complete Pre-Engineering (A)" -> "Pre-Eng. (A)". */
export function shortProgramName(name: string) {
  return PROGRAM_SHORT_NAMES.reduce((result, [pattern, short]) => result.replace(pattern, short), name).trim();
}

/** Compact section label with its class, e.g. "XI · Pre-Eng. (A)". */
export function formatSectionShort(intermediateClass?: string | null, sectionName?: string | null, fallback = "Unassigned") {
  const name = shortProgramName(sectionName ?? "");
  const level = (intermediateClass ?? "").trim();
  if (level && name) return `${level} · ${name}`;
  return name || level || fallback;
}

/** Shortens a backend section label such as "XII - Pre-Engineering (C)" -> "XII · Pre-Eng. (C)". */
export function formatSectionText(label?: string | null, fallback = "Unassigned") {
  const text = (label ?? "").trim();
  if (!text) return fallback;
  const separator = text.indexOf(" - ");
  if (separator === -1) return shortProgramName(text);
  return formatSectionShort(text.slice(0, separator), text.slice(separator + 3), fallback);
}

export function studentSectionLabel(student: Student) {
  const section = student.Section ?? student.section;
  if (typeof section === "string" && section.trim()) return formatSectionText(section);
  if (section && typeof section === "object") {
    return formatSectionShort(section.IntermediateClass ?? section.intermediateClass, section.Name ?? section.sectionName);
  }
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

/** Readable date and time, e.g. "24 Aug 2026, 9:27 AM". */
export function formatDateTime(value?: string | null) {
  if (!value || value.startsWith("0001-01-01")) return "Not provided";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const day = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(date);
  const time = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(date);
  return `${day}, ${time}`;
}

/** Short relative time for recent events, e.g. "just now", "5 min ago"; older ones use formatDateTime. */
export function formatRelativeTime(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const minutes = Math.floor((Date.now() - date.getTime()) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return formatDateTime(value);
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
