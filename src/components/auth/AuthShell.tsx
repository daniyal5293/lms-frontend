import Image from "next/image";
import type { ReactNode } from "react";

const highlights = [
  "Attendance and results in one place",
  "Fee challans with due dates",
  "Real-time notices from your campus",
];

/** Branded two-panel layout shared by the sign-in and password-reset pages. */
export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="grid min-h-screen theme-bg-page lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel (large screens) */}
      <aside className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between" style={{ background: "linear-gradient(145deg, #0b8a44 0%, #0a7f3f 45%, #0b4a29 100%)" }}>
        <div aria-hidden="true" className="tcf-drift absolute -left-24 -top-24 h-80 w-80 rounded-full bg-white/10 blur-2xl" />
        <div aria-hidden="true" className="tcf-drift absolute -bottom-32 right-[-6rem] h-96 w-96 rounded-full bg-black/10 blur-3xl" style={{ animationDelay: "-6s" }} />
        <div aria-hidden="true" className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)", backgroundSize: "22px 22px" }} />

        <div className="relative z-10 p-12">
          <p className="tcf-fade-up text-sm font-medium uppercase tracking-[0.25em] text-white/80">The Citizens Foundation</p>
        </div>

        <div className="relative z-10 px-12">
          <Image src="/tcf-mark-white.png" alt="" width={150} height={117} priority className="tcf-float mb-10 drop-shadow-lg" />
          <h2 className="tcf-fade-up tcf-delay-1 max-w-md text-4xl font-semibold leading-tight text-white">
            Learning that grows with every student.
          </h2>
          <ul className="mt-8 space-y-3">
            {highlights.map((item, index) => (
              <li key={item} className={`tcf-fade-up flex items-center gap-3 text-white/90 tcf-delay-${index + 1}`}>
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15 text-xs" aria-hidden="true">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 p-12 text-sm text-white/70">TCF Campus · Qayyum-Abad</p>
      </aside>

      {/* Form panel */}
      <main className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="tcf-fade-up mb-8 flex justify-center">
            <Image src="/tcf-logo.png" alt="The Citizens Foundation" width={260} height={98} priority className="h-auto w-56 sm:w-64" />
          </div>

          <div className="tcf-fade-up tcf-delay-1 rounded-3xl border border-black/5 theme-bg-surface p-7 shadow-xl shadow-black/5 sm:p-8">
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] theme-text-primary">TCF Campus</p>
              <h1 className="mt-2 text-2xl font-semibold theme-text sm:text-3xl">{title}</h1>
              <p className="mt-2 text-sm theme-text-muted">{subtitle}</p>
            </div>
            {children}
          </div>

          <p className="tcf-fade-up tcf-delay-2 mt-6 text-center text-xs theme-text-muted">
            © {new Date().getFullYear()} The Citizens Foundation. All rights reserved.
          </p>
        </div>
      </main>
    </div>
  );
}
