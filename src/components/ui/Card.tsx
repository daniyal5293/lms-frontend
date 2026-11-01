import type { ReactNode } from "react";
import { cn } from "@/src/lib/utils";

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("rounded-lg border border-black/10 theme-bg-surface p-3 shadow-sm shadow-black/5", className)}>
      {children}
    </div>
  );
}






