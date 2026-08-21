import { cn } from "@/src/lib/utils";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  loading?: boolean;
  icon?: ReactNode;
};

export function Button({
  variant = "primary",
  loading = false,
  icon,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const styles = {
    primary: "bg-[#FF6B35] text-white hover:bg-[#e85f2d] border border-[#FF6B35]",
    secondary: "bg-[#004E64] text-white hover:bg-[#003f54] border border-[#004E64]",
    ghost: "bg-transparent text-white border border-white/10 hover:bg-white/5",
    danger: "bg-red-600 text-white border border-red-600 hover:bg-red-500",
  };

  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-[#FF6B35] disabled:cursor-not-allowed disabled:opacity-60",
        styles[variant],
        className,
      )}
    >
      {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : icon}
      {children}
    </button>
  );
}
