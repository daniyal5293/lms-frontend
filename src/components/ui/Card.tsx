import type { ReactNode } from "react";
import { cn } from "@/src/lib/utils";

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("rounded-2xl border border-black/10 theme-bg-surface p-5 shadow-sm shadow-black/20", className)}>
      {children}
    </div>
  );
}






