import { cn } from "@/src/lib/utils";
import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  error?: string;
  label?: string;
};

export function Input({ label, error, className, ...props }: InputProps) {
  const id = props.id ?? props.name;

  return (
    <label className="block w-full text-sm theme-text" htmlFor={id}>
      {label ? <span className="mb-2 block theme-text-soft">{label}</span> : null}
      <input
        {...props}
        id={id}
        className={cn(
          "w-full rounded-xl border border-black/10 theme-bg-input px-3 py-2.5 theme-text placeholder:theme-text-muted focus:theme-border-primary focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
          error ? "border-red-500" : "",
          className,
        )}
      />
      {error ? <span className="mt-1.5 block text-xs text-red-400">{error}</span> : null}
    </label>
  );
}






