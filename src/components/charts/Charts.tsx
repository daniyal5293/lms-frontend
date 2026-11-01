"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { Card } from "@/src/components/ui/Card";
import { cn } from "@/src/lib/utils";

/*
 * Dashboard charts, built without a chart library. Status colours were checked with the dataviz palette
 * validator (adjacent colour-blind separation >= 8) in this order; amber is under 3:1 on white, so every
 * use also has a visible label.
 */
export const chartColors = {
  primary: "var(--primary)",
  present: "#0a7f3f",
  late: "#eda100",
  leave: "#2a78d6",
  absent: "#d03b3b",
};

export type Segment = { label: string; value: number; color: string };
type TableView = { head: string[]; rows: (string | number)[][] };

export function StatTile({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <Card className="px-3 py-2.5">
      <p className="truncate text-xs theme-text-muted">{label}</p>
      <p className="mt-0.5 text-xl font-semibold leading-tight theme-text">{value}</p>
      {hint ? <p className="mt-0.5 truncate text-[11px] theme-text-muted">{hint}</p> : null}
    </Card>
  );
}

export function ChartCard({
  title,
  subtitle,
  table,
  className,
  children,
}: {
  title: string;
  subtitle?: string;
  table?: TableView;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Card className={cn("min-w-0", className)}>
      <h3 className="text-sm font-semibold theme-text">{title}</h3>
      {subtitle ? <p className="text-xs theme-text-muted">{subtitle}</p> : null}
      <div className="mt-2.5">{children}</div>
      {table && table.rows.length > 0 ? (
        <details className="mt-2 text-xs theme-text-soft">
          <summary className="cursor-pointer select-none theme-text-muted">View as table</summary>
          <div className="mt-1 overflow-x-auto">
            <table className="w-full tabular-nums">
              <thead>
                <tr className="theme-text-muted">
                  {table.head.map((cell) => (
                    <th key={cell} className="px-1.5 py-1 text-left font-medium">
                      {cell}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row) => (
                  <tr key={String(row[0])} className="border-t border-black/5">
                    {row.map((cell, index) => (
                      <td key={index} className="px-1.5 py-1">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      ) : null}
    </Card>
  );
}

export function EmptyChart({ message }: { message: string }) {
  return <p className="rounded-md border border-dashed border-black/10 px-3 py-5 text-center text-xs theme-text-muted">{message}</p>;
}

function Tip({ children }: { children: ReactNode }) {
  return (
    <span
      role="tooltip"
      className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-md theme-bg-secondary px-2 py-1 text-[11px] leading-tight theme-text-on-primary shadow group-hover:block group-focus:block"
    >
      {children}
    </span>
  );
}

/** Horizontal bars with the value at the tip. Use max={100} for percentages. */
export function BarList({
  rows,
  max,
  format = (value) => String(value),
}: {
  rows: { label: string; value: number; note?: string }[];
  max?: number;
  format?: (value: number) => string;
}) {
  const top = max ?? Math.max(...rows.map((row) => row.value), 1);
  const hasNotes = rows.some((row) => row.note);

  return (
    <div className="space-y-1 text-xs">
      {rows.map((row) => (
        <div key={row.label} className={cn("grid items-center gap-2", hasNotes ? "grid-cols-[minmax(0,9.5rem)_minmax(0,1fr)_auto]" : "grid-cols-[minmax(0,9.5rem)_minmax(0,1fr)]")}>
          <span className="truncate theme-text-soft" title={row.label}>
            {row.label}
          </span>
          <div className="flex h-4 items-center gap-1.5 border-l border-[color:var(--border)]">
            {row.value > 0 ? (
              <div className="h-3 rounded-r" style={{ width: `calc((100% - 3rem) * ${row.value / top})`, minWidth: 2, background: chartColors.primary }} />
            ) : null}
            <span className="whitespace-nowrap font-medium tabular-nums theme-text">{format(row.value)}</span>
          </div>
          {hasNotes ? <span className="whitespace-nowrap theme-text-muted">{row.note}</span> : null}
        </div>
      ))}
    </div>
  );
}

export function Legend({ segments, format }: { segments: Segment[]; format?: (value: number) => string }) {
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs theme-text-soft">
      {segments.map((segment) => (
        <span key={segment.label} className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: segment.color }} />
          {segment.label}
          {format ? <span className="font-medium tabular-nums theme-text">{format(segment.value)}</span> : null}
        </span>
      ))}
    </div>
  );
}

/** One bar split into parts of a whole, separated by a 2px gap. */
export function StackedBar({ segments, format = String }: { segments: Segment[]; format?: (value: number) => string }) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  const visible = segments.filter((segment) => segment.value > 0);

  return (
    <div className="flex h-3.5 gap-0.5">
      {visible.map((segment, index) => (
        <div
          key={segment.label}
          tabIndex={0}
          aria-label={`${segment.label}: ${format(segment.value)}`}
          className={cn("group relative outline-none", index === 0 && "rounded-l", index === visible.length - 1 && "rounded-r")}
          style={{ width: `${(segment.value / total) * 100}%`, minWidth: 3, background: segment.color }}
        >
          <Tip>
            <strong>{format(segment.value)}</strong> {segment.label} ({Math.round((segment.value / total) * 100)}%)
          </Tip>
        </div>
      ))}
    </div>
  );
}

/** Vertical columns with the total on the cap; several segments stack. */
export function ColumnChart({
  rows,
  format = String,
}: {
  rows: { label: string; segments: Segment[] }[];
  format?: (value: number) => string;
}) {
  const totals = rows.map((row) => row.segments.reduce((sum, segment) => sum + segment.value, 0));
  const top = Math.max(...totals, 1);

  return (
    <div className="flex items-stretch gap-1.5">
      {rows.map((row, index) => (
        <div key={row.label} className="flex min-w-0 flex-1 flex-col items-center">
          <div
            tabIndex={0}
            aria-label={`${row.label}: ${format(totals[index])}`}
            className="group relative flex h-28 w-full flex-col items-center justify-end border-b border-[color:var(--border)] outline-none"
          >
            <span className="mb-0.5 text-[11px] font-medium tabular-nums theme-text">{format(totals[index])}</span>
            <div className="flex w-full max-w-6 flex-col gap-0.5" style={{ height: `${(totals[index] / top) * 78}%` }}>
              {[...row.segments].reverse().filter((segment) => segment.value > 0).map((segment, position) => (
                <div key={segment.label} className={position === 0 ? "rounded-t" : ""} style={{ flexGrow: segment.value, background: segment.color }} />
              ))}
            </div>
            <Tip>
              {row.segments.map((segment) => (
                <span key={segment.label} className="block">
                  <strong>{format(segment.value)}</strong> {segment.label}
                </span>
              ))}
            </Tip>
          </div>
          <span className="mt-1 w-full truncate text-center text-[11px] theme-text-muted" title={row.label}>
            {row.label}
          </span>
        </div>
      ))}
    </div>
  );
}

/** A 0-100% line with a crosshair; hover, focus and arrow keys all read a point. */
export function PercentLine({ points, seriesLabel }: { points: { label: string; value: number; note?: string }[]; seriesLabel: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    const element = box.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const height = 136;
  const pad = { left: 38, right: 38, top: 10, bottom: 20 };
  const plotWidth = Math.max(width - pad.left - pad.right, 1);
  const plotHeight = height - pad.top - pad.bottom;
  const x = (index: number) => pad.left + (points.length < 2 ? 0 : (index * plotWidth) / (points.length - 1));
  const y = (value: number) => pad.top + (1 - value / 100) * plotHeight;
  const line = points.map((point, index) => `${index === 0 ? "M" : "L"}${x(index)},${y(point.value)}`).join(" ");
  const area = `${line} L${x(points.length - 1)},${y(0)} L${x(0)},${y(0)} Z`;
  const labelEvery = Math.max(1, Math.ceil(points.length / Math.max(Math.floor(plotWidth / 56), 1)));
  const last = points.length - 1;
  const shown = active === null ? null : points[active];

  const onMove = (event: PointerEvent<HTMLDivElement>) => {
    const left = event.currentTarget.getBoundingClientRect().left;
    const step = plotWidth / Math.max(last, 1);
    setActive(Math.min(last, Math.max(0, Math.round((event.clientX - left - pad.left) / step))));
  };

  const onKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowRight") setActive((current) => Math.min(last, (current ?? -1) + 1));
    if (event.key === "ArrowLeft") setActive((current) => Math.max(0, (current ?? last + 1) - 1));
  };

  return (
    <div
      ref={box}
      tabIndex={0}
      role="img"
      aria-label={`${seriesLabel}: latest ${points[last]?.value}%`}
      className="relative outline-none"
      onPointerMove={onMove}
      onPointerLeave={() => setActive(null)}
      onFocus={() => setActive(last)}
      onBlur={() => setActive(null)}
      onKeyDown={onKey}
    >
      {width > 0 ? (
        <svg width={width} height={height} className="block">
          {[0, 50, 100].map((tick) => (
            <g key={tick}>
              <line x1={pad.left} x2={pad.left + plotWidth} y1={y(tick)} y2={y(tick)} stroke="var(--border)" />
              <text x={pad.left - 6} y={y(tick) + 3.5} textAnchor="end" fontSize={11} fill="var(--muted)">
                {tick}%
              </text>
            </g>
          ))}
          <path d={area} fill={chartColors.primary} opacity={0.1} />
          <path d={line} fill="none" stroke={chartColors.primary} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {points.map((point, index) =>
            index % labelEvery === 0 ? (
              <text key={point.label} x={x(index)} y={height - 5} textAnchor="middle" fontSize={11} fill="var(--muted)">
                {point.label}
              </text>
            ) : null,
          )}
          <circle cx={x(last)} cy={y(points[last].value)} r={4} fill={chartColors.primary} stroke="var(--surface)" strokeWidth={2} />
          <text x={x(last) + 8} y={y(points[last].value) + 4} fontSize={11} fontWeight={600} fill="var(--foreground)">
            {Math.round(points[last].value)}%
          </text>
          {active !== null ? (
            <>
              <line x1={x(active)} x2={x(active)} y1={pad.top} y2={y(0)} stroke="var(--muted)" />
              <circle cx={x(active)} cy={y(points[active].value)} r={4} fill={chartColors.primary} stroke="var(--surface)" strokeWidth={2} />
            </>
          ) : null}
        </svg>
      ) : (
        <div style={{ height }} />
      )}
      {shown && active !== null ? (
        <div
          className="pointer-events-none absolute top-0 z-20 -translate-x-1/2 whitespace-nowrap rounded-md theme-bg-secondary px-2 py-1 text-[11px] leading-tight theme-text-on-primary shadow"
          style={{ left: Math.min(Math.max(x(active), 60), Math.max(width - 60, 60)) }}
        >
          <strong>{shown.value}%</strong> week of {shown.label}
          {shown.note ? <span className="block opacity-80">{shown.note}</span> : null}
        </div>
      ) : null}
    </div>
  );
}
