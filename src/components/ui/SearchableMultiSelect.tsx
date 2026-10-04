import { useMemo, useState } from "react";
import { cn } from "@/src/lib/utils";

export type MultiSelectOption = {
  value: string;
  label: string;
};

type SearchableMultiSelectProps = {
  label: string;
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
};

export function SearchableMultiSelect({ label, options, value, onChange, placeholder = "Search...", disabled = false }: SearchableMultiSelectProps) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const filteredOptions = useMemo(
    () => options.filter((option) => option.label.toLowerCase().includes(normalizedQuery)),
    [normalizedQuery, options],
  );

  const toggleOption = (optionValue: string) => {
    onChange(value.includes(optionValue) ? value.filter((selectedValue) => selectedValue !== optionValue) : [...value, optionValue]);
  };

  return (
    <div className="block w-full text-sm theme-text">
      <span className="mb-2 block theme-text-soft">{label}</span>
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full rounded-xl border border-black/10 theme-bg-input px-3 py-2.5 theme-text placeholder:theme-text-muted focus:theme-border-primary focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        aria-label={`${label} search`}
      />
      <div className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-black/10 theme-bg-input p-2">
        {filteredOptions.length === 0 ? <p className="px-2 py-2 text-xs theme-text-muted">No matches found.</p> : filteredOptions.map((option) => (
          <label key={option.value} className={cn("flex items-center gap-3 rounded-lg px-2 py-2 theme-text", disabled ? "opacity-50" : "cursor-pointer hover:bg-black/5")}>
            <input type="checkbox" checked={value.includes(option.value)} onChange={() => toggleOption(option.value)} disabled={disabled} />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
      <p className="mt-2 text-xs theme-text-muted">{value.length} selected</p>
    </div>
  );
}