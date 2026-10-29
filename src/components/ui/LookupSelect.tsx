"use client";

import { useEffect, useState } from "react";
import { Select } from "@/src/components/ui/Select";
import { listLookups, type LookupItem, type LookupKind } from "@/src/lib/api/lookups.api";

/**
 * Cohort/campus dropdown. Lists active items plus the current value if it has since been deactivated,
 * so editing an existing student never silently drops it.
 */
export function LookupSelect({
  kind,
  label,
  value,
  onChange,
  error,
}: {
  kind: LookupKind;
  label: string;
  value: string;
  onChange: (id: string) => void;
  error?: string;
}) {
  const [items, setItems] = useState<LookupItem[]>([]);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    listLookups(kind)
      .then(setItems)
      .catch(() => setLoadError(`Unable to load ${label.toLowerCase()} options.`));
  }, [kind, label]);

  const options = items.filter((item) => item.isActive || item.id === value);

  return (
    <Select label={label} value={value} onChange={(event) => onChange(event.target.value)} error={error ?? (loadError || undefined)}>
      <option value="">{items.length === 0 && !loadError ? "Loading..." : `Select a ${label.toLowerCase()}`}</option>
      {options.map((item) => (
        <option key={item.id} value={item.id}>
          {item.name}
          {item.isActive ? "" : " (inactive)"}
        </option>
      ))}
    </Select>
  );
}
