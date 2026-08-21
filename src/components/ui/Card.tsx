import type { ReactNode } from "react";
import { cn } from "@/src/lib/utils";

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("rounded-2xl border border-white/10 bg-[#171717] p-5 shadow-sm shadow-black/20", className)}>
      {children}
    </div>
  );
}
