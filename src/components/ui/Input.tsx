import { cn } from "@/src/lib/utils";
import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  error?: string;
  label?: string;
};

export function Input({ label, error, className, ...props }: InputProps) {
  const id = props.id ?? props.name;

  return (
    <label className="block w-full text-sm text-white" htmlFor={id}>
      {label ? <span className="mb-2 block text-[#d4d4d4]">{label}</span> : null}
      <input
        {...props}
        id={id}
        className={cn(
          "w-full rounded-xl border border-white/10 bg-[#1a1a1a] px-3 py-2.5 text-white placeholder:text-[#888888] focus:border-[#FF6B35] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
          error ? "border-red-500" : "",
          className,
        )}
      />
      {error ? <span className="mt-1.5 block text-xs text-red-400">{error}</span> : null}
    </label>
  );
}
