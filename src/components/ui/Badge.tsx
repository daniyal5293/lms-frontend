import { cn } from "@/src/lib/utils";

export function Badge({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "primary" | "success" | "warning" | "info" | "danger";
}) {
  const tones = {
    default: "border-black/10 bg-black/5 theme-text",
    primary: "theme-border-primary theme-bg-primary-soft theme-text-primary",
    success: "border-emerald-500/40 bg-emerald-500/10 text-emerald-800",
    warning: "border-amber-500/40 bg-amber-500/10 text-amber-800",
    info: "theme-border-secondary-muted theme-bg-secondary-soft theme-text-secondary",
    danger: "border-red-500/40 bg-red-500/10 text-red-700",
  };

  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium", tones[tone])}>
      {children}
    </span>
  );
}






