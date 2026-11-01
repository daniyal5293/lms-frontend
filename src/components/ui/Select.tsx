import { cn } from "@/src/lib/utils";
import type { SelectHTMLAttributes } from "react";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
};

export function Select({ label, error, className, children, ...props }: SelectProps) {
  const id = props.id ?? props.name;

  return (
    <label className="block w-full text-sm theme-text" htmlFor={id}>
      {label ? <span className="mb-1 block text-xs font-medium theme-text-soft">{label}</span> : null}
      <select
        {...props}
        id={id}
        className={cn(
          "w-full rounded-lg border border-black/10 theme-bg-input px-2.5 py-1.5 theme-text focus:theme-border-primary focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
          error ? "border-red-500" : "",
          className,
        )}
      >
        {children}
      </select>
      {error ? <span className="mt-1 block text-xs text-red-600">{error}</span> : null}
    </label>
  );
}






