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
    <div className="mb-3 flex flex-col gap-2 border-b border-black/10 pb-2.5 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="text-lg font-semibold leading-tight theme-text md:text-xl">{title}</h1>
        {description ? <p className="mt-0.5 text-xs theme-text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}






