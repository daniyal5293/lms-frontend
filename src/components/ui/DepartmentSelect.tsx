"use client";

import { useEffect, useState } from "react";
import { Select } from "@/src/components/ui/Select";
import { listDepartments, type Department } from "@/src/lib/api/departments.api";

/**
 * Department dropdown backed by /api/departments. Lists active departments, plus the current value
 * if it has since been deactivated, so editing an existing record never silently drops it.
 */
export function DepartmentSelect({
  value,
  onChange,
  error,
  label = "Department",
}: {
  value: string;
  onChange: (departmentId: string) => void;
  error?: string;
  label?: string;
}) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    listDepartments()
      .then(setDepartments)
      .catch(() => setLoadError("Unable to load departments."));
  }, []);

  const options = departments.filter((department) => department.isActive || department.departmentId === value);

  return (
    <Select
      label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      error={error ?? (loadError || undefined)}
    >
      <option value="">{departments.length === 0 && !loadError ? "Loading departments..." : "Select a department"}</option>
      {options.map((department) => (
        <option key={department.departmentId} value={department.departmentId}>
          {department.name}
          {department.isActive ? "" : " (inactive)"}
        </option>
      ))}
    </Select>
  );
}
