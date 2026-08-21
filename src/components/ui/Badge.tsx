import { cn } from "@/src/lib/utils";

export function Badge({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "success" | "warning" | "info" | "danger";
}) {
  const tones = {
    default: "border-white/10 bg-white/5 text-white",
    success: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
    warning: "border-amber-500/40 bg-amber-500/10 text-amber-300",
    info: "border-[#004E64]/50 bg-[#004E64]/10 text-[#7dd3fc]",
    danger: "border-red-500/40 bg-red-500/10 text-red-300",
  };

  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium", tones[tone])}>
      {children}
    </span>
  );
}
