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
    primary: "theme-bg-primary theme-text-on-primary theme-hover-primary border theme-border-primary",
    secondary: "theme-bg-secondary theme-text-on-primary theme-hover-secondary border theme-border-secondary",
    ghost: "bg-transparent theme-text border border-black/10 hover:bg-black/5",
    danger: "bg-red-600 theme-text border border-red-600 hover:bg-red-500",
  };

  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-black/20 disabled:cursor-not-allowed disabled:opacity-60",
        styles[variant],
        className,
      )}
    >
      {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : icon}
      {children}
    </button>
  );
}






