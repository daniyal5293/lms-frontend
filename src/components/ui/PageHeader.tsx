import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 border-b border-black/10 pb-5 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="text-2xl font-semibold theme-text md:text-3xl">{title}</h1>
        {description ? <p className="mt-2 text-sm theme-text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
    </div>
  );
}






